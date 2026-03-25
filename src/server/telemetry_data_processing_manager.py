from typing import Callable
from server.telemetry_data_cache_manager import TelemetryDataCacheManager
from telemetry_data_saving import TelemetrySaveQueue

from data_types import ProcessedTelemetryID, InputTelemetryID

SingleInputHandler = Callable[[object], object]
MultiProcessedInputHandler = Callable[[dict[ProcessedTelemetryID, object]], object]

class Utils:
    @staticmethod 
    def load_json(filepath: str) -> dict:
        import json
        with open(filepath, 'r') as f:
            return json.load(f)

class TelemetryDataProcessingManager:
    def __init__(self, save_queue: TelemetrySaveQueue, cache: TelemetryDataCacheManager):
        # Create variables
        self._accpetable_input_ids: list[InputTelemetryID] = [] # List of input IDs to process
        self._acceptable_processed_ids: list[ProcessedTelemetryID] = [] # List of already processed input IDs

        self._single_input_handler_mapping: dict[InputTelemetryID, SingleInputHandler] = {} # Mapping of input IDs to their processing functions
        self._multi_processed_input_handler_mapping: dict[list[ProcessedTelemetryID], MultiProcessedInputHandler] = {} # Mapping of processed IDs to the input IDs they depend on

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

    def register_single_input_handler(self, input_id: InputTelemetryID, handler: SingleInputHandler | str):
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

            def func(data, _):
                # Save the telemetry data
                # ...
                pass
            handler_function = func
        # Use the provided handler function
        elif callable(handler):
            handler_function = handler
        else:
            raise ValueError("Handler must be a callable function or a valid string identifier.")
        
        # Register the handler function for the input ID
        self._single_input_handler_mapping[input_id] = handler_function

    def _main(self):
        """
        Main loop for processing telemetry data at a fixed rate.
        """
        pass