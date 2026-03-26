from task_queue import Queue
from data_types import ProcessedTelemetryID, ProcessedDataPoint
from typing import Callable

class SendDataToClientsQueue(Queue):
    def __init__(self, operations_per_second: float, send_data_callback: Callable[[ProcessedTelemetryID, ProcessedDataPoint], None]):
        super().__init__(operations_per_second, self._data_handler, "Send Data To Clients")
        self.send_data_callback = send_data_callback

    def _data_handler(self, queueObject: tuple[ProcessedTelemetryID, ProcessedDataPoint]):
        processed_id, data_point = queueObject
        self.send_data_callback(processed_id, data_point)