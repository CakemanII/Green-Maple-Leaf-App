from io import TextIOWrapper

import json
from typing import Callable, Any
import uuid
import os
from file_handler import FileHandler
import time
import threading

from radio_communication_manager import TimeStamped

DataPoint = tuple[float, list[float]]
ProcessedDataPoint = DataPoint
ReceivedDataPoint = DataPoint

ProcessedTelemetryID = str
InputTelemetryID = str

class TelemetryDataManager:
    def __init__(self, input_telemetries_file_path: str, processed_telemetries_file_path: str, local_telemetry_save_path: str, send_processed_data_to_web_clients_callback: Callable[[ProcessedTelemetryID, ProcessedDataPoint], None]):
        self._data_process_queue: list[tuple[InputTelemetryID, ReceivedDataPoint]] = []

        # Set variables
        self._input_telemetries_path = input_telemetries_file_path
        self._processed_telemetries_path = processed_telemetries_file_path
        self._local_telemetry_save_path = local_telemetry_save_path
        self._send_telemetry_data_to_web_clients_callback = send_processed_data_to_web_clients_callback

        # Load the telemetry data types from the given paths
        self._input_telemetry_data_types = self._load_json_data(self._input_telemetries_path)
        self._processed_telemetry_data_types = self._load_json_data(self._processed_telemetries_path)

        # Setup telemetry data file save sessions dict
        self._telemetry_save_file_sessions: dict[str, TextIOWrapper] = {}

        # Generate the launch UUID for this session
        self._launch_uuid = self._generate_launch_uuid()

        # Initialize the telemetry directory for this launch
        self._initialize_telemetry_directory()

        # Declare variables for registering types
        self._input_telemetry_ids: list[str] = []
        # input_telemetry_id: (processor, output_telemetry_id)
        self._output_telemetry_processor_data: dict[str, list[Callable[[Any], Any]]] = {}

        # Declare variables for storing previous telemetry data for derivative, integral, and other processing that requires the previous data point.
        # Also used for determining mean of the data set.
        self._previous_telemetry_data: dict[str, tuple[float, list[float]]] = {}

        # Setup registration for input telemetry data types
        self._setup_input_telemetry_registration()
    
        # Start the telemetry data processing thread
        self._processing_thread = threading.Thread(target=self.process_telemetry_data_queue, daemon=True)
        self._processing_thread.start()

    #region File Setup
    def _load_json_data(self, path):
        return json.load(open(path, 'r', encoding='utf-8'))

    def _initialize_telemetry_directory(self) -> None:
        """
        Initialize the telemetry directory.
        """
        self._receiving_telemetry_path = os.path.join(self._local_telemetry_save_path, self._launch_uuid, "receiving")
        os.makedirs(self._receiving_telemetry_path, exist_ok=True)
        self._processed_telemetry_path = os.path.join(self._local_telemetry_save_path, self._launch_uuid, "processed")
        os.makedirs(self._processed_telemetry_path, exist_ok=True)

    def _generate_launch_uuid(self) -> str:
        """
        Generates a UUID for each new launch.
        """
        return str(uuid.uuid4())
    #endregion

    #region Telemetry Registration
    def _setup_input_telemetry_registration(self) -> None:
        """
        Setup the input telemetry registration system.
        """
        # Iterate through each telemetry category in the input telemetry data types
        for telemetry_category in self._input_telemetry_data_types:
            # Iterate through each telemetry data type in the category
            for telemetry_data_type in telemetry_category:
                # Create ID
                telemetry_id = f"{telemetry_category}.{telemetry_data_type}"

                # Ensure the telemetry data type is not already registered
                if telemetry_id in self._input_telemetry_ids:
                    raise ValueError(f"Telemetry data type '{telemetry_id}' is already registered.")

                # Add the id to the list of registered telemetry data types
                self._input_telemetry_ids.append(telemetry_id)

    def register_telemetry_processor(self, input_telemetry_id: InputTelemetryID, processor_function: callable = None, output_processed_id: ProcessedTelemetryID = None) -> None:
        """
        Register a telemetry processor function for a specific input telemetry data type.
        """
        # Ensure all information is input correctly.
        if (processor_function is not None and output_processed_id is not None):
            print(f"WARNING: Registering processor function for input telemetry data type '{input_telemetry_id}' with output processed telemetry ID '{output_processed_id}'. Ignoring output processed telemetry id.")

        if (processor_function is None and output_processed_id is None):
            raise ValueError(f"Must provide at least a processor function or an output processed telemetry ID when registering a telemetry processor for input telemetry data type '{input_telemetry_id}'. Provided processor function: {processor_function}, provided output processed telemetry ID: {output_processed_id}")

        # Ensure the input telemetry data type is registered
        if input_telemetry_id not in self._input_telemetry_ids:
            raise ValueError(f"Input telemetry data type '{input_telemetry_id}' is not registered. Please ensure it is defined in the input telemetry data types JSON file.")

        # Set the processor function to just return the input data if no processor function is provided
        if processor_function is None:
            def proc_func(input_data: Any):
                self._save_telemetry_data(input_data, telemetry_id=output_processed_id)

            processor_function = proc_func

        # If a processor function is provided, ensure it is callable and inputs/outputs correct data types
        if not callable(processor_function):
            raise ValueError(f"Processor function for input telemetry data type '{input_telemetry_id}' is not a valid callable function. Please ensure it is a function that takes in one argument and returns a value of the correct data type.")

        # If the processed output telemetry ID is already registered, append the processor function to the list of processors for that output ID
        if input_telemetry_id in self._output_telemetry_processor_data:
            self._output_telemetry_processor_data[input_telemetry_id].append(processor_function)
        # Otherwise, create a new entry for the processed output telemetry ID with the processor function
        else:
            self._output_telemetry_processor_data[input_telemetry_id] = [processor_function]
    #endregion

    def get_previous_telemetry_data(self, telemetry_id: ProcessedTelemetryID) -> ProcessedDataPoint | None:
        """
        Get the previous telemetry data for the given telemetry ID.
        """
        return self._previous_telemetry_data.get(telemetry_id, None)

    def _save_telemetry_data(self, telemetry_data: DataPoint, telemetry_id: ProcessedTelemetryID | ReceivedDataPoint, is_processed: bool = False) -> None:
        """
        Save the given telemetry data to the local telemetry save path with the appropriate file structure.
        """
        # If a telemetry ID is provided, save the telemetry data as the previous data for that ID
        self._previous_telemetry_data[telemetry_id] = telemetry_data

        # Save the telemetry data to the local telemetry save path with the appropriate file structure
        save_path = os.path.join((self._processed_telemetry_path if is_processed else self._receiving_telemetry_path), f"{telemetry_id}.csv")

        # Helper to format CSV row
        csv_row = f"{telemetry_data[0]},{','.join(map(str, telemetry_data[1]))}\n"

        # Check if the file is already being edited in a session.
        if telemetry_id in self._telemetry_save_file_sessions:
            # Use the session instead of creating a new one each time.
            session_file = self._telemetry_save_file_sessions[telemetry_id]
            session_file.write(csv_row)
            session_file.flush()  # Ensure the data is written to the file

        elif FileHandler.check_file_exists(save_path):
            # If the file exists, append the new telemetry data to the existing file
            file_session = open(save_path, 'a', encoding='utf-8')
            file_session.write(csv_row)
            file_session.flush()  # Ensure the data is written to the file
            self._telemetry_save_file_sessions[telemetry_id] = file_session
        else:
            # If the file doesn't exist, create it with header labels
            file_session = open(save_path, 'w', encoding='utf-8')

            # Get labels of the data
            category, data_type = telemetry_id.split('.')[:2]
            if is_processed:
                data_labels = self._processed_telemetry_data_types[category][data_type]
            else:
                data_labels = self._input_telemetry_data_types[category][data_type]

            # Write the labels as the first line of the file, then write the telemetry data on the next line
            file_session.write(f"{data_labels}\n{csv_row}")
            file_session.flush()  # Ensure the data is written to the file
            self._telemetry_save_file_sessions[telemetry_id] = file_session

    def process_incoming_telemetry_data(self, telemetry_id: InputTelemetryID, telemetry_data: TimeStamped[ReceivedDataPoint]) -> None:
        """
        Process incoming telemetry data by applying any registered processor functions for the given telemetry ID and saving the processed data.
        """
        # Ensure the input telemetry data type is registered
        if telemetry_id not in self._input_telemetry_ids:
            raise ValueError(f"Input telemetry data type '{telemetry_id}' is not registered. Please ensure it is defined in the input telemetry data types JSON file.")

        self._data_process_queue.append((telemetry_id, telemetry_data))

    def process_telemetry_data_queue(self) -> None:
        """
        Process the telemetry data in the queue by applying any registered processor functions for each telemetry ID and saving the processed data.
        """
        while True:
            if not self._data_process_queue:
                time.sleep(0.04)  # Sleep briefly to prevent blocking other operations
                continue

            telemetry_id, telemetry_data = self._data_process_queue.pop(0)

            # Get the processor functions for the given telemetry ID
            processor_functions = self._output_telemetry_processor_data.get(telemetry_id, [])

            # Apply each processor function to the telemetry data
            for processor_function in processor_functions:
                processor_function(telemetry_data)

            time.sleep(0.04)  # Sleep briefly to prevent blocking other operations

