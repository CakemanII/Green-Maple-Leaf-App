from flask import Flask, json, send_from_directory, request, jsonify, redirect
from flask_socketio import SocketIO, emit
import os
import mimetypes
import logging
import uuid
import datetime
from urllib.parse import urlparse

# Ensure .js files are served with correct MIME type
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/javascript', '.mjs')

from file_handler import FileHandler
from file_handler import ClientServerDirectoryHandler
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
MAIN_EDITOR_DIR: str = os.path.join(SRC_DIR, 'main_editor')
MAIN_GCS_DIR: str = os.path.join(SRC_DIR, 'main_gcs')
LIVE_INTERFACE_DIR: str = os.path.join(SRC_DIR, 'live_interface')
INTERFACE_EDITOR_DIR: str = os.path.join(SRC_DIR, 'interface_editor')
GEOFENCE_EDITOR_DIR: str = os.path.join(SRC_DIR, 'geofence_editor')
LIVE_DATA_DIR: str = os.path.join(SRC_DIR, 'live_data')
STATUS_EDITOR_DIR: str = os.path.join(SRC_DIR, 'status_editor')
PREFERENCES_DIR: str = os.path.join(SRC_DIR, 'preferences')
SHARED_DIR: str = os.path.join(SRC_DIR, 'shared')

REFERRER_TO_DIR: dict[str, str] = {
    '/editor': MAIN_EDITOR_DIR,
    '/gcs': MAIN_GCS_DIR,
    '/interface_editor.html': INTERFACE_EDITOR_DIR,
    '/live_interface.html': LIVE_INTERFACE_DIR,
    '/geofence_editor.html': GEOFENCE_EDITOR_DIR,
    '/status_editor.html': STATUS_EDITOR_DIR,
    '/live_data.html': LIVE_DATA_DIR,
    '/preferences.html': PREFERENCES_DIR,
}

app = Flask(__name__, static_folder=None)
socketio = SocketIO(app, cors_allowed_origins="*")

radio_buffer: RadioCommunicationBuffer

#region Initial File Serving Routes
def _was_editor_opened_last() -> bool:
    """Check the session file to determine if the editor or GCS was opened last, to decide which page to serve at the root URL."""
    try:
        session_data = FileHandler.load_file("session.json")
        if session_data:
            import json as json_lib
            session = json_lib.loads(session_data)
            # Return True if editor was opened last, False if GCS was opened last
            # Default to editor if no preference is stored
            return session.get('last_opened_page', 'editor') == 'editor'
    except Exception:
        pass
    return True

@app.route('/')
def serve_index():
    # Redirect to the appropriate page based on session history
    if _was_editor_opened_last():
        return redirect('/editor')
    else:
        return redirect('/gcs')

@app.route('/editor')
def serve_editor():
    return send_from_directory(MAIN_EDITOR_DIR, 'index.html')


@app.route('/gcs')
def serve_gcs():
    return send_from_directory(MAIN_GCS_DIR, 'index.html')

@app.route('/interface_editor.html')
def serve_interface_editor():
    return send_from_directory(INTERFACE_EDITOR_DIR, 'interface_editor.html')

@app.route('/live_interface.html')
def serve_live_interface():
    return send_from_directory(LIVE_INTERFACE_DIR, 'live_interface.html')

@app.route('/geofence_editor.html')
def serve_geofence():
    return send_from_directory(GEOFENCE_EDITOR_DIR, 'geofence_editor.html')

@app.route('/status_editor.html')
def serve_status_editor():
    return send_from_directory(STATUS_EDITOR_DIR, 'status_editor.html')

@app.route('/live_data.html')
def serve_live_data():
    return send_from_directory(LIVE_DATA_DIR, 'live_data.html')

@app.route('/live_data/<path:path>')
def serve_live_data_assets(path):
    return send_from_directory(LIVE_DATA_DIR, path)

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
    # Prioritize the folder that matches the referring page to avoid collisions
    # (e.g. /gcs and /editor both having /compiled_js/application_operational_state.js).
    folder_candidates: list[str] = []

    referrer = request.headers.get('Referer', '')
    if referrer:
        referrer_path = urlparse(referrer).path
        referrer_folder = REFERRER_TO_DIR.get(referrer_path)
        if referrer_folder:
            folder_candidates.append(referrer_folder)

    # Fallback search order (kept for direct asset requests without referrer).
    for folder in [MAIN_EDITOR_DIR, MAIN_GCS_DIR, LIVE_INTERFACE_DIR, INTERFACE_EDITOR_DIR, GEOFENCE_EDITOR_DIR, PREFERENCES_DIR, LIVE_DATA_DIR, STATUS_EDITOR_DIR]:
        if folder not in folder_candidates:
            folder_candidates.append(folder)

    # Try known app folders for static assets (compiled_js, css, assets, etc.)
    for folder in folder_candidates:
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

