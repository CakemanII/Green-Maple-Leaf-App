from flask import Flask, send_from_directory, request
import os

from preferences_file_manager import PreferencesFileManager
from geofence_file_manager import GeoFenceFileManager

SRC_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
MAIN_DIR: str = os.path.join(SRC_DIR, 'main')
GEOFENCE_EDITOR_DIR: str = os.path.join(SRC_DIR, 'geofence_editor')
PREFERENCES_DIR: str = os.path.join(SRC_DIR, 'preferences')
SHARED_DIR: str = os.path.join(SRC_DIR, 'shared')

app = Flask(__name__, static_folder=None)

#region Initial File Serving Routes

@app.route('/')
def serve_index():
    return send_from_directory(MAIN_DIR, 'index.html')

@app.route('/geofence_editor.html')
def serve_geofence():
    return send_from_directory(GEOFENCE_EDITOR_DIR, 'geofence_editor.html')

@app.route('/preferences.html')
def serve_preferences():
    return send_from_directory(PREFERENCES_DIR, 'preferences.html')

@app.route('/shared/<path:path>')
def serve_shared(path):
    return send_from_directory(SHARED_DIR, path)

@app.route('/<path:path>')
def serve_static(path):
    # Try main, geofence_editor, preferences in order
    for folder in [MAIN_DIR, GEOFENCE_EDITOR_DIR, PREFERENCES_DIR]:
        file_path = os.path.join(folder, path)
        if os.path.isfile(file_path):
            return send_from_directory(folder, path)
    return 'File not found', 404

#endregion

#region configuration saving & loading routes
@app.route('/save_config', methods=['POST'])
def save_config():
    print('Raw data:', request.data)
    data = request.get_json(silent=True)
    if not data:
        return ('No JSON data provided', 400)
    success: bool = PreferencesFileManager.save_preferences(data)
    return ('', 200) if success else ('Error saving preferences', 500)


@app.route('/load_config', methods=['GET'])
def load_config():
    # Return current preferences data
    preferences_data = PreferencesFileManager.get_preferences_data()
    return preferences_data, 200

#endregion

#region Geofence Data Routes
@app.route('/save_geoedit', methods=['POST'])
def save_geoedit_file():
    data: object = request.get_json(silent=True)
    success: bool = GeoFenceFileManager.save_geoedit_file(data)
    return ('', 200) if success else ('Error saving geofence file', 500)


@app.route('/get_geoedit', methods=['GET'])
def get_geoedit_file():
    uuid: str = request.args.get('uuid', '')
    geoedit_data = GeoFenceFileManager.get_geoedit_file(uuid)
    if geoedit_data is None:
        return (None, 404)
    return geoedit_data, 200
#endregion

if __name__ == '__main__':
    app.run(debug=True)
