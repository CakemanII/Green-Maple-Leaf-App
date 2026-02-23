from flask import Flask, json, send_from_directory, request, jsonify
from flask_socketio import SocketIO, emit
import os
import mimetypes
import logging
import uuid
import datetime

# Ensure .js files are served with correct MIME type
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/javascript', '.mjs')

from file_handler import FileHandler
from radio_communication_manager import RadioCommunicationBuffer, TimeStamped
from radio_communication_simulation_server import RadioComsSimulationServer

# Configure logging to suppress specific routes
class RouteFilter(logging.Filter):
    def filter(self, record):
        # Suppress logs for polling endpoints
        if 'get_rocket_connectivity_status' in record.getMessage():
            return False
        if 'get_operational_status' in record.getMessage():
            return False
        return True

# Apply the filter to werkzeug logger
log = logging.getLogger('werkzeug')
log.addFilter(RouteFilter())

SRC_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
ROOT_DIR: str = os.path.abspath(os.path.join(SRC_DIR, '..'))
SAVES_DIR: str = os.path.join(ROOT_DIR, 'saves')
MAIN_DIR: str = os.path.join(SRC_DIR, 'main')
GEOFENCE_EDITOR_DIR: str = os.path.join(SRC_DIR, 'geofence_editor')
LIVE_DATA_DIR: str = os.path.join(SRC_DIR, 'live_data')
STATUS_EDITOR_DIR: str = os.path.join(SRC_DIR, 'status_editor')
PREFERENCES_DIR: str = os.path.join(SRC_DIR, 'preferences')
SHARED_DIR: str = os.path.join(SRC_DIR, 'shared')

app = Flask(__name__, static_folder=None)
socketio = SocketIO(app, cors_allowed_origins="*")

radio_buffer: RadioCommunicationBuffer

#region Initial File Serving Routes
@app.route('/')
def serve_index():
    return send_from_directory(MAIN_DIR, 'index.html')

@app.route('/geofence_editor.html')
def serve_geofence():
    return send_from_directory(GEOFENCE_EDITOR_DIR, 'geofence_editor.html')

@app.route('/status_editor.html')
def serve_status_editor():
    return send_from_directory(STATUS_EDITOR_DIR, 'status_editor.html')

@app.route('/live_data.html')
def serve_live_data():
    return send_from_directory(LIVE_DATA_DIR, 'live_data.html')

@app.route('/preferences.html')
def serve_preferences():
    return send_from_directory(PREFERENCES_DIR, 'preferences.html')

@app.route('/shared/<path:path>')
def serve_shared(path):
    return send_from_directory(SHARED_DIR, path)

@app.route('/serve_image/<path:filepath>')
def serve_image(filepath):
    """Serve any file from the filesystem by absolute path."""
    print(f"[Web Server] Attempting to serve file: {filepath}")
    
    # The filepath comes in with forward slashes, need to handle Windows paths    
    # Convert forward slashes to backslashes for Windows
    filepath = filepath.replace('/', os.sep)
    
    # Check if file exists
    if os.path.isfile(filepath):
        directory = os.path.dirname(filepath)
        filename = os.path.basename(filepath)
        print(f"[Web Server] File found! Serving from {directory}")
        return send_from_directory(directory, filename)
    
    print(f"[Web Server] File not found: {filepath}")
    return f'File not found: {filepath}', 404

@app.route('/<path:path>')
def serve_static(path):
    # Try main, geofence_editor, preferences in order
    for folder in [MAIN_DIR, GEOFENCE_EDITOR_DIR, PREFERENCES_DIR, LIVE_DATA_DIR, STATUS_EDITOR_DIR]:
        file_path = os.path.join(folder, path)
        if os.path.isfile(file_path):
            return send_from_directory(folder, path)
    return 'File not found', 404
#endregion

#region Preferences Data Routes
@app.route('/config/save', methods=['POST'])
def save_config():
    data = request.get_json(silent=True)
    if not data:
        return ('No JSON data provided', 400)
    success: bool = FileHandler.save_file(data, "preferences.json")
    return ('', 200) if success else ('Error saving preferences', 500)