#region Session Data Routes
@app.route('/session/save', methods=['POST'])
def save_session():
    data = request.get_json(silent=True)
    if not data:
        return ('No JSON data provided', 400)
    success: bool = FileHandler.save_file(data, "session.json")
    return ('', 200) if success else ('Error saving session', 500)

@app.route('/session/load', methods=['GET'])
def load_session():
    session_data = FileHandler.load_file("session.json")
    if session_data is None:
        return app.response_class(response='{}', status=200, mimetype='application/json')
    return app.response_class(response=session_data, status=200, mimetype='application/json')
#endregion

file_saving_dictionary = {
    "status_collection": {
        "directory": os.path.join(SAVES_DIR, 'status_collections'),
        "validation_function": lambda data: isinstance(data, dict) and isinstance(data.get('statuses'), list),
        "required_extension": '.scollection',
        "is_media": False
    },
    "geofence": {
        "directory": os.path.join(SAVES_DIR, 'geofence'),
        "validation_function": lambda data: isinstance(data, dict) and isinstance(data.get('regions'), list),
        "required_extension": '.geoedit',
        "is_media": False
    },
    "interface_screen": {
        "directory": os.path.join(SAVES_DIR, 'interface_screens'),
        "validation_function": lambda data: True,
        "required_extension": '.iscreen',
        "is_media": False
    },
    "media/audio": {
        "directory": os.path.join(SAVES_DIR, 'media', 'audio'),
        "validation_function": lambda data: True,
        "required_extension": None,
        "is_media": True
    },
    "media/image": {
        "directory": os.path.join(SAVES_DIR, 'media', 'images'),
        "validation_function": lambda data: True,
        "required_extension": None,
        "is_media": True
    }
}


# Helper functions to create event methods
def make_save(handler: ClientServerDirectoryHandler):
    def save_file():
        return handler.save_file(request)
    return save_file
def make_fetch(handler: ClientServerDirectoryHandler):
    def fetch_file():
        return handler.fetch_file(request)
    return fetch_file
def make_list_metadatas(handler: ClientServerDirectoryHandler):
    def list_metadatas():
        return handler.list_metadatas()
    return list_metadatas
def make_delete(handler: ClientServerDirectoryHandler):
    def delete_file():
        return handler.delete_file(request)
    return delete_file
def make_upload(handler: ClientServerDirectoryHandler):
    def upload_file():
        return handler.upload_file(request)
    return upload_file
def make_check_file(handler: ClientServerDirectoryHandler):
    def check_file():
        return handler.check_file(request)
    return check_file

# Iterate through the file_saving_dictionary to create routes for each file type (status collections, geofences, interface screens)
for key, config in file_saving_dictionary.items():
    handler = ClientServerDirectoryHandler(
        directory=config['directory'],
        upload_validation_function=config['validation_function'],
        required_file_extension=config['required_extension'],
        is_media=config['is_media']
    )

    app.add_url_rule(
        f'/{key}/save',
        endpoint=f'{key}_save',
        view_func=make_save(handler),
        methods=['POST']
    )

    app.add_url_rule(
        f'/{key}/fetch',
        endpoint=f'{key}_fetch',
        view_func=make_fetch(handler),
        methods=['GET']
    )

    app.add_url_rule(
        f'/{key}/list_metadatas',
        endpoint=f'{key}_list_metadatas',
        view_func=make_list_metadatas(handler),
        methods=['GET']
    )

    app.add_url_rule(
        f'/{key}/delete',
        endpoint=f'{key}_delete',
        view_func=make_delete(handler),
        methods=['POST']
    )

    app.add_url_rule(
        f'/{key}/upload',
        endpoint=f'{key}_upload',
        view_func=make_upload(handler),
        methods=['POST']
    )

    app.add_url_rule(
        f'/{key}/check_file',
        endpoint=f'{key}_check_file',
        view_func=make_check_file(handler),
        methods=['GET']
    )

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

#region Telemetry Data Routes
@app.route('/telemetry/get_types', methods=['GET'])
def get_telemetry_types():
    path = os.path.join(ROOT_DIR, 'telemetry_types.json')
    raw = FileHandler.load_file(path)
    if raw is None:
        return 'telemetry_types.json not found', 404
    return jsonify(json.loads(raw)), 200
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