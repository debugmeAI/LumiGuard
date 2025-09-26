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

		const totalResult = await knex("sensor_readings")
			.count("* as count")
			.first();
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
				knex.raw(
					"to_char(r.insert_timestamp, 'YYYY-MM-DD HH24:MI:SS') as start"
				),
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

		const totalResult = await knex("sensor_readings")
			.count("* as count")
			.first();
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

		let fromDate;
		let toDate;

		if (from) {
			const date = new Date(from);
			fromDate = new Date(date.setHours(0, 0, 0, 0)).toISOString();
			toDate = new Date(date.setHours(23, 59, 59, 999)).toISOString();
		} else if (to) {
			const date = new Date(to);
			fromDate = new Date(date.setHours(0, 0, 0, 0)).toISOString();
			toDate = new Date(date.setHours(23, 59, 59, 999)).toISOString();
		}

		const subquery = knex("sensor_readings as r")
			.join("devices as d", "r.mac_address", "=", "d.mac_address")
			.where("d.status", "Active")
			.modify((qb) => {
				if (mac_address) qb.where("r.mac_address", mac_address);
				if (fromDate && toDate)
					qb.whereBetween("r.insert_timestamp", [fromDate, toDate]);
			})
			.select(
				"r.id",
				"r.mac_address",
				"d.device_name",
				"r.insert_timestamp",
				knex.raw(
					"LEAD(r.insert_timestamp) OVER (PARTITION BY r.mac_address ORDER BY r.id) as end_time"
				),
				knex.raw(`CASE
          WHEN r.red_information = 1 THEN 'Error'
          WHEN r.amber_information = 1 THEN 'Idle'
          WHEN r.green_information = 1 THEN 'Run'
          ELSE 'Unknown'
        END as status`)
			)
			.as("t");

		const rows = await knex
			.select(
				"t.device_name",
				"t.mac_address",
				knex.raw(
					"to_char(t.insert_timestamp, 'YYYY-MM-DD HH24:MI:SS') as start"
				),
				knex.raw("to_char(t.end_time, 'YYYY-MM-DD HH24:MI:SS') as end"),
				"t.status"
			)
			.from(subquery)
			.whereNotNull("t.end_time") // <- row terakhir hilang
			.orderBy("t.mac_address")
			.orderBy("t.id");

		// Mapping series untuk chart
		const seriesMap = {};
		for (const row of rows) {
			const startTime = new Date(row.start).getTime();
			const endTime = new Date(row.end).getTime();

			if (!startTime || !endTime) continue;

			if (!seriesMap[row.status])
				seriesMap[row.status] = { name: row.status, data: [] };

			seriesMap[row.status].data.push({
				x: row.device_name || row.mac_address,
				y: [startTime, endTime],
			});
		}

		const order = ["Run", "Idle", "Error", "Unknown"];
		const seriesOrdered = order
			.map((status) => seriesMap[status])
			.filter(Boolean);

		res.json({ series: seriesOrdered });
	} catch (err) {
		console.error("GET /api/sensor-data/interval error:", err.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

module.exports = router;
