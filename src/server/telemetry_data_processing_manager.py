import threading
from typing import Callable
import time
from telemetry_data_cache_manager import TelemetryDataCacheManager
from telemetry_data_saving import TelemetrySaveQueue
from telemetry_data_to_clients import SendDataToClientsQueue

from data_types import ProcessedTelemetryID, ProcessedDataPoint, InputTelemetryID, InputDataPoint

TelemetryDataProcessingManager = None # Placeholder for type hinting, will be properly defined later to avoid circular import issues
SingleInputHandler = Callable[[InputTelemetryID, InputDataPoint], list[ProcessedTelemetryID]]
SingleProcessedHandler = Callable[[], list[ProcessedTelemetryID]]
# Function that inputs multiple processed inputs and outputs one processed input
MultiProcessedInputHandler = Callable[[], list[ProcessedTelemetryID]]

class Utils:
    @staticmethod
    def load_json(filepath: str) -> dict:
        import json
        with open(filepath, 'r') as f:
            return json.load(f)

class TelemetryDataProcessingManager:
    def __init__(self, save_queue: TelemetrySaveQueue, cache: TelemetryDataCacheManager, send_to_clients_queue: SendDataToClientsQueue):
        self._save_queue: TelemetrySaveQueue = save_queue
        self._cache: TelemetryDataCacheManager = cache
        self._send_to_clients_queue: SendDataToClientsQueue = send_to_clients_queue  # Optional queue for sending data to web clients

        # Create variables
        self._accpetable_input_ids: list[InputTelemetryID] = [] # List of input IDs to process
        self._acceptable_processed_ids: list[ProcessedTelemetryID] = [] # List of already processed input IDs

        self._single_input_handler_mapping: dict[InputTelemetryID, list[SingleInputHandler]] = {} # Mapping of input IDs to their processing functions
        self._single_processed_handler_mapping: dict[ProcessedTelemetryID, list[SingleProcessedHandler]] = {} # Mapping of processed IDs to their processing functions
        self._multi_processed_handler_mapping: list[tuple[list[ProcessedTelemetryID], MultiProcessedInputHandler, list[float]]] = [] # Mapping of processed IDs to the input IDs they depend on

        # Load and create telemetry ids
        self._input_telemetries_types_filepath = "saves/telemetry/telemetry_data_transfer_types.json"
        self._processed_telemetries_types_filepath = "saves/telemetry/telemetry_types.json"
        self._create_input_telemetry_ids()
        self._create_processed_telemetry_ids()
    
    # region Create Telemetry ID Methods
    def _create_input_telemetry_ids(self):
        """
        Create the input telemetry IDs from the JSON file.
        """
        input_telemetry_types = Utils.load_json(self._input_telemetries_types_filepath)
        for category in input_telemetry_types:
            for telemetry in input_telemetry_types[category]:
                full_id: str = f"{category}.{telemetry}"
                self._accpetable_input_ids.append(full_id)

    def _create_processed_telemetry_ids(self):
        """
        Create the processed telemetry IDs from the JSON file.
        """
        processed_telemetry_types = Utils.load_json(self._processed_telemetries_types_filepath)
        for category in processed_telemetry_types:
            for telemetry in processed_telemetry_types[category]:
                full_id: str = f"{category}.{telemetry}"
                self._acceptable_processed_ids.append(full_id)
    # endregion

    # region Checkers
    def _is_input_id_acceptable(self, input_id: InputTelemetryID) -> bool:
        """
        Check if the input telemetry ID is acceptable for processing.
        """
        return input_id in self._accpetable_input_ids

    def _is_processed_id_acceptable(self, processed_id: ProcessedTelemetryID) -> bool:
        """
        Check if the processed telemetry ID is acceptable for processing.
        """
        return processed_id in self._acceptable_processed_ids
    # endregion

    def register_single_input_handler(self, input_id: InputTelemetryID, handler: SingleInputHandler | str) -> None:
        """
        Registers single input handler functions for specific input telemetry IDs.
        If a string is provided instead of a handler function, the handler will be straight through, no changes to data.
        """
        handler_function: SingleInputHandler = None
        # Create a straight through function
        if isinstance(handler, str):
            # Check if the output ID is acceptable
            if not self._is_processed_id_acceptable(handler):
                raise ValueError(f"Processed telemetry ID '{handler}' is not acceptable.")

            def func(_, data):
                # Save the telemetry data
                self._save_queue.add_to_queue((True, handler, data))
                # Update the cache
                self._cache.update_cache(handler, data)
                # Send to web clients
                self._send_to_clients_queue.add_to_queue((handler, data))
                return [handler]

            handler_function = func
        # Use the provided handler function
        elif callable(handler):
            handler_function = handler
        else:
            raise ValueError("Handler must be a callable function or a valid string identifier.")

        # Register the handler function for the input ID
        self._single_input_handler_mapping.setdefault(input_id, []).append(handler_function)

    def register_single_processed_handler(self, processed_id: ProcessedTelemetryID, handler: SingleProcessedHandler) -> None:
        """
        Registers single processed handler functions for specific processed telemetry IDs.
        The handler function will be called when the specified processed telemetry ID has new data in the cache.
        """
        # Check if the processed ID is acceptable
        if not self._is_processed_id_acceptable(processed_id):
            raise ValueError(f"Processed telemetry ID '{processed_id}' is not acceptable.")
        
        # Register the handler function for the processed ID
        self._single_processed_handler_mapping.setdefault(processed_id, []).append(handler)

    def register_multi_processed_handler(self, processed_ids: list[ProcessedTelemetryID], handler: MultiProcessedInputHandler) -> None:
        """
        Registers multi processed input handler functions for specific processed telemetry IDs.
        The handler function will be called when all of the specified processed telemetry IDs have new data in the cache.
        """
        # Check if all processed IDs are acceptable
        for processed_id in processed_ids:
            if not self._is_processed_id_acceptable(processed_id):
                raise ValueError(f"Processed telemetry ID '{processed_id}' is not acceptable.")
        
        # Register the handler function for the processed IDs
        self._multi_processed_handler_mapping.append((processed_ids, handler, [0.0] * len(processed_ids)))

    def process_new_input_data(self, input_id: InputTelemetryID, new_data: object) -> None:
        """
        Run all single and multi processors on specific data.
        """
        # Check if the input ID is acceptable
        if not self._is_input_id_acceptable(input_id):
            raise ValueError(f"Input telemetry ID '{input_id}' is not acceptable.")

        # Process single input handlers
        new_ids: list[ProcessedTelemetryID] = []
        if input_id in self._single_input_handler_mapping:
            for handler_function in self._single_input_handler_mapping[input_id]:
                new_ids = handler_function(self, input_id, new_data)

        # Process single processed handlers
        for new_id in new_ids:
            self._process_all_related_processed_handlers(new_id)

    def _process_all_related_processed_handlers(self, processed_id: ProcessedTelemetryID) -> None:
        # Process single processed handlers
        cache: ProcessedDataPoint = self._cache.get_cache_data(processed_id)
        if not cache:
            return

        new_ids: list[ProcessedTelemetryID] = self._process_single_processed_handler(self)
        for new_id in new_ids:
            self._process_all_related_processed_handlers(new_id)

        # Check multi processed handlers
        for new_id in new_ids:
            for item in self._multi_processed_handler_mapping:
                processed_ids, handler_function, last_run_times = item
                if new_id in processed_ids:
                    # Check if there are newer data points for the input processed IDs
                    can_run = True
                    for i, input_processed_id in enumerate(processed_ids):
                        cache_item = self._cache.get_cache_data(input_processed_id)
                        if not cache_item:
                            can_run = False
                            break
                        latest_datapoint_time = cache_item[0][0] # Get the timestamp of the latest data point for the input processed ID
                        if latest_datapoint_time <= last_run_times[i]: # Check if the latest data point is newer than the last run time for this input processed ID
                            can_run = False
                            break

                    if can_run:
                        # Run the multi processed input handler function
                        new_ids = handler_function()

                        # Update the last run times for the input processed IDs
                        for i, input_processed_id in enumerate(processed_ids):
                            cache_item = self._cache.get_cache_data(input_processed_id)
                            last_run_times[i] = cache_item[0][0] # Update the last run time to the timestamp of the latest data point for this input processed ID

                        # Process any new processed IDs generated by the multi processed input handler
                        for new_id in new_ids:
                            self._process_all_related_processed_handlers(new_id)

    def _process_single_processed_handler(self, telemetry_data_processing_manager: TelemetryDataProcessingManager, processed_id: ProcessedTelemetryID) -> list[ProcessedTelemetryID]:
        """
        Run all single processed handlers for a specific processed telemetry ID.
        """
        new_ids: list[ProcessedTelemetryID] = []
        if processed_id in self._single_processed_handler_mapping:
            for handler_function in self._single_processed_handler_mapping[processed_id]:
                new_ids = handler_function()

        return new_ids

