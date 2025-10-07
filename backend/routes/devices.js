require("module-alias/register");

const express = require("express");
const router = express.Router();
const knex = require("@db/knex");

const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

router.get("/", async (req, res) => {
	try {
		const { page = 1, limit = 15 } = req.query;
		const parsedLimit = parseInt(limit);
		const parsedPage = parseInt(page);
		const offset = (parsedPage - 1) * parsedLimit;

		const rows = await knex("devices")
			.select("*")
			.orderBy("device_name", "asc")
			.limit(parsedLimit)
			.offset(offset);

		const totalResult = await knex("devices").count("* as count").first();
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
		console.error("GET /devices/paginated error:", err.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

router.get("/list", async (req, res) => {
	try {
		const rows = await knex("devices")
			.select("*")
			.orderBy("device_name", "asc");
		res.json(rows);
	} catch (err) {
		console.error("GET /devices/list error:", err.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

router.get("/list-active", async (req, res) => {
	try {
		const rows = await knex("devices")
			.select("*")
			.where("status", "Active");
		res.json(rows);
	} catch (err) {
		console.error("GET /devices/list-active error:", err.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

router.delete("/:mac", async (req, res) => {
	const { mac } = req.params;
	try {
		const deleted = await knex("devices")
			.delete()
			.where({ mac_address: mac })
			.del();
		if (deleted) {
			res.status(200).json({ message: "Device deleted successfully." });
		} else {
			res.status(404).json({ message: "Device not found." });
		}
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

router.post("/", async (req, res) => {
	try {
		const { mac_address, device_name, location, status } = req.body;

		if (!mac_address || !device_name) {
			return res.status(400).json({
				error: "MAC address and device name are required",
			});
		}

		const existingMacDevice = await knex("devices")
			.where("mac_address", mac_address)
			.first();

		if (existingMacDevice) {
			return res.status(400).json({
				error: "Device with this MAC address already exists",
			});
		}

		const existingNameDevice = await knex("devices")
			.where("device_name", device_name)
			.first();

		if (existingNameDevice) {
			return res.status(400).json({
				error: "Device with this name already exists",
			});
		}

		await knex("devices").insert({
			mac_address,
			device_name,
			location: location || "",
			status: status || "Active",
			created_at: knex.fn.now(),
			updated_at: knex.fn.now(),
		});

		res.status(201).json({
			message: "Device added successfully",
			mac_address,
			device_name,
		});
	} catch (err) {
		console.error("POST /devices error:", err.message);

		if (err.code === "ER_DUP_ENTRY" || err.message.includes("UNIQUE")) {
			if (err.message.includes("mac_address")) {
				res.status(400).json({
					error: "Device with this MAC address already exists",
				});
			} else if (err.message.includes("device_name")) {
				res.status(400).json({
					error: "Device with this name already exists",
				});
			} else {
				res.status(400).json({
					error: "Duplicate entry found",
				});
			}
		} else {
			res.status(500).json({ error: "Internal Server Error" });
		}
	}
});

router.put("/:mac", async (req, res) => {
	const trx = await knex.transaction();

	try {
		const { mac } = req.params;
		const { name, location, status, thresholds } = req.body;

		const existingDevice = await trx("devices")
			.where("mac_address", mac)
			.first();

		if (!existingDevice) {
			return res.status(404).json({
				error: "Device not found",
			});
		}

		if (name && name !== existingDevice.device_name) {
			const duplicateName = await trx("devices")
				.where("device_name", name)
				.whereNot("mac_address", mac)
				.first();

			if (duplicateName) {
				return res.status(400).json({
					error: "Device with this name already exists",
				});
			}
		}

		await trx("devices").where("mac_address", mac).update({
			device_name: name,
			location: location,
			status: status,
			updated_at: knex.fn.now(),
		});

		await trx.commit();

		res.json({
			message: "Device updated successfully",
			mac_address: mac,
			device_name: name,
		});
	} catch (err) {
		await trx.rollback();
		console.error("PUT /devices/:mac error:", err.message);

		if (
			err.code === "ER_DUP_ENTRY" &&
			err.message.includes("device_name")
		) {
			res.status(400).json({
				error: "Device with this name already exists",
			});
		} else {
			res.status(500).json({ error: "Internal Server Error" });
		}
	}
});

module.exports = router;
