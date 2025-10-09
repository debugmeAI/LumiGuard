require("module-alias/register");

const mqtt = require("mqtt");
const knex = require("@db/knex");
const { brokerUrl, options, topic, qos } = require("@mqtt/mqttConfig");
const { getDeviceId, clearDeviceCache } = require("@redis/deviceCache");
const { emitToClients } = require("@socket/socketHandler");

const HEARTBEAT_INTERVAL_MS = 5000;
const HEARTBEAT_TOPIC = "device/heartbeat";

const deviceLastActivity = new Map();

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
		console.log("[CONNECTED] Subscribe to broker");

		client.subscribe(topic, { qos }, (err) => {
			if (err) {
				console.error("[ERROR] Subscribe sensor topic", err.message);
			} else {
				console.log(`[SUCCESS] Subscribed to ${topic}`);
			}
		});

		client.subscribe(HEARTBEAT_TOPIC, { qos }, (err) => {
			if (err) {
				console.error("[ERROR] Subscribe heartbeat topic", err.message);
			} else {
				console.log(`[SUCCESS] Subscribed to ${HEARTBEAT_TOPIC}`);
			}
		});
	});

	client.on("message", async (receivedTopic, message) => {
		try {
			const data = JSON.parse(message.toString());
			const { mac_address, type } = data;

			const device = await getDeviceId(mac_address);
			if (!device) {
				console.warn(
					`[IGNORED] ${mac_address} not registered or inactive`
				);
				return;
			}

			const timestamp = new Date().toISOString();

			if (receivedTopic === HEARTBEAT_TOPIC) {
				deviceLastActivity.set(mac_address, Date.now());

				console.log(`[HEARTBEAT] ${mac_address}`);

				emitToClients("heartbeat", {
					mac_address,
					timestamp,
				});
				return;
			}
			if (type === "sensor_data" || !type) {
				const { red, amber, green } = data;
				deviceLastActivity.set(mac_address, Date.now());
				// await knex("sensor_readings").insert({
				// 	insert_timestamp: timestamp,
				// 	mac_address,
				// 	red_information: red,
				// 	amber_information: amber,
				// 	green_information: green,
				// });
				emitToClients("sensor_data", {
					insert_timestamp: timestamp,
					mac_address,
					red_information: red,
					amber_information: amber,
					green_information: green,
				});

				console.log(
					`[SENSOR] ${mac_address} | 🔴 ${red} 🟡 ${amber} 🟢 ${green}`
				);
			}
		} catch (err) {
			console.error("[ERROR] Handling message:", err.message);
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
		const TIMEOUT_MS = 15000;

		try {
			const activeDevices = await knex("devices")
				.select("mac_address", "device_name")
				.where("status", "Active");

			activeDevices.forEach((device) => {
				const lastSeen = deviceLastActivity.get(device.mac_address);
				const isOnline = lastSeen && now - lastSeen < TIMEOUT_MS;

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
						`[STATUS] ${device.mac_address} OFFLINE (${offlineSeconds}s since last activity)`
					);
				}
			});
		} catch (err) {
			console.error("[ERROR] Heartbeat check:", err.message);
		}
	}, HEARTBEAT_INTERVAL_MS);

	setInterval(() => {
		const now = Date.now();
		const TIMEOUT_MS = 15000;

		const onlineDevices = Array.from(deviceLastActivity.entries())
			.filter(([_, lastSeen]) => now - lastSeen < TIMEOUT_MS)
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