class DerivativeHandlerCreator:
    def __init__(self, telemetry_data_processing_manager: TelemetryDataProcessingManager, processed_id: ProcessedTelemetryID, output_processed_id: ProcessedTelemetryID):
        self._telemetry_data_processing_manager = telemetry_data_processing_manager
        self._processed_id = processed_id
        self._output_processed_id = output_processed_id

    def handler(self) -> list[ProcessedTelemetryID]:
        if not self._processed_id or not self._output_processed_id:
            raise ValueError("Processed ID and output processed ID must be provided.")
        if not self._telemetry_data_processing_manager._is_processed_id_acceptable(self._processed_id):
            raise ValueError(f"Processed telemetry ID '{self._processed_id}' is not acceptable.")
        if not self._telemetry_data_processing_manager._is_processed_id_acceptable(self._output_processed_id):
            raise ValueError(f"Output processed telemetry ID '{self._output_processed_id}' is not acceptable.")
        
        # Check for previous cache data for the input processed ID
        cache_object: object = self._telemetry_data_processing_manager._cache.get_cache_data(self._processed_id)

        # Check for the previous derivative data for the output processed ID
        previous_derivative_cache_object: object = self._telemetry_data_processing_manager._cache.get_cache_data(self._output_processed_id)

        # If there is no cache data for the input processed ID, we cannot calculate the derivative, so return an empty list
        if not cache_object:
            return []
        
        # Get the latest data point for the input processed ID
        latest_datapoint: tuple[float, list[float]] = cache_object[0]
        latest_time: float = latest_datapoint[0]

        # If not previous data calculate with the previous derivative as zero.
        if not previous_derivative_cache_object:
            previous_derivative_datapoint: tuple[float, list[float]] = (latest_time, [0.0] * len(latest_datapoint[1]))
        else:
            previous_derivative_datapoint = previous_derivative_cache_object[0]

        # Calculate the derivative using the latest data point and the previous derivative data point
        time_diff = latest_time - previous_derivative_datapoint[0]
        if time_diff == 0:
            derivative_values = [0.0] * len(latest_datapoint[1])
        else:
            # Calculate
            derivative_values = [(latest_datapoint[1][i] - previous_derivative_datapoint[1][i]) / time_diff for i in range(len(latest_datapoint[1]))]

        # Save the derivative data to the cache and the save queue
        self._telemetry_data_processing_manager._save_queue.add_to_queue((True, self._output_processed_id, (latest_time, derivative_values)))
        self._telemetry_data_processing_manager._cache.update_cache(self._output_processed_id, (latest_time, derivative_values))

        # Send to web clients if queue is available
        self._telemetry_data_processing_manager._send_to_clients_queue.add_to_queue((self._output_processed_id, (latest_time, derivative_values)))

