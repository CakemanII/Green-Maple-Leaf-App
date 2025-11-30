import json
import os

class GeoFenceFileManager:
    @staticmethod
    def list_geoedit_files() -> list[dict]:
        '''
        Returns a list of available geofence files with their metadata.
        '''
        # Compile list of geofence files
        geofence_directory: str = r"C:\Users\tyler\OneDrive\Desktop\Green Maple Leaf App\saves\geofence"
        files_list: list[dict] = []

        # Iterate through files in the geofence directory
        for filename in os.listdir(geofence_directory):
            # Ensure this ends with .geoedit
            if filename.endswith('.geoedit'):
                file_path: str = os.path.join(geofence_directory, filename)
                # Get file metadata
                with open(file_path, 'r') as f:
                    data = json.load(f)
                    metadata = data['metadata']

                files_list.append(metadata)

        # Return the compiled list
        return files_list


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