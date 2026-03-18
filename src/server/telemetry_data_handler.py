class TelemetryDataHandler:
    def __init__(self, all_telemetry: dict):
        self._all_telemetry = all_telemetry
        self._general_telemetry_and_types: list[str] = []
        self._all_telemetry_and_types: list[(str, str)] = []

        # Register all telemetry data types
        self._register_all_telemetry_types()

    # region Registration of telemetry data types
    def _register_all_telemetry_types(self):
        # Iterate through each category and register the telemetry data types
        for category, telemetry in self._all_telemetry.items():
            for data_name, data_type in telemetry.items():
                # Register the data type
                self._register_telemetry_data_type(category, data_name, data_type)

    @staticmethod
    def _get_telemetry_into_components(telemetry_id: str, data_type: object) -> list[str]:
        '''
        Split a telemetry id into its components.
        '''
        components = []
        if not isinstance(data_type, dict):
            # Normal telemetry data type, split into the following components:
            for suffix in ["max", "min", "mean", "avg", "current", "timedelta"]:
                full_telemetry_id_with_suffix = f"{telemetry_id}.{suffix}"
                components.append(full_telemetry_id_with_suffix)
        else:
            # The data type is a dictionary, so we need to split into further components based on the sub data types
            for sub_data_name, sub_data_type in data_type.items():
                full_sub_telemetry_id = f"{telemetry_id}.{sub_data_name}"
                components.append(full_sub_telemetry_id)
                # Recursively split the sub telemetry id into its components
                sub_components = TelemetryDataHandler._get_telemetry_into_components(full_sub_telemetry_id, sub_data_type)
                components.extend(sub_components)

        return components
    
    def _register_telemetry_data_type(self, category: str, telemetry_data_name: str, data_type: object):
        # Create the telemetry id
        full_telemetry_id: str = f"{category}.{telemetry_data_name}"

        # if the data_type is just a number, then split into the following, else we need to split into further components:
        telemetry_with_components: list[str] = self._get_telemetry_into_components(full_telemetry_id, data_type)

        # Store the telemetry data type in the dictionary
        self._general_telemetry_and_types.extend(full_telemetry_id)
        for telemetry_id in telemetry_with_components:
            self._all_telemetry_and_types.append((telemetry_id, data_type))

    # endregion

    # region Registration of derivatives and integrals
    def register_derivative(self, general_telemetry_id: str, derivative_telemetry_id: str):
        # Find the data type of the general telemetry id
        data_type = None
        for telemetry_id, data_type in self._all_telemetry_and_types:


    