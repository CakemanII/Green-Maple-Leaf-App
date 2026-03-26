DataPoint = tuple[float, list[float]]

InputDataPoint = DataPoint
ProcessedDataPoint = DataPoint

InputTelemetryID = str
ProcessedTelemetryID = str

RadioDataObject = list[InputTelemetryID, InputDataPoint, float]