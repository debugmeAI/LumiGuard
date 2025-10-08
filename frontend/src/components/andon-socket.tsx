import { useEffect, useState } from "react";
import io from "socket.io-client";

interface SensorData {
	insert_timestamp: string;
	mac_address: string;
	red_information: number;
	amber_information: number;
	green_information: number;
	working_shift: string;
}

interface DeviceStatus {
	[mac_address: string]: {
		red: number;
		amber: number;
		green: number;
		timestamp: string;
		shift: string;
		lastUpdate: number;
	};
}

const SOCKET_URL = import.meta.env.VITE_SOCKER_URL;
const TIMEOUT_MS = 3000;

export const useAndonSocket = () => {
	const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({});

	const clearExpiredDevices = () => {
		const now = Date.now();
		setDeviceStatus((prev) => {
			const updated = { ...prev };
			let hasChanges = false;

			Object.keys(updated).forEach((mac) => {
				if (now - updated[mac].lastUpdate > TIMEOUT_MS) {
					delete updated[mac];
					hasChanges = true;
				}
			});

			return hasChanges ? updated : prev;
		});
	};

	useEffect(() => {
		const socketInstance = io(SOCKET_URL, {
			transports: ["websocket", "polling"],
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionAttempts: 5,
		});

		socketInstance.on("connect", () => {
			setIsConnected(true);
		});

		socketInstance.on("disconnect", () => {
			setIsConnected(false);
		});

		socketInstance.on("sensor_data", (data: SensorData) => {
			setDeviceStatus((prev) => ({
				...prev,
				[data.mac_address]: {
					red: data.red_information,
					amber: data.amber_information,
					green: data.green_information,
					timestamp: data.insert_timestamp,
					shift: data.working_shift,
					lastUpdate: Date.now(),
				},
			}));
		});

		socketInstance.on("connect_error", (error: Error) => {
			console.error("[Socket.IO] Connection error:", error);
		});

		setSocket(socketInstance);

		const intervalId = setInterval(clearExpiredDevices, 1000);

		return () => {
			socketInstance.disconnect();
			clearInterval(intervalId);
		};
	}, []);

	return { socket, isConnected, deviceStatus };
};
