from typing import Callable, TypedDict
import threading
import time

class RadioDataObject(TypedDict):
    label: str
    sent_timestamp: float
    received_timestamp: float | None
    data: dict

class RadioComsServer:
    INTERVAL_DELAY = 0.01  # 10 ms delay

    def __init__(self, on_receive_radio_data: Callable[[dict], None] | None = None):
        # Initialize radio communication resources here
        self._on_receive_radio_data = on_receive_radio_data

        # Start the main loop in a separate thread
        self._thread = threading.Thread(target=self._main, daemon=True)
        self._thread.start()


    def _main(self):
        """
        Main loop for managing radio communications.
        """
        while True:
            time.sleep(self.INTERVAL_DELAY)
            # Radio communication handling logic goes here
            # ...

            # Determine if data is received
            # ...

            # Process Data
            current_time = time.time()
            data_object: RadioDataObject = {
                'label': 'accel',
                'sent_timestamp': 0.0,
                'received_timestamp': current_time,
                'data': {'x': 0.0, 'y': 0.0, 'z': 9.8}
            }

            # If data is received, call the callback
            if self._on_receive_radio_data:
                self._on_receive_radio_data(data_object)


    def send_data(self, data: dict):
        """
        Send data over the radio communication channel.
        """
        # Implement sending data logic here
        pass