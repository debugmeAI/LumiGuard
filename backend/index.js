require("module-alias/register");
require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");
const os = require("os");

const app = express();
app.use(cors());
app.use(express.json());

const { setupSocket } = require("@socket/socketHandler");

const server = http.createServer(app);
setupSocket(server);

require("@db/knex");
require("@mqtt/mqttHandler");

const apiRoutes = require("@routes");
app.use("/api", apiRoutes);

app.use(
	"/lumiguard",
	express.static(path.join(__dirname, "public/dist"), {
		index: false,
		setHeaders: (res, filePath) => {
			if (filePath.endsWith(".js")) {
				res.setHeader("Content-Type", "application/javascript");
			} else if (filePath.endsWith(".css")) {
				res.setHeader("Content-Type", "text/css");
			}
		},
	})
);

app.get("/", (req, res) => {
	res.redirect("/lumiguard/");
});

app.use((req, res) => {
	if (req.path.startsWith("/api")) {
		return res.status(404).json({ error: "API endpoint not found" });
	}

	if (req.path.startsWith("/lumiguard/")) {
		if (
			!req.path.match(
				/\.(js|css|png|jpg|jpeg|gif|svg|ico|json|woff|woff2|ttf|eot|map)$/
			)
		) {
			return res.sendFile(path.join(__dirname, "public/dist/index.html"));
		}
	}

	res.status(404).send("Page not found");
});

// Function untuk get local IP
function getLocalIP() {
	const interfaces = os.networkInterfaces();
	for (const name of Object.keys(interfaces)) {
		for (const iface of interfaces[name]) {
			if (iface.family === "IPv4" && !iface.internal) {
				return iface.address;
			}
		}
	}
	return "localhost";
}

const PORT = process.env.PORT || 1313;
const HOST = "0.0.0.0"; // Bind ke semua network interface

server.listen(PORT, HOST, () => {
	const localIP = getLocalIP();
	console.log(`[RUN] Backend running at:`);
	console.log(`[RUN] - Local: http://localhost:${PORT}/lumiguard/`);
	console.log(`[RUN] - Network: http://${localIP}:${PORT}/lumiguard/`);
	console.log(`[RUN] API available at: http://localhost:${PORT}/api`);
});
