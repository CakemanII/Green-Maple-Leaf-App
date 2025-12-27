import time
from typing import TypedDict, TypeVar, Generic, Callable
import threading

from radio_communication_simulation_server import RadioComsSimulationServer

T = TypeVar("T")


class LinearMotionComponent(TypedDict):
    lng: float
    lat: float
    vert: float

class AngularMotionComponent(TypedDict):
    pitch: float
    yaw: float
    roll: float

class GPSCoordinates(TypedDict):
    lat: float
    lng: float


class TimeStamped(Generic[T], TypedDict):
    label: str
    received_timestamp: float
    sent_timestamp: float
    data: T


class InternalRadioDataBuffer(TypedDict):
    # ICM-20649 6-DoF
    accel: TimeStamped[LinearMotionComponent] # Linear Acceleration
    vel: TimeStamped[LinearMotionComponent] # Linear Velocity TEMPORARY
    ang_vel: TimeStamped[AngularMotionComponent] # Angular Velocity
    ang_pos: TimeStamped[AngularMotionComponent] # Angular Position (IF 9-DoF is used, otherwise not accurate)

    # GY-NEO6MV2 NEO-6M GPS
    gps_stamp: TimeStamped[float] # GPS Timestamp
    gps_coords: TimeStamped[GPSCoordinates] # GPS Coordinates
    gps_alt: TimeStamped[float] # GPS Altitude
    gps_speed: TimeStamped[float] # GPS Speed
    gps_course: TimeStamped[float] # GPS Course
    gps_n_sat: TimeStamped[int] # Number of Satellites
    gps_type: TimeStamped[int] # GPS Fix Type

    # DPS310
    baro_pres: TimeStamped[float] # Barometric Pressure
    dps_alt: TimeStamped[float] # Altitude from DPS310
    amb_temp: TimeStamped[float] # Ambient Temperature
    
    # RaspPi 4B
    laten: TimeStamped[float] # Latency to Rocket
    ram_use: TimeStamped[float] # RAM Usage
    cpu_use: TimeStamped[float] # CPU Usage
    store_cap: TimeStamped[float] # Storage Capacity
    volt_in: TimeStamped[float] # Voltage Intake
    pow_in: TimeStamped[float] # Power Intake
    comp_temp: TimeStamped[float] # Computer Temperature
    up: TimeStamped[float] # Uptime
    
    # Parachute
    para_stat: TimeStamped[bool] # Parachute Deployment Status
    

class RadioCommunicationBuffer:
    """
    Communication for rocket data transmission and reception.
    This class will handle sending data to the rocket and receiving data from it, as well as sending that data to the web server.
    """

    INTERVAL_DELAY: float = 0.05  # Minimum interval between processing
    
    def __init__(
            self,
            min_send_interval: float = 0.1,
            on_receive_data: Callable[[list[TimeStamped[object]]], None] | None = None
        ):
        # Setup Variables
        self.min_send_interval = min_send_interval
        self.last_send_time = 0.0

        self.on_receive_data = on_receive_data

        self.internal_buffer: InternalRadioDataBuffer = {} # Internal data buffer
        self.label_queue: list[str] = [] # For label queue

        # Start the main loop in a separate thread
        self._thread = threading.Thread(target=self._main, daemon=True)
        self._thread.start()

        # Initialize the RadioComsManager
        #self.radio_coms_manager = RadioComsServer(on_receive_radio_data=self._receive_data)
        self.radio_coms_manager = RadioComsSimulationServer(on_receive_radio_data=self._receive_data)


    def _main(self):
        """
        Main Loop execution for Rocket Communication to the webserver.
        """
        while True:
            time.sleep(self.INTERVAL_DELAY)
            if self._can_send():
                # Send data from queue
                if len(self.label_queue) > 0:
                    for label in self.label_queue:
                        data: TimeStamped[object] = self.internal_buffer[label]
                        if self.on_receive_data:
                            self.on_receive_data(label, data)
                    # Clear the queue
                    self.label_queue = []                    


    def _receive_data(self, data: dict):
        """
        Called when data is received from the rocket coms server.
        """
        if not self.on_receive_data:
            raise Exception("No on_receive_data callback provided")
        
        # Split data into components and handle accordingly
        label: str = data.get('label', '')
        sent_timestamp: float = data.get('sent_timestamp', -1.0)
        received_timestamp: float | None = data.get('received_timestamp', None)
        data_value: object = data.get('data', None)

        # Ensure the label is correct
        if label not in InternalRadioDataBuffer.__annotations__:
            print(f"Received unknown data label: {label}")
            return
        
        # Check if the label has the same sent_timestamp.
        if  label in self.internal_buffer:
            existing_data: TimeStamped[object] = self.internal_buffer[label]
            if existing_data['sent_timestamp'] == sent_timestamp:
                print(f"Duplicate data received for label: {label} with sent_timestamp: {sent_timestamp}. Ignoring.")
                return
        
        # Update internal buffer
        timestamped_data: TimeStamped[object] = {
            'received_timestamp': received_timestamp,
            'sent_timestamp': sent_timestamp,
            'data': data_value
        }
        self.internal_buffer[label] = timestamped_data

        # Add label to queue
        if label not in self.label_queue:
            self.label_queue.append(label)


    def _can_send(self) -> bool:
        """
        Returns True if enough time has passed since the last send to allow sending new data.
        """
        return (time.time() - self.last_send_time >= self.min_send_interval)
            

    def send_command(self, command: dict):
        pass
