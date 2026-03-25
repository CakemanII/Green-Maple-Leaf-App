from typing import TypedDict
import threading
import time

from queue import Queue

class IncomingTelemetryRadioObject(TypedDict):
    input_id: str
    sent_timestamp: float
    data: object

class TelemetryDataQueue(Queue):
    def __init__(self, operations_per_second: float, data_handler: callable):
        super().__init__(operations_per_second, data_handler, "Telemetry Input Data")
