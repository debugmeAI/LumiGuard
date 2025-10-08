require("module-alias/register");

const mqtt = require("mqtt");
const knex = require("@db/knex");
const { brokerUrl, options, topic, qos } = require("@mqtt/mqttConfig");
const { getDeviceId, clearDeviceCache } = require("@redis/deviceCache");
const { emitToClients } = require("@socket/socketHandler");

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
				console.error("[ERROR] Subscribe", err.message);
			} else {
				console.log(`[SUCCESS] Subscribed to topic ${topic}`);
			}
		});
	});

	client.on("message", async (receivedTopic, message) => {
		if (receivedTopic !== topic) return;

		try {
			const data = JSON.parse(message.toString());
			const { mac_address, red, amber, green } = data;

			const timestamp = new Date()
				.toLocaleString("sv-SE")
				.replace("T", " ")
				.replaceAll(".", ":");

			const device = await getDeviceId(mac_address);
			if (!device) {
				console.warn(
					`[IGNORED] ${mac_address} not registered or inactive`
				);
				return;
			}

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
				`[SAVED] ${mac_address} | RED ${red} | AMBER ${amber} | GREEN ${green}`
			);
		} catch (err) {
			console.error("[ERROR] handling message:", err.message);
		}
	});
})();
