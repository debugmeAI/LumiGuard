require("module-alias/register");

const mqtt = require("mqtt");
const knex = require("@db/knex");
const { brokerUrl, options, qos } = require("@mqtt/mqttConfig");
const { getDeviceId, clearDeviceCache } = require("@redis/deviceCache");
const { emitToClients } = require("@socket/socketHandler");

const SENSOR_TOPIC = "device/sensor_data";
const HEARTBEAT_TOPIC = "device/heartbeat";

const HEARTBEAT_INTERVAL_MS = 5000;
const DEVICE_TIMEOUT_MS = 15000;
const deviceLastActivity = new Map();

function getLocalTimestamp() {
	const now = new Date();
	return (
		now.getFullYear() +
		"-" +
		String(now.getMonth() + 1).padStart(2, "0") +
		"-" +
		String(now.getDate()).padStart(2, "0") +
		" " +
		String(now.getHours()).padStart(2, "0") +
		":" +
		String(now.getMinutes()).padStart(2, "0") +
		":" +
		String(now.getSeconds()).padStart(2, "0")
	);
}

const clearAllCache = async () => {
	console.log("[INIT] Clearing Redis cache");
	await clearDeviceCache();
};

(async () => {
	await clearAllCache();

	const client = mqtt.connect(brokerUrl, {
		...options,
		clientId: `backend_logger_${Date.now()}_${Math.floor(
			Math.random() * 1000
		)}`,
	});

	client.on("connect", () => {
		console.log("[MQTT] Connected to broker");

		client.subscribe(SENSOR_TOPIC, { qos }, (err) => {
			if (err) {
				console.error(
					"[ERROR] Failed to subscribe to sensor topic:",
					err.message
				);
			} else {
				console.log(
					`[SUB] Subscribed to sensor topic: ${SENSOR_TOPIC}`
				);
			}
		});

		client.subscribe(HEARTBEAT_TOPIC, { qos }, (err) => {
			if (err) {
				console.error(
					"[ERROR] Failed to subscribe to heartbeat topic:",
					err.message
				);
			} else {
				console.log(
					`[SUB] Subscribed to heartbeat topic: ${HEARTBEAT_TOPIC}`
				);
			}
		});
	});

	client.on("message", async (receivedTopic, message) => {
		try {
			const data = JSON.parse(message.toString());
			const { mac_address } = data;

			if (!mac_address) {
				console.warn("[SKIP] Message missing mac_address");
				return;
			}

			const device = await getDeviceId(mac_address);
			if (!device) {
				console.warn(
					`[IGNORED] ${mac_address} not registered or inactive`
				);
				return;
			}

			const timestamp = getLocalTimestamp();
			deviceLastActivity.set(mac_address, Date.now());

			if (receivedTopic === HEARTBEAT_TOPIC) {
				console.log(`[HEARTBEAT] ${mac_address}`);
				emitToClients("heartbeat", {
					mac_address,
					timestamp,
				});
				return;
			}

			if (receivedTopic === SENSOR_TOPIC) {
				const { red, amber, green } = data;

				if (red == null || amber == null || green == null) {
					console.warn(
						`[INVALID] Missing status fields from ${mac_address}`
					);
					return;
				}

				await knex("sensor_readings").insert({
					insert_timestamp: timestamp,
					mac_address,
					red_information: red,
					amber_information: amber,
					green_information: green,
				});

				emitToClients("sensor_data", {
					insert_timestamp: timestamp,
					mac_address,
					red_information: red,
					amber_information: amber,
					green_information: green,
				});

				console.log(
					`[SENSOR] ${timestamp} | ${mac_address} | 🔴 ${red} 🟡 ${amber} 🟢 ${green}`
				);
				return;
			}
			console.warn(`[UNKNOWN TOPIC] ${receivedTopic}`);
		} catch (err) {
			console.error(
				"[ERROR] Parsing or handling MQTT message:",
				err.message
			);
			console.error("[PAYLOAD]", message.toString());
		}
	});

	client.on("error", (err) => {
		console.error("[MQTT ERROR]", err.message);
	});

	client.on("close", () => {
		console.log("[MQTT] Connection closed");
	});

	setInterval(async () => {
		const now = Date.now();
		try {
			const activeDevices = await knex("devices")
				.select("mac_address", "device_name")
				.where("status", "Active");

			for (const device of activeDevices) {
				const lastSeen = deviceLastActivity.get(device.mac_address);
				const isOnline = lastSeen && now - lastSeen < DEVICE_TIMEOUT_MS;

				emitToClients("device_status", {
					mac_address: device.mac_address,
					device_name: device.device_name,
					isOnline,
					timestamp: new Date().toISOString(),
					lastSeen: lastSeen
						? new Date(lastSeen).toISOString()
						: null,
				});

				if (!isOnline && lastSeen) {
					const offlineSeconds = Math.floor((now - lastSeen) / 1000);
					console.log(
						`[STATUS] ${device.mac_address} OFFLINE (${offlineSeconds}s)`
					);
				}
			}
		} catch (err) {
			console.error("[ERROR] Device status check:", err.message);
		}
	}, HEARTBEAT_INTERVAL_MS);

	setInterval(() => {
		const now = Date.now();
		const onlineDevices = Array.from(deviceLastActivity.entries())
			.filter(([_, lastSeen]) => now - lastSeen < DEVICE_TIMEOUT_MS)
			.map(([mac]) => mac);

		console.log(`[STATUS] Online devices: ${onlineDevices.length}`);
		if (onlineDevices.length > 0) {
			console.log(`  ${onlineDevices.join(", ")}`);
		}
	}, 30000);
})();

process.on("SIGINT", () => {
	console.log("\n[SHUTDOWN] Stopping MQTT handler...");
	process.exit(0);
});

process.on("SIGTERM", () => {
	console.log("[SHUTDOWN] Received SIGTERM");
	process.exit(0);
});
