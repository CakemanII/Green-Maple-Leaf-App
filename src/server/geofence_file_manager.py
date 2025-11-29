import json

class GeoFenceFileManager:
    @staticmethod
    def get_geoedit_file(uuid: str) -> object | None:
        '''
        Returns the geofence file data for the given UUID.
        If the file does not exist, returns None.
        '''
        # Load geofence file based on UUID
        file_path = f'saves/geofence/{uuid}.geoedit'
        try:
            with open(file_path, 'r') as f:
                data = f.read()
            return data
        except FileNotFoundError:
            return None
        
    @staticmethod
    def save_geoedit_file(data: object) -> bool:
        '''
        Saves the given geofence data to a file identified by the UUID.
        Returns True if successful, False otherwise.
        '''
        uuid: str = data['UUID']
        file_path = f'saves/geofence/{uuid}.geoedit'
        try:
            with open(file_path, 'w') as f:
                f.write(json.dumps(data, ensure_ascii=False).replace('None', 'null'))
            return True
        except Exception as e:
            print(f'Error saving geofence file: {e}')
            return False