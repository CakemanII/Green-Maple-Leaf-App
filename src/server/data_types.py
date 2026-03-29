from typing import TypedDict

DataPoint = tuple[float, list[float]]

InputDataPoint = DataPoint
ProcessedDataPoint = DataPoint

InputTelemetryID = str
ProcessedTelemetryID = str

class RadioDataObject(TypedDict):
    l: str # input telemetry_id / label
    s: float # timestamp this was sent
    d: object # data (can be any JSON-serializable object)