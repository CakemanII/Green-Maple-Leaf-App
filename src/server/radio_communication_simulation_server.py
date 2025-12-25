from flask import Flask, request, jsonify
import time
from typing import Callable, TypedDict


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
        self.start()

    def _register_routes(self):
        @self.app.route("/", methods=["POST"])
        def receive_telemetry():
            data = request.get_json(force=True)
            print(data)

            packet: RadioDataObject = {
                "label": data.get("label", "unknown"),
                "sent_timestamp": data.get("sent_timestamp", 0.0),
                "received_timestamp": time.time(),
                "data": data.get("data", {})
            }

            print("\n=== RECEIVED TELEMETRY ===")
            print(packet)
            print("==========================\n")

            if self._on_receive_radio_data:
                self._on_receive_radio_data(packet)

            return jsonify({"status": "ok"})

    def start(self):
        print(f"[SERVER] Listening on http://{self.listen_host}:{self.listen_port}")
        self.app.run(host=self.listen_host, port=self.listen_port)