class IntegralHandlerCreator:
    def __init__(self, telemetry_data_processing_manager: TelemetryDataProcessingManager, processed_id: ProcessedTelemetryID, output_processed_id: ProcessedTelemetryID):
        self._telemetry_data_processing_manager = telemetry_data_processing_manager
        self._processed_id = processed_id
        self._output_processed_id = output_processed_id

    def handler(self) -> list[ProcessedTelemetryID]:
        if not self._processed_id or not self._output_processed_id:
            raise ValueError("Processed ID and output processed ID must be provided.")
        if not self._telemetry_data_processing_manager._is_processed_id_acceptable(self._processed_id):
            raise ValueError(f"Processed telemetry ID '{self._processed_id}' is not acceptable.")
        if not self._telemetry_data_processing_manager._is_processed_id_acceptable(self._output_processed_id):
            raise ValueError(f"Output processed telemetry ID '{self._output_processed_id}' is not acceptable.")
        
        # Check for previous cache data for the input processed ID
        cache_object: object = self._telemetry_data_processing_manager._cache.get_cache_data(self._processed_id)

        # If there is no cache data for the input processed ID, we cannot calculate the integral, so return an empty list
        if not cache_object:
            return []
        
        # Get the latest data point for the input processed ID
        latest_datapoint: tuple[float, list[float]] = cache_object[0]
        latest_time: float = latest_datapoint[0]

        # Get the previous integral data for the output processed ID, if it exists, otherwise use zero as the initial integral value
        previous_integral_cache_object: object = self._telemetry_data_processing_manager._cache.get_cache_data(self._output_processed_id)
        if not previous_integral_cache_object:
            previous_integral_datapoint: tuple[float, list[float]] = (latest_time, [0.0] * len(latest_datapoint[1]))
        else:
            previous_integral_datapoint = previous_integral_cache_object[0]

        # Calculate the integral using the latest data point and the previous integral data point
        time_diff = latest_time - previous_integral_datapoint[0]
        integral_values = [previous_integral_datapoint[1][i] + latest_datapoint[1][i] * time_diff for i in range(len(latest_datapoint[1]))]

        # Save the integral data to the cache and the save queue
        self._telemetry_data_processing_manager._save_queue.add_to_queue((True, self._output_processed_id, (latest_time, integral_values)))
        self._telemetry_data_processing_manager._cache.update_cache(self._output_processed_id, (latest_time, integral_values))

        # Send to web clients if queue is available
        self._telemetry_data_processing_manager._send_to_clients_queue.add_to_queue((self._output_processed_id, (latest_time, integral_values)))