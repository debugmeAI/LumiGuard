require("module-alias/register");

const express = require("express");
const router = express.Router();
const knex = require("@db/knex");

router.get("/", async (req, res) => {
	try {
		const { page = 1, limit = 15 } = req.query;
		const parsedLimit = parseInt(limit);
		const parsedPage = parseInt(page);
		const offset = (parsedPage - 1) * parsedLimit;

		const rows = await knex("sensor_readings as r")
			.join("devices as d", "r.mac_address", "=", "d.mac_address")
			.select(
				"r.id",
				"r.insert_timestamp",
				"d.device_name",
				"d.location",
				"r.mac_address",
				"r.red_information",
				"r.amber_information",
				"r.green_information"
			)
			.orderBy("r.id", "asc")
			.limit(parsedLimit)
			.offset(offset);

		const totalResult = await knex("sensor_readings").count("* as count").first();
		const total = totalResult?.count || 0;

		res.json({
			data: rows,
			pagination: {
				page: parsedPage,
				limit: parsedLimit,
				total,
				pages: Math.ceil(total / parsedLimit),
			},
		});
	} catch (err) {
		console.error("GET /sensor-data/ error:", err.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

router.get("/interval-paginated", async (req, res) => {
	try {
		const { page = 1, limit = 15 } = req.query;
		const parsedLimit = parseInt(limit);
		const parsedPage = parseInt(page);
		const offset = (parsedPage - 1) * parsedLimit;

		const rows = await knex("sensor_readings as r")
			.join("devices as d", "r.mac_address", "=", "d.mac_address")
			.select(
				"r.id",
				knex.raw("to_char(r.insert_timestamp, 'YYYY-MM-DD HH24:MI:SS') as start"),
				knex.raw(
					"to_char(LEAD(r.insert_timestamp) OVER (ORDER BY r.id ASC), 'YYYY-MM-DD HH24:MI:SS') as end"
				),
				"d.device_name",
				"d.location",
				"r.mac_address",
				"r.red_information",
				"r.amber_information",
				"r.green_information"
			)
			.orderBy("r.id", "asc")
			.limit(parsedLimit)
			.offset(offset);

		const totalResult = await knex("sensor_readings").count("* as count").first();
		const total = totalResult?.count || 0;

		res.json({
			data: rows,
			pagination: {
				page: parsedPage,
				limit: parsedLimit,
				total,
				pages: Math.ceil(total / parsedLimit),
			},
		});
	} catch (err) {
		console.error("GET /sensor-data/ error:", err.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

router.get("/interval", async (req, res) => {
	try {
		const { mac_address, from, to } = req.query;

		const rows = await knex("sensor_readings as r")
			.join("devices as d", "r.mac_address", "=", "d.mac_address")
			.modify((qb) => {
				if (mac_address) {
					qb.where("r.mac_address", mac_address);
				}
				if (from) {
					qb.whereRaw("DATE(r.insert_timestamp) >= ?", [from]);
				}
				if (to) {
					qb.whereRaw("DATE(r.insert_timestamp) <= ?", [to]);
				}
			})
			.select(
				"r.id",
				knex.raw("to_char(r.insert_timestamp, 'YYYY-MM-DD HH24:MI:SS') as start"),
				knex.raw(
					"to_char(LEAD(r.insert_timestamp) OVER (ORDER BY r.id ASC), 'YYYY-MM-DD HH24:MI:SS') as end"
				),
				"d.device_name",
				"d.location",
				"r.mac_address",
				"r.red_information",
				"r.amber_information",
				"r.green_information"
			)
			.orderBy("r.id", "asc");

		res.json({ data: rows });
	} catch (err) {
		console.error("GET /api/sensor-data/interval error:", err.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

module.exports = router;
