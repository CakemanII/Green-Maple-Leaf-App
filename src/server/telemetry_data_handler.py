import time

from telemetry_data_to_clients import SendDataToClientsQueue
from telemetry_data_cache_manager import TelemetryDataCacheManager
from telemetry_data_processing_manager import TelemetryDataProcessingManager, IntegralHandlerCreator, DerivativeHandlerCreator
from telemetry_data_saving import TelemetrySaveQueue
from telemetry_receiver_simulation_server import TelemetryReceiverSimulationServer

from data_types import InputDataPoint, InputTelemetryID, ProcessedDataPoint, ProcessedTelemetryID, RadioDataObject
from typing import Callable

RocketConnectionStatus = int # 0 = No Connection, 1 = Poor Connection, 2 = Connected

class TelemetryDataManager:
    """
    This class is responsible for handling telemetry data, including receiving new data points, processing them using registered handlers, and managing the cache of telemetry data.
    It interacts with the TelemetryDataProcessingManager to process new data points and generate new processed telemetry data.
    """
    def __init__(self, send_data_to_web_clients_callback: Callable[[ProcessedTelemetryID, ProcessedDataPoint], None]):
        self.send_data_to_web_clients_callback = send_data_to_web_clients_callback # Function for sending processed telemetry data to web clients
        self._cache = TelemetryDataCacheManager() # Cache for telemetry data points, used for multi processed input handlers
        self._saving_manager = TelemetrySaveQueue(30, None) # Manager for saving telemetry data to files
        self._send_data_to_clients_queue = SendDataToClientsQueue(60, self.send_data_to_web_clients_callback) # Queue for sending processed telemetry data to web clients at a controlled rate
        self._processing_manager = TelemetryDataProcessingManager(self._saving_manager, self._cache, self._send_data_to_clients_queue) # Manager for processing telemetry data and generating new processed data
        self._simulation_server = TelemetryReceiverSimulationServer(on_receive_radio_data=self.receive_new_data_point) # Simulation server for receiving telemetry data from the rocket

        self._is_active: bool = False

        self._initialize_handlers()
        self.set_active(True)

    def set_active(self, active: bool):
        if active:
            self._saving_manager.set_queue_active(True)
            self._send_data_to_clients_queue.set_queue_active(True)
            self._simulation_server.set_active()
        else:
            self._saving_manager.set_queue_active(False)
            self._send_data_to_clients_queue.set_queue_active(False)
            self._simulation_server.set_inactive()
        self._is_active = active

    def is_connected_to_rocket(self) -> int:
        """
        Check the connectivity status to the rocket based on the timestamp of the last received packet.
        Returns:
            int: 0 for No Connection, 1 for Poor Connection, 2 for Connected
        """
        last_packet_time = self._simulation_server.get_time_since_last_packet()
        if last_packet_time is None:
            return 0 # No Connection

        time_since_last_packet = time.time() - last_packet_time
        if time_since_last_packet < 0.2: # If we received a packet in the last 5 seconds, consider it connected
            return 2 # Connected
        elif time_since_last_packet < 5: # If we received a packet in the last 15 seconds, consider it poor connection
            return 1 # Poor Connection
        else:
            return 0 # No Connection

    def receive_new_data_point(self, radio_data: RadioDataObject) -> None:
        if not self._is_active: return

        # Convert radio data object to input telemetry ID and data point
        self._processing_manager.process_new_input_data(radio_data[0], radio_data[1])

    def _initialize_handlers(self):
        # Input handlers
        # self._processing_manager.register_single_input_handler("imu.acc", "absolute_linear_motion.acceleration")
        self._processing_manager.register_single_input_handler("imu.ang_vel", "absolute_angular_motion.angular_velocity")

        self._processing_manager.register_single_processed_handler(
            "absolute_angular_motion.angular_velocity",
            DerivativeHandlerCreator(
                self._processing_manager,
                "absolute_angular_motion.angular_velocity",
                "absolute_angular_motion.angular_acceleration",
            ).handler
        )

        self._processing_manager.register_single_processed_handler(
            "absolute_angular_motion.angular_velocity",
            IntegralHandlerCreator(
                self._processing_manager,
                "absolute_angular_motion.angular_velocity",
                "absolute_angular_motion.angle_displacement",
            ).handler
        )