@app.route('/config/load', methods=['GET'])
def load_config():
    # Return current preferences data
    preferences_data = FileHandler.load_file("preferences.json")
    return preferences_data, 200

#endregion

#region Status Collection Data Routes
@app.route('/status_collection/save', methods=['POST'])
def save_status_collection_file():
    data: object = request.get_json(silent=True)
    success: bool = FileHandler.save_file(data, f'saves/status_collections/{data["UUID"]}.scollection')
    return ('', 200) if success else ('Error saving status collection file', 500)

@app.route('/status_collection/get', methods=['GET'])
def get_status_collection_file():
    uuid: str = request.args.get('uuid', '')
    status_collection_data = FileHandler.load_file(f'saves/status_collections/{uuid}.scollection')
    if status_collection_data is None:
        return (None, 404)
    return status_collection_data, 200

@app.route('/status_collection/list', methods=['GET'])
def list_status_collection_files():
    status_collection_list = FileHandler.list_files_in_directory('saves/status_collections', '.scollection')
    return {'files': status_collection_list}, 200
#endregion

#region Geofence Data Routes
@app.route('/geofence/save', methods=['POST'])
def save_geoedit_file():
    data: object = request.get_json(silent=True)
    success: bool = FileHandler.save_file(data, f'saves/geofence/{data["metadata"]["UUID"]}.geoedit')
    return ('', 200) if success else ('Error saving geofence file', 500)

@app.route('/geofence/get', methods=['GET'])
def get_geoedit_file():
    uuid: str = request.args.get('uuid', '')
    geoedit_data = FileHandler.load_file(f'saves/geofence/{uuid}.geoedit')
    if geoedit_data is None:
        return (None, 404)
    return geoedit_data, 200

@app.route('/geofence/list_metadatas', methods=['GET'])
def list_geoedit_files():
    # Get list of all .geoedit files in saves/geofences
    geoedit_list = FileHandler.list_files_in_directory('saves/geofence', '.geoedit')

    # Get only the metadata for each file
    metadata_list: list[object] = []
    for file_data in geoedit_list:
        metadata_list.append(file_data['metadata'])
    return {'metadatas': metadata_list}, 200
#endregion

#region Image/Audio File Upload, Delete, List, Serve Routes
@app.route('/media/upload', methods=['POST'])
def upload_media():
    if 'file' not in request.files:
        return 'No file part', 400

    file = request.files['file']
    if file.filename == '':
        return 'No selected file', 400

    # Determine media type from MIME type
    mime_type = file.content_type or ''
    if mime_type.startswith('image/'):
        media_folder = 'images'
        file_type_key = 'img'
    elif mime_type.startswith('audio/'):
        media_folder = 'audio'
        file_type_key = 'aud'
    else:
        return 'Unsupported file type', 400

    # Generate UUID and keep original extension
    file_uuid = str(uuid.uuid4())
    _, file_ext = os.path.splitext(file.filename)
    filename = f'{file_uuid}{file_ext}'

    # Ensure directory exists and save file
    files_dir = os.path.join(SAVES_DIR, 'media', media_folder, 'files')
    os.makedirs(files_dir, exist_ok=True)
    save_path = os.path.join(files_dir, filename)
    file.save(save_path)

    # Build metadata
    name = request.form.get('name', os.path.splitext(file.filename)[0])
    file_size = os.path.getsize(save_path)
    relative_filepath = f'saves/media/{media_folder}/files/{filename}'
    metadata = {
        'UUID': file_uuid,
        'name': name,
        'file_type': file_type_key,
        'relative_filepath': relative_filepath,
        'lastModified': datetime.datetime.now().isoformat(),
        'fileSize': file_size,
    }

    # Save metadata JSON
    metadata_dir = os.path.join(SAVES_DIR, 'media', media_folder, 'metadata')
    os.makedirs(metadata_dir, exist_ok=True)
    FileHandler.save_file(metadata, os.path.join(metadata_dir, f'{file_uuid}.json'))

    return jsonify(metadata), 200