class DerivativeIntegralProcessors:

    @staticmethod
    def process_derivatives(telemetryDataManager: TelemetryDataManager, input_data: ReceivedDataPoint, previous_data: ReceivedDataPoint | None, derivative_count: int = 1, derivative_labels: list[str] = None):
        """
        Process the derivative of the given data.
        @param input_data: A tuple containing the timestamp and a list of float values representing the telemetry data.
        @param previous_data: The previous telemetry data entry.
        @param derivative_count: The number of times to apply the derivative function. For example, if derivative_count is 2, the function will compute the second derivative of the data.
        @param derivative_labels: A list of labels for the derivatives.
        """
        # Ensure the derivative count matches the number of derivative labels provided
        if derivative_count < 1:
            raise ValueError(f"Derivative count must be at least 1. Provided value: {derivative_count}")

        if derivative_count > 1 and (derivative_labels is None or len(derivative_labels) != derivative_count - 1):
            raise ValueError(f"Derivative labels must be provided for each derivative beyond the first. Provided derivative count: {derivative_count}, provided derivative labels: {derivative_labels}")

        # Initialize the current data to be the input data
        current_base_data: DataPoint | None = None

        # Iterate through each derivative
        current_approximation: DataPoint | None = None
        for i in range(derivative_count):
            # Get the current data.
            current_base_data = input_data if i == 0 else current_approximation

            # Get the previous data
            current_previous_data: DataPoint | None = previous_data if i == 0 else telemetryDataManager.get_previous_telemetry_data(derivative_labels[i - 1])

            # If there is no previous data, we cannot compute the derivative, so return None
            if current_previous_data is None:
                print(f"Cannot compute derivative for derivative count {i + 1} because there is no previous data available for the current data. Current base data timestamp: {current_base_data[0]}, current previous data: {current_previous_data}")
                return None

            # Compute the derivative
            current_approximation: DataPoint = DerivativeIntegralProcessors._compute_derivative(current_base_data, current_previous_data)
            if current_approximation is None:
                print(f"Derivative computation returned None for derivative count {i + 1}. This may be due to a zero time delta between the current data and the previous data. Current base data timestamp: {current_base_data[0]}, current previous data timestamp: {current_previous_data[0]}")
                return None

            # Save the intermediate derivative data if requested
            telemetryDataManager._save_telemetry_data(current_approximation, derivative_labels[i], is_processed=True)

    @staticmethod
    def _compute_derivative(original_current_data: DataPoint, original_previous_data: DataPoint) -> DataPoint | None:
        """
        Compute the derivative of the given data.
        """
        # Compute the delta time between the current data and the previous data
        timedelta: float = original_current_data[0] - original_previous_data[0]

        # Ensure the time delta is not zero to avoid division by zero
        if timedelta == 0:
            return None

        # Compute the derivative for each unit of data.
        derivative_data: list[float] = []
        for i in range(len(original_current_data[1])):
            derivative_data.append((original_current_data[1][i] - original_previous_data[1][i]) / timedelta)

        # Return the derivative data as a tuple of the current timestamp and the list of derivative values.
        return (original_current_data[0], derivative_data)

    @staticmethod
    def _compute_integral(original_current_data: ReceivedDataPoint, previous_data: ReceivedDataPoint, previous_integral: ProcessedDataPoint) -> ProcessedDataPoint | None:
        """
        Compute the integral of the given data.
        """
        # Compute the time delta between the current data and the previous data
        timedelta: float = original_current_data[0] - previous_data[0]

        # Ensure the time delta is not zero to avoid division by zero
        if timedelta == 0:
            return None

        # Compute the integral for each unit of data.
        integral_data: list[float] = []
        for i in range(len(original_current_data[1])):
            new_integral: float = previous_integral[1][i] + (original_current_data[1][i] + previous_data[1][i]) / 2 * timedelta
            integral_data.append(new_integral)

        # Return the integral data as a tuple of the current timestamp and the list of integral values.
        return (original_current_data[0], integral_data)
