import json
import os

class FileHandler:
    @staticmethod
    def save_file(data: object, file_path: str) -> bool:
        '''
        Saves the given data to the specified file path.
        '''
        try:
            with open(file_path, 'w') as f:
                f.write(json.dumps(data, ensure_ascii=False).replace('None', 'null'))
            return True
        except Exception as e:
            print(f'Error saving geofence file: {e}')
            return False
        

    @staticmethod
    def load_file(file_path: str) -> object | None:
        '''
        Loads and returns the data from the specified file path.
        If the file does not exist, returns None.
        '''
        try:
            with open(file_path, 'r') as f:
                data = f.read()
            return data
        except FileNotFoundError:
            return None
        

    @staticmethod
    def list_files_in_directory(directory: str, extension: str) -> list[dict]:
        '''
        Returns a list of available file datas with the specified extension in the given directory.
        '''
        files_list: list[dict] = []

        for filename in os.listdir(directory):
            if filename.endswith(extension):
                file_path: str = os.path.join(directory, filename)
                with open(file_path, 'r') as f:
                    data = json.load(f)
                files_list.append(data)

        return files_list