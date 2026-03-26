import os
from task_queue import Queue

from data_types import *

SaveQueueObject = tuple[bool, ProcessedTelemetryID | InputTelemetryID, ProcessedDataPoint | InputDataPoint]

class TelemetrySaveQueue(Queue):
    def __init__(self, operations_per_second: FloatingPointError):
        super().__init__(operations_per_second, self._data_handler, "Telemetry Save Data")

        # Create list for keeping ongoing sessions for file saving, to reduce ram usage and increase performance
        self._ongoing_file_sessions: dict[ProcessedTelemetryID | InputTelemetryID, any] = {}

        # Ensure directories exist
        self._ensure_directories()

    def _ensure_directories(self):
        """Create necessary directories for telemetry data storage."""
        os.makedirs("saves/telemetry/processed", exist_ok=True)
        os.makedirs("saves/telemetry/input", exist_ok=True)

    def _data_handler(self, queueObject: SaveQueueObject):
        is_processed, telemetry_id, data_point = queueObject

        # Check if there is already a file session for this telemetry ID, if so, use it, if not, create a new one
        file_session = None
        if telemetry_id in self._ongoing_file_sessions:
            file_session = self._ongoing_file_sessions[telemetry_id]
        else:
            # Create a new file session for this telemetry ID
            file_session = open(f"saves/telemetry/{('processed' if is_processed else 'input')}/{telemetry_id}.csv", "a")
            self._ongoing_file_sessions[telemetry_id] = file_session

            # If the file is new, write the header
            if file_session.tell() == 0:
                file_session.write("timestamp,value1,value2,value3,...\n")

        # Write the data point to the file
        timestamp, values = data_point
        values_str = ",".join(str(value) for value in values)
        file_session.write(f"{timestamp},{values_str}\n")
        file_session.flush() # Flush the data to the file