@app.route('/media/delete', methods=['POST'])
def delete_media():
    data = request.get_json(silent=True)
    if not data:
        return 'No JSON data provided', 400

    file_uuid = data.get('UUID', '')
    media_type = data.get('media_type', '')  # 'images' or 'audio'
    if not file_uuid or media_type not in ('images', 'audio'):
        return 'Invalid parameters', 400

    metadata_path = os.path.join(SAVES_DIR, 'media', media_type, 'metadata', f'{file_uuid}.json')
    raw = FileHandler.load_file(metadata_path)
    if raw is None:
        return 'Metadata not found', 404

    metadata_obj = json.loads(raw)
    relative = metadata_obj.get('relative_filepath', '')
    if relative:
        abs_file = os.path.normpath(os.path.join(ROOT_DIR, relative.replace('/', os.sep)))
        FileHandler.delete_file(abs_file)  # non-fatal if file already missing

    FileHandler.delete_file(metadata_path)
    return '', 200


@app.route('/media/list_metadatas', methods=['GET'])
def list_media_metadatas():
    media_type = request.args.get('type', '')  # 'images' or 'audio'
    if media_type not in ('images', 'audio'):
        return 'Invalid or missing type parameter', 400

    metadata_dir = os.path.join(SAVES_DIR, 'media', media_type, 'metadata')
    if not os.path.isdir(metadata_dir):
        return jsonify({'metadatas': []}), 200

    metadatas = FileHandler.list_files_in_directory(metadata_dir, '.json')
    return jsonify({'metadatas': metadatas}), 200


@app.route('/media/serve_file', methods=['GET'])
def serve_media_file():
    relative_path = request.args.get('path', '')
    if not relative_path:
        return 'No path provided', 400

    abs_path = os.path.normpath(os.path.join(ROOT_DIR, relative_path))
    # Prevent path traversal outside ROOT_DIR
    if not abs_path.startswith(ROOT_DIR):
        return 'Forbidden', 403
    if not os.path.isfile(abs_path):
        return 'File not found', 404

    return send_from_directory(os.path.dirname(abs_path), os.path.basename(abs_path))
#endregion

#region Active / Disable Rocket Communication Server Routes
@app.route('/radio_rocket_comms_server/set_active', methods=['POST'])
def activate_radio_rocket_comms_server():
    # Activate server if not already active
    global radio_buffer
    radio_buffer.set_active()
    return ('', 200)

@app.route('/radio_rocket_comms_server/set_inactive', methods=['POST'])
def deactivate_radio_rocket_comms_server():
    # Deactivate server if active
    global radio_buffer
    radio_buffer.set_inactive()
    return ('', 200)

@app.route('/radio_rocket_comms_server/get_operational_status', methods=['GET'])
def get_radio_rocket_comms_server_status():
    # Return the status of the radio communication server
    global radio_buffer
    is_active = radio_buffer._thread and radio_buffer._thread.is_alive() # (Still a valid way of checking)
    
    return {
        'is_operational': is_active,
    }, 200


@app.route('/radio_rocket_comms_server/get_rocket_connectivity_status', methods=['GET'])
def get_radio_rocket_comms_server_rocket_connectivity_status():
    # Return whether the radio communication server is connected to the rocket
    global radio_buffer
    connection_status = radio_buffer.is_connected_to_rocket()
    return {
        'rocket_connection_status': connection_status
    }, 200

#endregion

#region Store the latest rocket data for web clients
def send_rocket_data_to_webserver(label: str, data: TimeStamped[object]):
    """
    Callback function to receive rocket data from RadioCommunicationBuffer.
    Stores the data and SENDS it to all connected web clients via WebSocket.
    """

    # SEND the data to all connected web clients immediately
    socketio.emit('rocket_data', {
        'label': label,
        'timestamp': data['sent_timestamp'],
        'content': data['data']
    })
    print(f"[Web Server] Sent rocket data to clients - {label}: {data}")

#endregion

if __name__ == '__main__':
    # Initialize RadioCommunicationBuffer with callback
    radio_buffer = RadioCommunicationBuffer(min_send_interval=0.030, on_receive_data=send_rocket_data_to_webserver)
    socketio.run(app, debug=True, use_reloader=False)