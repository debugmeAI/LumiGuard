require("dotenv").config({ path: __dirname + "/../.env" });

// Gunakan .env atau fallback ke localhost
const brokerUrl = process.env.MQTT_BROKER || "mqtt://localhost:1883";

module.exports = {
	brokerUrl,
	options: {
		clean: true,
		connectTimeout: 4000,
		reconnectPeriod: 1000,
		// username: process.env.MQTT_USER || undefined,
		// password: process.env.MQTT_PASS || undefined,
	},
	topic: process.env.MQTT_TOPIC,
	qos: Number(process.env.MQTT_QOS) || 0,
};
