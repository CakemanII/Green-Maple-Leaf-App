from flask import Flask, send_from_directory, request, jsonify
from flask_socketio import SocketIO, emit
import os

from file_handler import FileHandler
from radio_communication_buffer import RadioCommunicationBuffer, TimeStamped
from radio_communication_simulation_server import RadioComsSimulationServer

SRC_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
MAIN_DIR: str = os.path.join(SRC_DIR, 'main')
GEOFENCE_EDITOR_DIR: str = os.path.join(SRC_DIR, 'geofence_editor')
LIVE_DATA_DIR: str = os.path.join(SRC_DIR, 'live_data')
STATUS_EDITOR_DIR: str = os.path.join(SRC_DIR, 'status_editor')
PREFERENCES_DIR: str = os.path.join(SRC_DIR, 'preferences')
SHARED_DIR: str = os.path.join(SRC_DIR, 'shared')

app = Flask(__name__, static_folder=None)
socketio = SocketIO(app, cors_allowed_origins="*")

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
    success: bool = FileHandler.save_file(data, r"C:\Users\tyler\OneDrive\Desktop\Green Maple Leaf App\preferences.json")
    return ('', 200) if success else ('Error saving preferences', 500)

@app.route('/config/load', methods=['GET'])
def load_config():
    # Return current preferences data
    preferences_data = FileHandler.load_file(r"C:\Users\tyler\OneDrive\Desktop\Green Maple Leaf App\preferences.json")
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