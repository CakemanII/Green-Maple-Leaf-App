from flask import Flask
from typing import Callable
import time

import threading

from data_types import RadioDataObject
from flask import jsonify, request
import requests

from data_compression import DataCompression
from telemetry_data_transfer_types_retrieval import TelemetryDataTransferTypes
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding
import os

class TelemetryReceiverSimulationServer:
    def __init__(self, 
                 on_receive_radio_data: Callable[[RadioDataObject], None] | None = None,
                 aes_key: bytes = None,
                 telemetry_data_transfer_types: TelemetryDataTransferTypes = None):
        self.listen_host = "127.0.0.1"
        self.listen_port = 4999
        self._on_receive_radio_data = on_receive_radio_data
        self._start_time: float | None = None
        self._telemetry_data_transfer_types = telemetry_data_transfer_types

        self.app = Flask(__name__)
        self._register_routes()
        self.server_thread = None

        self._is_active = False

        self._last_packet_timestamp: float | None = None

        # AES encryption key (32 bytes for AES-256) - same as rocket communication controller
        if aes_key is None:
            # Generate a random 32-byte key if none provided
            self._aes_key = os.urandom(32)
            print(f"⚠️  Simulation Server - Generated new AES key: {self._aes_key.hex()}")
            print("    Save this key for the ground station!")
        else:
            if len(aes_key) not in [16, 24, 32]:
                raise ValueError("AES key must be 16, 24, or 32 bytes")
            self._aes_key = aes_key
            print(f"✅ Simulation Server - Using provided AES-{len(aes_key)*8} key")

        # Start the server immediately
        self._start_server()

    # region AES Encryption/Decryption (Same as RocketCommunication)
    def _encrypt_aes(self, data: bytes) -> bytes:
        """
        Encrypt data using AES-256-CBC.
        Returns: IV (16 bytes) + encrypted data
        """
        # Generate random initialization vector
        iv = os.urandom(16)
        
        # Create cipher
        cipher = Cipher(
            algorithms.AES(self._aes_key),
            modes.CBC(iv),
            backend=default_backend()
        )
        encryptor = cipher.encryptor()
        
        # Pad data to AES block size (128 bits / 16 bytes)
        padder = padding.PKCS7(128).padder()
        padded_data = padder.update(data) + padder.finalize()
        
        # Encrypt
        encrypted = encryptor.update(padded_data) + encryptor.finalize()
        
        # Return IV + encrypted data (IV needed for decryption)
        return iv + encrypted

    def _decrypt_aes(self, encrypted_data: bytes) -> bytes:
        """
        Decrypt AES-256-CBC encrypted data.
        Expects: IV (16 bytes) + encrypted data
        """
        # Extract IV and ciphertext
        iv = encrypted_data[:16]
        ciphertext = encrypted_data[16:]
        
        # Create cipher
        cipher = Cipher(
            algorithms.AES(self._aes_key),
            modes.CBC(iv),
            backend=default_backend()
        )
        decryptor = cipher.decryptor()
        
        # Decrypt
        padded_data = decryptor.update(ciphertext) + decryptor.finalize()
        
        # Unpad
        unpadder = padding.PKCS7(128).unpadder()
        data = unpadder.update(padded_data) + unpadder.finalize()
        
        return data
    # endregion

    def _register_routes(self):
        @self.app.route("/", methods=["POST"])
        def receive_telemetry():
            # Record the time of the last packet received
            self._last_packet_timestamp = time.time()

            # Make sure we have a handler
            if not self._on_receive_radio_data:
                return jsonify({"status": "no handler"}), 500
            
            # Get raw binary data from request body
            encrypted_packet = request.get_data()
            
            try:
                # Decrypt packet (same as rocket communication controller)
                try:
                    decrypted_bytes = self._decrypt_aes(encrypted_packet)
                except Exception as e:
                    # Fallback to raw packet if decryption fails
                    print(f"⚠️  Decryption failed, using raw packet: {e}")
                    decrypted_bytes = encrypted_packet

                # Decompress data using DataCompression (same protocol as rocket)
                if self._telemetry_data_transfer_types is not None:
                    datas, sent_timestamp = DataCompression.decompress_data(
                        decrypted_bytes, 
                        self._telemetry_data_transfer_types
                    )
                    
                    # Process each telemetry object
                    for data in datas:
                        data_object: RadioDataObject = {
                            "l": data["label"],
                            "s": data["timestamp"],
                            "d": data["data"]
                        }
                        
                        if self._on_receive_radio_data:
                            self._on_receive_radio_data(data_object)
                else:
                    print("⚠️  No telemetry data transfer types configured - cannot decompress")
                    
            except Exception as e:
                print(f"❌ Error processing packet: {e}")
                return jsonify({"status": "error", "message": str(e)}), 400

            return jsonify({"status": "ok"})


    def _start(self):
        print(f"[SIMULATION SERVER] Listening on http://{self.listen_host}:{self.listen_port}")
        print(f"[SIMULATION SERVER] Using same protocols as real rocket communication:")
        print(f"  - AES-{len(self._aes_key)*8} encryption")
        print(f"  - DataCompression with msgpack/zlib/lzma")
        print(f"  - Label encoding with telemetry data transfer types")
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