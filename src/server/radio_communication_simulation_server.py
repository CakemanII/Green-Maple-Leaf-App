from flask import Flask, request, jsonify
import time
from typing import Callable, TypedDict
import threading


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

        self.app = Flask(__name__)
        self._register_routes()
        self.server_thread = threading.Thread(target=self.start, daemon=True)
        self.server_thread.start()

    def _register_routes(self):
        @self.app.route("/", methods=["POST"])
        def receive_telemetry():
            # Make sure we have a handler
            if not self._on_receive_radio_data:
                return jsonify({"status": "no handler"}), 500
            
            # Parse incoming JSON data
            data = request.get_json(force=True)
            
            # Format data content
            datas: list[RadioDataObject] = []
            for v in data:
                data_data = v.get("data", {})
                data_in_data: any = data_data.get(data_data.get("type", None), None)

                packet: RadioDataObject = {
                    "label": v.get("label", "unknown"),
                    "sent_timestamp": v.get("sent_timestamp", 0.0),
                    "received_timestamp": time.time(),
                    "data": data_in_data
                }
            
                datas.append(packet)
            
            self._on_receive_radio_data(datas)

            return jsonify({"status": "ok"})

    def start(self):
        print(f"[SERVER] Listening on http://{self.listen_host}:{self.listen_port}")
        self.app.run(host=self.listen_host, port=self.listen_port)
