import json
import os
import datetime
import uuid
from typing import Callable

from flask import Request, jsonify

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
            print(f'Error saving file: {e}')
            return False
        

    @staticmethod
    def load_file(file_path: str, is_media: bool = False) -> object | None:
        '''
        Loads and returns the data from the specified file path.
        If the file does not exist, returns None.
        '''
        try:
            if not is_media:
                with open(file_path, 'r', encoding='utf-8-sig') as f:
                    data = f.read()
                return data
            else:
                with open(file_path, 'rb') as f:
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
                with open(file_path, 'r', encoding='utf-8-sig') as f:
                    data = json.load(f)
                files_list.append(data)

        return files_list
    

    @staticmethod
    def delete_file(file_path: str) -> bool:
        '''
        Deletes the specified file. Returns True if successful, False otherwise.
        '''
        try:
            os.remove(file_path)
            return True
        except Exception as e:
            print(f'Error deleting file: {e}')
            return False
        
    
    @staticmethod
    def check_file_exists(file_path: str) -> bool:
        '''
        Checks if the specified file exists. Returns True if it exists, False otherwise.
        '''
        return os.path.isfile(file_path)

class ClientServerDirectoryHandler():
    def __init__(self, directory: str, upload_validation_function: Callable[[dict], bool], required_file_extension: str = None, is_media: bool = False):
        self._directory = directory
        self._validation_function = upload_validation_function
        self._required_file_extension = required_file_extension
        self._is_media = is_media

    def upload_file(self, request: Request) -> tuple[str, int]:
        """
        Method to handle file uploads from clients.
        """
        # Check if the request contains a file part
        if 'file' not in request.files:
            return 'No file part', 400
        
        # Get the uploaded file & ensure it exists
        file = request.files['file']
        if file.filename == '':
            return 'No selected file', 400

        # Read & Validate the file content
        data = None
        if not self._is_media:
            try:
                file_content = file.read().decode('utf-8-sig')
                data = json.loads(file_content)
            except Exception:
                return 'Invalid file format', 400

            # Validate the expected structure of the file
            if not self._validation_function(data):
                return 'Invalid file structure', 400
        
        # Get the UUID and name for the file
        if not self._is_media and 'UUID' in data:
            file_uuid = data['UUID']
        else:
            file_uuid = str(uuid.uuid4())

        name = request.form.get('name', '').strip()

        # Get the file's extension
        if self._required_file_extension:
            file_ext = self._required_file_extension
        else:
            _, file_ext = os.path.splitext(file.filename)

        # Ensure file and metadata directories exist
        sc_files_dir = os.path.join(self._directory, 'files')
        sc_meta_dir  = os.path.join(self._directory, 'metadata')
        os.makedirs(sc_files_dir, exist_ok=True)
        os.makedirs(sc_meta_dir,  exist_ok=True)

        # Save the file and its metadata
        file_ext = os.path.splitext(file.filename)[1]
        save_path = os.path.join(sc_files_dir, f'{file_uuid}{file_ext}')

        if not self._is_media:
            FileHandler.save_file(data, save_path)
        else:
            file.save(save_path)

        # Get the file size and create metadata
        file_size = os.path.getsize(save_path)
        if self._is_media:
            metadata = {
                'UUID': file_uuid,
                'relative_filename': f'{file_uuid}{file_ext}',
                'name': name,
                'lastModified': datetime.datetime.now().isoformat(),
                'fileSize': file_size,  
            }
        else:
            metadata = {
                'UUID': file_uuid,
                'relative_filename': f'{file_uuid}{file_ext}',
                'name': name,
                'description': data.get('description', ''),
                'lastModified': datetime.datetime.now().isoformat(),
                'fileSize': file_size,
            }

        # Save the metadata
        FileHandler.save_file(metadata, os.path.join(sc_meta_dir, f'{file_uuid}.json'))
        print(f'Saved metadata for file: {file_uuid}')
        return jsonify(metadata), 200
    
    def delete_file(self, request: Request) -> tuple[str, int]:
        '''
        Method to handle file deletion requests from clients.
        '''
        # Get data from request and validate it
        data = request.get_json(silent=True)
        if not data:
            return 'No JSON data provided', 400
        
        # Get the UUID and validate it
        file_uuid = data.get('UUID', '')
        if not file_uuid:
            return 'UUID required', 400

        # Sanitize the UUID to prevent path traversal and ensure it's a valid filename
        safe_uuid = ''.join(c for c in file_uuid if c.isalnum() or c in '-_')

        # Get the relative filename from metadata
        metadata_path = os.path.join(self._directory, 'metadata', f'{safe_uuid}.json')
        if not os.path.isfile(metadata_path):
            return 'Metadata not found', 404
        with open(metadata_path, 'r', encoding='utf-8-sig') as f:
            metadata = json.load(f)
            relative_filename = metadata.get('relative_filename', None)

        # Delete the metadata and the file, ensuring we only delete files that match the UUID and extension from the metadata
        FileHandler.delete_file(os.path.join(self._directory, 'metadata', f'{safe_uuid}.json'))
        success = FileHandler.delete_file(os.path.join(self._directory, 'files', relative_filename))
        return ('', 200) if success else ('File not found or could not be deleted', 404)

    def list_metadatas(self) -> list[dict]:
        '''
        Method to list all file metadatas.
        '''
        # Ensure the metadata directory exists
        sc_meta_dir = os.path.join(self._directory, 'metadata')
        if not os.path.isdir(sc_meta_dir):
            return jsonify({'metadatas': []}), 200
        
        # List all metadata files and return their contents
        metadatas = FileHandler.list_files_in_directory(sc_meta_dir, '.json')
        return jsonify({'metadatas': metadatas}), 200
    
    def fetch_file(self, request: Request) -> tuple[dict | None, int]:
        '''
        Method to handle file fetch requests from clients.
        '''
        # Get the UUID from the request and sanitize it to prevent path traversal
        file_uuid = request.args.get('uuid', '')

        # Sanitize the UUID to ensure it's a valid filename
        safe_uuid = ''.join(c for c in file_uuid if c.isalnum() or c in '-_')

        # Get the relative filename from metadata
        metadata_path = os.path.join(self._directory, 'metadata', f'{safe_uuid}.json')
        if not os.path.isfile(metadata_path):
            return 'Metadata not found', 404
        with open(metadata_path, 'r', encoding='utf-8-sig') as f:
            metadata = json.load(f)
            relative_filename = metadata.get('relative_filename', None)

        # Get the file path
        path = os.path.join(self._directory, 'files', relative_filename)
        # Get the data from the file and return it.
        data = FileHandler.load_file(path, is_media=self._is_media)
        return (data, 200) if data is not None else (None, 404)
    
    def save_file(self, request: Request) -> tuple[str, int]:
        '''
        Method to handle file save requests from clients. This is used to update existing files with new data.
        '''
        # Get data from request and validate it
        data = request.get_json(silent=True)

        # Get file UUID
        file_uuid = data['UUID']

        # Ensure file and metadata directories exist
        sc_files_dir = os.path.join(self._directory, 'files')
        sc_meta_dir  = os.path.join(self._directory, 'metadata')
        os.makedirs(sc_files_dir, exist_ok=True)
        os.makedirs(sc_meta_dir,  exist_ok=True)

        # Check if the file exists.
        metadata_path = os.path.join(self._directory, 'metadata', f'{file_uuid}.json')

        # If file exists, get the relative filename from metadata. If not, create filepath with uuid.
        if (os.path.isfile(metadata_path)):
            with open(metadata_path, 'r', encoding='utf-8-sig') as f:
                metadata = json.load(f)
                relative_filename = metadata.get('relative_filename', None)
        else:
            if not self._required_file_extension:
                return 'File does not exist and no required file extension specified', 400
            relative_filename = f'{file_uuid}{self._required_file_extension}'

        # Save the file and its metadata
        save_path = os.path.join(sc_files_dir, relative_filename)
        success = FileHandler.save_file(data, save_path)
        if not success:
            return 'Error saving status collection file', 500
        
        # Get the file size and update metadata
        file_size = os.path.getsize(save_path)
        metadata = {
            'UUID': file_uuid,
            'relative_filename': relative_filename,
            'name': data.get('name', ''),
            'description': data.get('description', ''),
            'lastModified': datetime.datetime.now().isoformat(),
            'fileSize': file_size,
        }
        FileHandler.save_file(metadata, os.path.join(sc_meta_dir, f'{file_uuid}.json'))
        return '', 200
    
    def check_file(self, request: Request) -> tuple[list[dict], int]:
        uuid = request.args.get('uuid', '')

        # Get the relative filename from metadata
        metadata_path = os.path.join(self._directory, 'metadata', f'{uuid}.json')
        if not os.path.isfile(metadata_path):
            return jsonify({'exists': False}), 200
        
        with open(metadata_path, 'r', encoding='utf-8-sig') as f:
            metadata = json.load(f)
            relative_filename = metadata.get('relative_filename', None)
        if not relative_filename:
            return jsonify({'exists': False}), 200
        
        abs_path = os.path.normpath(os.path.join(self._directory, "files", relative_filename))
        if not abs_path.startswith(self._directory):
            return 'Forbidden', 403
        return jsonify({'exists': os.path.isfile(abs_path)}), 200
