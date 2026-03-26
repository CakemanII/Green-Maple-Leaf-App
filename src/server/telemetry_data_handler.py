from telemetry_data_cache_manager import TelemetryDataCacheManager
from telemetry_data_processing_manager import TelemetryDataProcessingManager
from telemetry_data_saving import TelemetrySaveQueue

from data_types import InputDataPoint, InputTelemetryID, ProcessedDataPoint, RadioDataObject

class TelemetryDataManager:
    """
    This class is responsible for handling telemetry data, including receiving new data points, processing them using registered handlers, and managing the cache of telemetry data.
    It interacts with the TelemetryDataProcessingManager to process new data points and generate new processed telemetry data.
    """
    def __init__(self):
        self._cache = TelemetryDataCacheManager() # Cache for telemetry data points, used for multi processed input handlers
        self._saving_manager = TelemetrySaveQueue(30) # Manager for saving telemetry data to files
        self._processing_manager = TelemetryDataProcessingManager(self._saving_manager, self._cache) # Manager for processing telemetry data and generating new processed data

        self._initialize_handlers()

    def receive_new_data_point(self, radio_data: RadioDataObject) -> None:
        # Convert radio data object to input telemetry ID and data point
        input_id: InputTelemetryID = radio_data.get("l")

        data_values: list[float] = radio_data.get("d")
        timestamp: float = radio_data.get("s")
        new_datapoint: InputDataPoint = (timestamp, data_values)

        self._processing_manager.process_new_input_data(input_id, new_datapoint)

    def _initialize_handlers(self):
        # Input handlers
        pass