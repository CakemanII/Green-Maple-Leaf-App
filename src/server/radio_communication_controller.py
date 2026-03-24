from typing import Callable

class RadioCommunicationController:
    def __init__(self, on_receive_radio_data: Callable[[dict], None] | None = None):
        self.on_receive_radio_data = on_receive_radio_data

    def send_message(self, message):
        pass

    def receive_message(self):
        pass