from flask import Flask
from typing import Callable
import time

import threading

from data_types import RadioDataObject
from flask import jsonify, request
import requests

class TelemetryReceiverSimulationServer:
    def __init__(self, on_receive_radio_data: Callable[[RadioDataObject], None] | None = None):
        self.listen_host = "127.0.0.1"
        self.listen_port = 4999
        self._on_receive_radio_data = on_receive_radio_data
        self._start_time: float | None = None

        self.app = Flask(__name__)
        self._register_routes()
        self.server_thread = None

        self._is_active = False

        self._last_packet_timestamp: float | None = None

        # Start the server immediately
        self._start_server()


    def _register_routes(self):
        @self.app.route("/", methods=["POST"])
        def receive_telemetry():
            # Record the time of the last packet received
            self._last_packet_timestamp = time.time()

            # Make sure we have a handler
            if not self._on_receive_radio_data:
                return jsonify({"status": "no handler"}), 500
            
            # Parse incoming JSON data
            data = request.get_json(force=True)
            
            # Format data content
            data_data = data.get("data")

            data_object: RadioDataObject = {
                "l": data.get("label"),
                "s": data.get("sent_timestamp"),
                "d": data_data
            }
            
            if self._on_receive_radio_data:
                self._on_receive_radio_data(data_object)

            return jsonify({"status": "ok"})


    def _start(self):
        print(f"[SERVER] Listening on http://{self.listen_host}:{self.listen_port}")
        self.app.run(host=self.listen_host, port=self.listen_port)


    def _start_server(self):        
        # Create a new thread for each start (threads can only be started once)
        self.server_thread = threading.Thread(target=self._start, daemon=True)
        self.server_thread.start()
        self._start_time = time.time()

    
    def set_active(self):
        self._is_active = True

    def set_inactive(self):        
        self._is_active = False


    def get_server_runtime(self) -> float | None:
        """
        Returns the runtime of the radio communication server in seconds.
        """
        return time.time() - self._start_time if self._start_time else None
    
    def get_time_since_last_packet(self) -> float | None:
        """
        Returns the timestamp of the last incoming packet received by the server.
        """
        # Return the time since the last packet was received
        return time.time() - self._last_packet_timestamp if self._last_packet_timestamp else None