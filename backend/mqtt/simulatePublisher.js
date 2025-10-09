// simulator-with-heartbeat.js
require("module-alias/register");

const mqtt = require("mqtt");
const { brokerUrl, options, topic, qos } = require("@mqtt/mqttConfig");

// Daftar device
const DEVICES = ["40:F5:20:47:24:BC", "84:CC:A8:12:9F:32"];

// Konfigurasi
const SENSOR_INTERVAL = 10000; // interval kirim sensor data
const JITTER_MS = 500; // variasi interval
const MALFORMED_CHANCE = 0.06; // 6% payload rusak
const DISTINCT_ATTEMPTS = 10;
const HEARTBEAT_INTERVAL = 3000; // heartbeat setiap 5 detik

// Topic untuk heartbeat (terpisah dari sensor data)
const HEARTBEAT_TOPIC = "device/heartbeat";

// Utilities
function rand(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function chance(p) {
	return Math.random() < p;
}

function statusEquals(a, b) {
	if (!a || !b) return false;
	return a.red === b.red && a.amber === b.amber && a.green === b.green;
}

function genRawStatus() {
	const r = Math.random();
	if (r < 0.6) return { red: 0, amber: 0, green: 1 }; // 60% GREEN
	if (r < 0.85) return { red: 0, amber: 1, green: 0 }; // 25% AMBER
	if (r < 0.95) return { red: 1, amber: 0, green: 0 }; // 10% RED
	// 5% random combination
	return {
		red: Math.random() < 0.3 ? 1 : 0,
		amber: Math.random() < 0.2 ? 1 : 0,
		green: Math.random() < 0.5 ? 1 : 0,
	};
}

function genDistinctStatus(lastStatus) {
	if (!lastStatus) return genRawStatus();

	let attempts = 0;
	let s = genRawStatus();

	while (statusEquals(s, lastStatus) && attempts < DISTINCT_ATTEMPTS) {
		s = genRawStatus();
		attempts++;
	}

	if (statusEquals(s, lastStatus)) {
		// Fallback: flip status secara manual
		const fallback = { ...s };
		fallback.green = 1 - (fallback.green || 0);

		if (statusEquals(fallback, lastStatus)) {
			fallback.green = s.green;
			fallback.amber = 1 - (fallback.amber || 0);
		}

		if (statusEquals(fallback, lastStatus)) {
			fallback.amber = s.amber;
			fallback.red = 1 - (s.red || 0);
		}

		return fallback;
	}

	return s;
}

// Publish heartbeat ke topic terpisah
function publishHeartbeat(client, mac) {
	const payload = JSON.stringify({
		mac_address: mac,
		timestamp: new Date().toISOString(),
		type: "heartbeat",
	});

	client.publish(HEARTBEAT_TOPIC, payload, { qos }, (err) => {
		if (!err) {
			console.log(`[♥️] Heartbeat sent: ${mac}`);
		} else {
			console.error(`[✗] Heartbeat error ${mac}:`, err.message);
		}
	});
}

// Publish sensor data
function publishSensorData(client, mac, status) {
	const payload = JSON.stringify({
		mac_address: mac,
		red: status.red,
		amber: status.amber,
		green: status.green,
		timestamp: new Date().toISOString(),
		type: "sensor_data",
	});

	client.publish(topic, payload, { qos }, (err) => {
		if (!err) {
			const statusIcon =
				(status.red ? "🔴" : "") +
				(status.amber ? "🟡" : "") +
				(status.green ? "🟢" : "");
			console.log(`[📊] Data sent: ${statusIcon || "⚪"} ${mac}`);
		} else {
			console.error(`[✗] Data error ${mac}:`, err.message);
		}
	});
}

function startClient(mac) {
	const clientId = `simulator_${mac.replace(/:/g, "")}_${Date.now()}`;
	const client = mqtt.connect(brokerUrl, { ...options, clientId });

	let lastStatus = null;
	let heartbeatInterval = null;
	let publishTimeout = null;

	client.on("connect", () => {
		console.log(`\n[✅] ${mac} connected to broker`);
		console.log(`    Client ID: ${clientId}`);
		console.log(`    Sensor Topic: ${topic}`);
		console.log(`    Heartbeat Topic: ${HEARTBEAT_TOPIC}`);
		schedulePublish();
		heartbeatInterval = setInterval(() => {
			if (client.connected) {
				publishHeartbeat(client, mac);
			}
		}, HEARTBEAT_INTERVAL);
	});

	client.on("error", (err) => {
		console.error(`[❌] ${mac} MQTT error:`, err.message);
	});

	client.on("close", () => {
		console.log(`[❎] ${mac} disconnected`);
		if (heartbeatInterval) clearInterval(heartbeatInterval);
		if (publishTimeout) clearTimeout(publishTimeout);
	});

	let stopped = false;
	function schedulePublish() {
		if (stopped || !client.connected) return;

		const delay = SENSOR_INTERVAL + rand(-JITTER_MS, JITTER_MS);

		publishTimeout = setTimeout(() => {
			if (client.connected) {
				const status = genDistinctStatus(lastStatus);

				if (chance(MALFORMED_CHANCE)) {
					const broken = `{"mac_address":"${mac}","red":${status.red}`;
					client.publish(topic, broken, { qos }, (err) => {
						if (!err) {
							console.log(`[⚠️] Malformed data sent: ${mac}`);
						}
					});
				} else {
					publishSensorData(client, mac, status);
					lastStatus = status;
				}
			}

			schedulePublish();
		}, Math.max(100, delay));
	}

	return {
		stop: () => {
			stopped = true;
			if (heartbeatInterval) clearInterval(heartbeatInterval);
			if (publishTimeout) clearTimeout(publishTimeout);
			try {
				client.end(true);
			} catch (e) {
				console.error("Error stopping client:", e.message);
			}
		},
	};
}

// Main execution
console.log("═══════════════════════════════════════════════════════════");
console.log("  MQTT Device Simulator with Heartbeat");
console.log("═══════════════════════════════════════════════════════════");
console.log(`  Broker: ${brokerUrl}`);
console.log(`  Devices: ${DEVICES.length}`);
console.log(`  Sensor Interval: ~${SENSOR_INTERVAL}ms ±${JITTER_MS}ms`);
console.log(`  Heartbeat Interval: ${HEARTBEAT_INTERVAL}ms`);
console.log(`  Malformed Rate: ${MALFORMED_CHANCE * 100}%`);
console.log("═══════════════════════════════════════════════════════════\n");

const runners = DEVICES.map((mac) => startClient(mac));

// Graceful shutdown
process.on("SIGINT", () => {
	console.log("\n\n[🛑] Shutting down simulator...");
	runners.forEach((r) => r.stop && r.stop());
	setTimeout(() => {
		console.log("[✓] Simulator stopped");
		process.exit(0);
	}, 500);
});

process.on("SIGTERM", () => {
	console.log("\n[🛑] Received SIGTERM, shutting down...");
	runners.forEach((r) => r.stop && r.stop());
	setTimeout(() => process.exit(0), 500);
});
