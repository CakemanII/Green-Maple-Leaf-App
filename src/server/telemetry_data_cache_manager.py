from typing import TypedDict
from data_types import ProcessedDataPoint, ProcessedTelemetryID

# ProcessedDataPoint and then list of things such as [max, min, avg, mean, number_of_entries].
class CacheStats(TypedDict):
    Max: float
    Min: float
    Avg: float
    Entries: int

CacheItem = tuple[ProcessedDataPoint, list[CacheStats] | None]

class TelemetryDataCacheManager:
    def __init__(self):
        # Create variables
        self._cache: dict[ProcessedTelemetryID, ProcessedDataPoint] = {} # Cache for storing the latest processed data points for each telemetry ID

    def update_cache(self, telemetry_id: ProcessedTelemetryID, data_point: ProcessedDataPoint) -> None:
        """
        Update the cache with a new processed data point for a given telemetry ID.
        """
        # Create the cache item
        cache_item: CacheItem = (data_point, None)
        
        # Determine if there should be a list of values for calculating max, min, avg, mean, etc.
        if data_point[1] and isinstance(data_point[1], list | float):
            # Create a list of values for calculating max, min, avg, etc.
            cache_item = (data_point, self._calculate_stats(telemetry_id, data_point))
        self._cache[telemetry_id] = cache_item

    def _calculate_stats(self, processed_telemetry_id: ProcessedTelemetryID, current_datapoint: ProcessedDataPoint) -> list[CacheStats]:
        """
        Calculate the max, min, avg, mean, etc. using the current processed input and a most previous cache.
        """

        # Convert for simplicity
        current_datapoint_values: list[float] = current_datapoint[1] if isinstance(current_datapoint[1], list) else [current_datapoint[1]]

        # Get the previous cache
        previous_cache: CacheItem = self._cache.get(processed_telemetry_id, None)

        # Iterate through each value in datapoint
        new_stats: list[CacheStats] = []
        for value in current_datapoint_values:
            if not isinstance(value, (int, float)):
                raise ValueError(f"Current data point value '{value}' is not a number.")

            # Continue if previous cache was found, if not make new values
            if not previous_cache:
                stats: CacheStats = {
                    'Avg': value,
                    'Max': value,
                    'Min': value,
                    'Entries': 1
                }
                new_stats.append(stats)
                continue

            # Get the previous data from the cache
            previous_datapoint: ProcessedDataPoint = previous_cache[0][1] if previous_cache[0] else None

            # Get the previous stats from the cache
            previous_stats: list[CacheStats] = previous_cache[1] if previous_cache[1] else None

            # If there is no previous data, return the current data as the stats
            if not previous_datapoint:
                return current_datapoint_values if isinstance(current_datapoint[1], list) else current_datapoint_values[0]
            
            # Get number of entries
            previous_number_of_entries: int = (previous_stats[2]['Entries'] if previous_stats else 0)

            # Calculate the average
            mean: float = ((previous_stats[2]['Avg'] * previous_number_of_entries) + sum(current_datapoint_values)) / (previous_number_of_entries + len(current_datapoint_values))

            # Calculate the max
            max_value: float = max([previous_stats[2]['Max']] + current_datapoint_values) if previous_stats else max(current_datapoint_values)

            # Calculate the min
            min_value: float = min([previous_stats[2]['Min']] + current_datapoint_values) if previous_stats else min(current_datapoint_values)

            # Create the stats object
            stats: CacheStats = {
                'Avg': mean,
                'Max': max_value,
                'Min': min_value,
                'Entries': previous_number_of_entries + len(current_datapoint_values)
            }

            # Append the new cache item to the list of new stats
            new_stats.append(stats)

        # Return the new stats, as a list if the current data point is a list, or as a single object if the current data point is a single value
        return new_stats

    def get_cache_data(self, telemetry_id: ProcessedTelemetryID) -> CacheItem | None:
        return self._cache.get(telemetry_id, None)