// simulator-brutal.js
require("module-alias/register");

const mqtt = require("mqtt");
const { brokerUrl, options, topic, qos } = require("@mqtt/mqttConfig");

// Device list (gunakan MAC dari DB kalau perlu)
const REGISTERED_DEVICES = [
	"40:F5:20:47:24:BC", // LG-01
	"84:CC:A8:12:9F:32", // LG-02
	// tambahin kalau mau
];

// CONFIG BRUTALITY (ubah sesuai selera)
const MIN_INTERVAL_MS = 200; // min delay antar publish per device
const MAX_INTERVAL_MS = 5000; // max delay antar publish per device
const BURST_CHANCE = 0.12; // 12% chance device ngelakuin burst
const BURST_COUNT_MIN = 3;
const BURST_COUNT_MAX = 10;
const MALFORMED_CHANCE = 0.08; // 8% chance payload malformed
const COMBO_CHANCE = 0.25; // 25% chance status kombinasi (bukan exclusive)
// DISCONNECT logic removed — no more simulated disconnects

// Internal state holder
const deviceStates = new Map();

// Helper random utilities
function rand(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
function chance(p) {
	return Math.random() < p;
}

// Compare two status objects {red,amber,green}
function statusEquals(a, b) {
	if (!a || !b) return false;
	return a.red === b.red && a.amber === b.amber && a.green === b.green;
}

// Generate a status (0/1) respecting COMBO_CHANCE
function genRawStatus() {
	if (chance(COMBO_CHANCE)) {
		const red = chance(0.2) ? 1 : 0;
		const amber = chance(0.3) ? 1 : 0;
		const green = chance(0.7) ? 1 : 0;
		return { red, amber, green };
	}
	const r = Math.random();
	if (r < 0.6) return { red: 0, amber: 0, green: 1 };
	if (r < 0.85) return { red: 0, amber: 1, green: 0 };
	return { red: 1, amber: 0, green: 0 };
}

// Make a status that is different from lastStatus (tries up to attemptsLimit)
function makeDistinctStatus(lastStatus, attemptsLimit = 10) {
	let attempts = 0;
	let s = genRawStatus();
	while (
		lastStatus &&
		statusEquals(s, lastStatus) &&
		attempts < attemptsLimit
	) {
		s = genRawStatus();
		attempts++;
	}
	// if after attempts still equal, flip one bit to guarantee difference
	if (lastStatus && statusEquals(s, lastStatus)) {
		// flip green first, then amber, then red
		const fallback = { ...s };
		if (typeof fallback.green === "number")
			fallback.green = 1 - fallback.green;
		else fallback.green = 1;
		if (statusEquals(fallback, lastStatus)) {
			fallback.green = s.green; // revert
			fallback.amber = 1 - (s.amber || 0);
		}
		if (statusEquals(fallback, lastStatus)) {
			fallback.amber = s.amber;
			fallback.red = 1 - (s.red || 0);
		}
		return fallback;
	}
	return s;
}

function createClientFor(macAddress, index) {
	const clientId = `sim_brutal_${macAddress.replace(
		/:/g,
		""
	)}_${Date.now()}_${rand(0, 9999)}`;
	let client = mqtt.connect(brokerUrl, {
		...options,
		clientId,
		reconnectPeriod: 2000,
	});

	const ctx = {
		mac: macAddress,
		index,
		client,
		running: true,
		publishTimer: null,
		lastStatus: null, // simpan status terakhir yang valid (object) per device
	};

	deviceStates.set(macAddress, ctx);

	client.on("connect", () => {
		console.log(
			`[✓] Device ${
				index + 1
			} (${macAddress}) connected (id: ${clientId})`
		);
		scheduleNextPublish(ctx);
	});

	client.on("reconnect", () => {
		console.log(`[↻] Device ${macAddress} reconnecting...`);
	});

	client.on("close", () => {
		console.log(`[x] Device ${macAddress} connection closed`);
		if (ctx.publishTimer) {
			clearTimeout(ctx.publishTimer);
			ctx.publishTimer = null;
		}
	});

	client.on("error", (err) => {
		console.error(`[✗] Device ${macAddress} Error:`, err.message);
	});

	client.on("offline", () => {
		console.log(`[!] Device ${macAddress} offline`);
	});

	// endNow kept for graceful shutdown, but simulator won't intentionally disconnect devices
	ctx.endNow = (force = false) => {
		try {
			ctx.running = false;
			if (ctx.publishTimer) {
				clearTimeout(ctx.publishTimer);
				ctx.publishTimer = null;
			}
			client.end(force, () => {});
		} catch (e) {
			// ignore
		}
	};

	return ctx;
}

function scheduleNextPublish(ctx) {
	if (!ctx.running) return;

	const delay = rand(MIN_INTERVAL_MS, MAX_INTERVAL_MS);

	ctx.publishTimer = setTimeout(async () => {
		// No simulated disconnect here — removed per request

		// Burst mode
		if (chance(BURST_CHANCE)) {
			const burstCount = rand(BURST_COUNT_MIN, BURST_COUNT_MAX);
			console.log(`[>>>] Device ${ctx.mac} BURST x${burstCount}`);
			for (let i = 0; i < burstCount; i++) {
				await publishOnce(ctx);
				// small gap between publishes in burst; this still enforces distinctness
				await new Promise((res) => setTimeout(res, rand(50, 300)));
			}
		} else {
			await publishOnce(ctx);
		}

		scheduleNextPublish(ctx);
	}, delay);
}

// Build payload while ensuring generated status is distinct from ctx.lastStatus.
// Returns { payloadString, hasStatus } where hasStatus = true if payload contains status fields.
function buildPayload(ctx) {
	// generate status distinct from lastStatus
	const status = makeDistinctStatus(ctx.lastStatus);

	// Occasionally send malformed payload
	if (chance(MALFORMED_CHANCE)) {
		const malformedType = Math.random();
		if (malformedType < 0.33) {
			// Missing timestamp originally — we also keep no timestamp here but include status
			const p = JSON.stringify({ mac_address: ctx.mac, ...status });
			return { payload: p, hasStatus: true, status };
		} else if (malformedType < 0.66) {
			// Broken JSON but includes red (still conveys status partially) — NO timestamp
			const broken = `{"mac_address": "${ctx.mac}", "red": ${status.red}`;
			return { payload: broken, hasStatus: true, status };
		} else {
			// Random noise -> no status update (we consider this non-status payload)
			const noise = `NOISE::${rand(1000, 9999)}`;
			return { payload: noise, hasStatus: false, status: null };
		}
	}

	// Normal payload: valid JSON with status (no timestamp)
	const normal = JSON.stringify({
		mac_address: ctx.mac,
		...status,
	});
	return { payload: normal, hasStatus: true, status };
}

function publishOnce(ctx) {
	return new Promise((resolve) => {
		if (!ctx.client || !ctx.client.connected) {
			return resolve();
		}

		const { payload, hasStatus, status } = buildPayload(ctx);

		ctx.client.publish(topic, payload, { qos }, (err) => {
			if (err) {
				console.error(
					`[✗] Device ${ctx.mac} publish error:`,
					err.message
				);
			} else {
				let printed = "";
				try {
					const p = JSON.parse(payload);
					const s =
						(p.red ? "🔴" : "") +
						(p.amber ? "🟡" : "") +
						(p.green ? "🟢" : "");
					printed = `${s || "⚪"} ${ctx.mac}`;
				} catch (e) {
					// malformed or noise
					if (hasStatus && status) {
						// try to show status from our generated status even if payload malformed
						const s =
							(status.red ? "🔴" : "") +
							(status.amber ? "🟡" : "") +
							(status.green ? "🟢" : "");
						printed = `${s || "⚪"} ${ctx.mac} (malformed payload)`;
					} else {
						printed = `🔀 ${ctx.mac} (noise)`;
					}
				}
				console.log(`[→] ${printed}`);

				// Update lastStatus only if payload actually carried status info
				if (hasStatus && status) {
					ctx.lastStatus = status;
				}
			}
			resolve();
		});
	});
}

// Start banner
console.log(`
╔════════════════════════════════════════════════════════╗
║           MQTT ANDON SIMULATOR — BRUTAL MODE           ║
║     (Status: 0/1 only, combos allowed, distinct-next)  ║
╚════════════════════════════════════════════════════════╝

Broker: ${brokerUrl}
Topic: ${topic}
Devices: ${REGISTERED_DEVICES.length}

BRUTAL CONFIG:
 - interval ${MIN_INTERVAL_MS}..${MAX_INTERVAL_MS} ms
 - burst chance ${Math.round(BURST_CHANCE * 100)}%
 - malformed chance ${Math.round(MALFORMED_CHANCE * 100)}%
 - combo chance ${Math.round(COMBO_CHANCE * 100)}% (e.g., red+green)
 - rule: next status != previous status
 - NOTE: payloads do NOT include timestamps

Starting devices...
`);

REGISTERED_DEVICES.forEach((mac, i) => {
	createClientFor(mac, i);
});

// Graceful shutdown
process.on("SIGINT", () => {
	console.log("\n[!] Shutting down brutal simulator...");
	for (const [mac, ctx] of deviceStates) {
		try {
			ctx.running = false;
			if (ctx.publishTimer) clearTimeout(ctx.publishTimer);
			if (ctx.client && ctx.client.connected) ctx.client.end(true);
		} catch (e) {}
	}
	setTimeout(() => process.exit(0), 300);
});
