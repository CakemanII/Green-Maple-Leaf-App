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

    def update_cache(self, telemetry_id: ProcessedTelemetryID, data_point: ProcessedDataPoint):
        """
        Update the cache with a new processed data point for a given telemetry ID.
        """
        # Create the cache item
        cache_item: CacheItem = (data_point, None)
        
        # Determine if there should be a list of values for calculating max, min, avg, mean, etc.
        if data_point[1] and isinstance(data_point[1], list | float):
            # Create a list of values for calculating max, min, avg, etc.
            cache_item = (data_point, None)
        self._cache[telemetry_id] = cache_item

    def _calculate_stats(self, processed_telemetry_id: ProcessedTelemetryID, current_datapoint: ProcessedDataPoint) -> CacheStats:
        """
        Calculate the max, min, avg, mean, etc. using the current processed input and a most previous cache.
        """
        # Determine the return type
        return_as_list: bool = isinstance(current_datapoint[1], list[float])

        # Convert for simplicity
        current_data_list: list[float] = current_datapoint[1] if return_as_list else [current_datapoint[1]]

        # Get the previous cache
        previous_cache: CacheItem = self._cache.get(processed_telemetry_id, None)

        # Iterate through each value in datapoint
        new_stats: list[CacheStats] = []
        for value in current_data_list:
            if not isinstance(value, (int, float)):
                raise ValueError(f"Current data point value '{value}' is not a number.")
            
            # Continue only if the previous cache has been found
            # ...

            # Get the previous data from the cache
            previous_datapoint: ProcessedDataPoint = previous_cache[0][1] if previous_cache[0] else None

            # Get the previous stats from the cache
            previous_stats: list[CacheStats] = previous_cache[1] if previous_cache[1] else None

            # If there is no previous data, return the current data as the stats
            if not previous_datapoint:
                return current_data_list if return_as_list else current_data_list[0]
            
            # Get number of entries
            previous_number_of_entries: int = (previous_stats['Entries'] if previous_stats else 0)

            # Calculate the average
            mean: float = ((previous_stats['Avg'] * previous_number_of_entries) + sum(current_data_list)) / (previous_number_of_entries + len(current_data_list))

            # Calculate the max
            max_value: float = max([previous_stats['Max']] + current_data_list) if previous_stats else max(current_data_list)

            # Calculate the min
            min_value: float = min([previous_stats['Min']] + current_data_list) if previous_stats else min(current_data_list)

            # Create the stats object
            stats: CacheStats = {
                'Avg': mean,
                'Max': max_value,
                'Min': min_value,
                'Entries': previous_number_of_entries + len(current_data_list)
            }

            # Append the new cache item to the list of new stats
            new_stats.append(stats)

        # Return the new stats, as a list if the current data point is a list, or as a single object if the current data point is a single value
        return new_stats if return_as_list else new_stats[0]
            
        

