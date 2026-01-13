from flask import Flask, request, jsonify
import time
from typing import Callable, TypedDict
import threading
import requests


class RadioDataObject(TypedDict):
    label: str
    sent_timestamp: float
    received_timestamp: float
    data: object


class RadioComsSimulationServer:
    def __init__(self, on_receive_radio_data: Callable[[dict], None] | None = None):
        self.listen_host = "127.0.0.1"
        self.listen_port = 4999
        self._on_receive_radio_data = on_receive_radio_data
        self._start_time: float | None = None

        self.app = Flask(__name__)
        self._register_routes()
        self.server_thread = None


    def _register_routes(self):
        @self.app.route("/", methods=["POST"])
        def receive_telemetry():
            # Make sure we have a handler
            if not self._on_receive_radio_data:
                return jsonify({"status": "no handler"}), 500
            
            # Parse incoming JSON data
            data = request.get_json(force=True)
            
            # Format data content
            data_data = data.get("data", {})
            data_in_data: any = data_data.get(data_data.get("type", None), None)

            packet: RadioDataObject = {
                "label": data.get("label", "unknown"),
                "sent_timestamp": data.get("sent_timestamp", 0.0),
                "received_timestamp": time.time(),
                "data": data_in_data
            }
            
            if self._on_receive_radio_data:
                self._on_receive_radio_data(packet)

            return jsonify({"status": "ok"})

        @self.app.route("/shutdown", methods=["POST"])
        def shutdown():
            func = request.environ.get('werkzeug.server.shutdown')
            if func is None:
                return jsonify({"status": "error", "message": "Not running with the Werkzeug Server"}), 500
            func()
            return jsonify({"status": "shutting down"})


    def _start(self):
        print(f"[SERVER] Listening on http://{self.listen_host}:{self.listen_port}")
        self.app.run(host=self.listen_host, port=self.listen_port)


    def start_server(self):
        # Check if the thread is currently running
        if self.server_thread is not None and self.server_thread.is_alive():
            print("[SERVER] Server is already running.")
            return
        # Create a new thread for each start (threads can only be started once)
        self.server_thread = threading.Thread(target=self._start, daemon=True)
        self.server_thread.start()
        self._start_time = time.time()


    def stop_server(self):
        try:
            # Send shutdown request to the server
            requests.post(f"http://{self.listen_host}:{self.listen_port}/shutdown", timeout=2)
        except:
            pass  # Server might already be stopped
        
        # Wait for thread to finish
        if self.server_thread is not None and self.server_thread.is_alive():
            print("[SERVER] Waiting for server thread to terminate...")
            self.server_thread.join()
            print("[SERVER] Server thread terminated.")

    def get_server_runtime(self) -> float | None:
        """
        Returns the runtime of the radio communication server in seconds.
        """
        return time.time() - self._start_time if self._start_time else None