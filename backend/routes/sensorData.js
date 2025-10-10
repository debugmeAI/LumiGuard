require("module-alias/register");

const express = require("express");
const router = express.Router();
const knex = require("@db/knex");
router.get("/summary", async (req, res) => {
	try {
		const { date, shift } = req.query;

		if (!date) {
			return res
				.status(400)
				.json({ error: "Parameter 'date' wajib diisi" });
		}

		const getLogicalDate = (timestamp) => {
			const d = new Date(timestamp);
			if (d.getHours() < 7) {
				d.setDate(d.getDate() - 1);
			}
			const pad = (n) => n.toString().padStart(2, "0");
			return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
				d.getDate()
			)}`;
		};

		const calculateTimeRange = (date, shiftType) => {
			const startTime = new Date(date);
			const endTime = new Date(date);

			switch (shiftType?.toLowerCase()) {
				case "morning":
					startTime.setHours(7, 0, 0, 0);
					endTime.setHours(19, 0, 0, 0);
					break;
				case "night":
					startTime.setHours(19, 0, 0, 0);
					endTime.setDate(endTime.getDate() + 1);
					endTime.setHours(7, 0, 0, 0);
					break;
				default:
					startTime.setHours(7, 0, 0, 0);
					endTime.setDate(endTime.getDate() + 1);
					endTime.setHours(7, 0, 0, 0);
			}
			return { startTime, endTime };
		};

		const getStatus = (reading) => {
			if (reading.red_information === 1) return "red";
			if (
				reading.amber_information === 1 &&
				reading.red_information === 0
			)
				return "amber";
			if (
				reading.green_information === 1 &&
				reading.red_information === 0 &&
				reading.amber_information === 0
			)
				return "green";
			return "unknown";
		};

		const getShiftInfo = (timestamp) => {
			const hour = new Date(timestamp).getHours();
			const shift = hour >= 7 && hour < 19 ? "Morning" : "Night";
			return { shift };
		};

		const getEmptySummary = () => ({
			red_seconds: "0",
			amber_seconds: "0",
			green_seconds: "0",
			unknown_seconds: "0",
			total_seconds: "0",
			red_percent: "0.00",
			amber_percent: "0.00",
			green_percent: "0.00",
			unknown_percent: "0.00",
			planned_production_seconds: "0",
			planned_morning_seconds: "0",
			planned_night_seconds: "0",
			availability_oee: "0.00",
			shift_type: "No Data",
		});

		const detectOvertimeFromTimestamps = (timestamps, shiftType) => {
			if (!timestamps || timestamps.length === 0) return false;

			if (shiftType === "Morning") {
				return timestamps.some((ts) => {
					const hour = new Date(ts).getHours();
					return hour >= 16;
				});
			} else if (shiftType === "Night") {
				return timestamps.some((ts) => {
					const hour = new Date(ts).getHours();
					return hour >= 4 && hour < 7;
				});
			}
			return false;
		};

		const calculatePlannedTime = (
			shiftType,
			dateString,
			timestamps = []
		) => {
			const date = new Date(dateString);
			const isFriday = date.getDay() === 5;

			const hasOvertime = detectOvertimeFromTimestamps(
				timestamps,
				shiftType
			);

			if (shiftType === "Morning") {
				let hours;
				if (isFriday) {
					hours = hasOvertime ? 10 : 8;
				} else {
					hours = hasOvertime ? 10.5 : 8;
				}
				const typeLabel = isFriday
					? hasOvertime
						? "Jumat Pagi Overtime (10h)"
						: "Jumat Pagi Normal (8h)"
					: `${hasOvertime ? "Overtime" : "Normal"} (${hours}h)`;
				return { seconds: hours * 3600, type: typeLabel };
			}

			if (shiftType === "Night") {
				const hours = hasOvertime ? 10.5 : 8;
				const typeLabel = isFriday
					? hasOvertime
						? "Jumat Malam Overtime (10.5h)"
						: "Jumat Malam Normal (8h)"
					: `${hasOvertime ? "Overtime" : "Normal"} (${hours}h)`;
				return { seconds: hours * 3600, type: typeLabel };
			}

			const morningTs = timestamps.filter((ts) => {
				const h = new Date(ts).getHours();
				return h >= 7 && h < 19;
			});
			const nightTs = timestamps.filter((ts) => {
				const h = new Date(ts).getHours();
				return h >= 19 || h < 7;
			});

			const morningHasOvertime = detectOvertimeFromTimestamps(
				morningTs,
				"Morning"
			);
			const nightHasOvertime = detectOvertimeFromTimestamps(
				nightTs,
				"Night"
			);

			let morningHours, nightHours;

			if (isFriday) {
				morningHours = morningHasOvertime ? 10 : 8;
				nightHours = nightHasOvertime ? 10.5 : 8;
			} else {
				morningHours = morningHasOvertime ? 10.5 : 8;
				nightHours = nightHasOvertime ? 10.5 : 8;
			}

			return {
				seconds: (morningHours + nightHours) * 3600,
				type: `Full Day (${morningHours}h + ${nightHours}h)`,
			};
		};

		const shouldIncludeData = (shiftInfo, requestedShift) => {
			if (!requestedShift) return true;
			const reqShift = requestedShift.toLowerCase();
			const dataShift = shiftInfo.shift.toLowerCase();
			return reqShift === dataShift;
		};

		const { startTime, endTime } = calculateTimeRange(date, shift);

		const rawData = await knex("sensor_readings as r")
			.join("devices as d", "r.mac_address", "d.mac_address")
			.select(
				"r.mac_address",
				"d.device_name",
				"r.red_information",
				"r.amber_information",
				"r.green_information",
				"r.insert_timestamp"
			)
			.where("r.insert_timestamp", ">=", startTime)
			.andWhere("r.insert_timestamp", "<=", endTime)
			.orderBy("r.mac_address")
			.orderBy("r.insert_timestamp");

		if (rawData.length === 0) {
			return res.json({
				total: getEmptySummary(),
				per_device: [],
				per_shift: [],
				gantt: [],
			});
		}

		const processData = (data) => {
			const results = {
				devices: {},
				shifts: {},
				shiftTimestamps: {},
				total: {
					red_seconds: 0,
					amber_seconds: 0,
					green_seconds: 0,
					unknown_seconds: 0,
					total_seconds: 0,
				},
			};

			const uniqueDevices = new Set(data.map((d) => d.mac_address));
			const totalDevices = uniqueDevices.size;

			const deviceGroups = {};
			data.forEach((item) => {
				if (!deviceGroups[item.mac_address])
					deviceGroups[item.mac_address] = [];
				deviceGroups[item.mac_address].push(item);
			});

			Object.entries(deviceGroups).forEach(([mac, readings]) => {
				readings.sort(
					(a, b) =>
						new Date(a.insert_timestamp) -
						new Date(b.insert_timestamp)
				);

				for (let i = 0; i < readings.length - 1; i++) {
					const current = readings[i];
					const next = readings[i + 1];

					if (
						getLogicalDate(current.insert_timestamp) !==
						getLogicalDate(next.insert_timestamp)
					) {
						continue;
					}

					const duration =
						(new Date(next.insert_timestamp) -
							new Date(current.insert_timestamp)) /
						1000;
					if (duration <= 0) continue;

					const status = getStatus(current);
					const shiftInfo = getShiftInfo(current.insert_timestamp);

					if (!shouldIncludeData(shiftInfo, shift)) continue;

					const shiftKey = `${getLogicalDate(
						current.insert_timestamp
					)}_${shiftInfo.shift}`;

					if (!results.devices[mac]) {
						results.devices[mac] = {
							mac_address: mac,
							device_name: readings[0].device_name,
							shifts: {},
						};
					}
					if (!results.devices[mac].shifts[shiftKey]) {
						results.devices[mac].shifts[shiftKey] = {
							shift_date: getLogicalDate(
								current.insert_timestamp
							),
							calculated_shift: shiftInfo.shift,
							red_seconds: 0,
							amber_seconds: 0,
							green_seconds: 0,
							unknown_seconds: 0,
							total_seconds: 0,
							timestamps: [],
						};
					}
					if (!results.shifts[shiftKey]) {
						results.shifts[shiftKey] = {
							shift_date: getLogicalDate(
								current.insert_timestamp
							),
							calculated_shift: shiftInfo.shift,
							red_seconds: 0,
							amber_seconds: 0,
							green_seconds: 0,
							unknown_seconds: 0,
							total_seconds: 0,
						};
					}
					if (!results.shiftTimestamps[shiftKey]) {
						results.shiftTimestamps[shiftKey] = [];
					}

					results.devices[mac].shifts[shiftKey].timestamps.push(
						current.insert_timestamp
					);
					results.shiftTimestamps[shiftKey].push(
						current.insert_timestamp
					);

					const deviceContribution = duration;
					const globalContribution = duration / totalDevices;

					if (status === "unknown") {
						results.devices[mac].shifts[shiftKey].unknown_seconds +=
							deviceContribution;
						results.shifts[shiftKey].unknown_seconds +=
							globalContribution;
						results.total.unknown_seconds += globalContribution;
					} else {
						results.devices[mac].shifts[shiftKey][
							`${status}_seconds`
						] += deviceContribution;
						results.devices[mac].shifts[shiftKey].total_seconds +=
							deviceContribution;

						results.shifts[shiftKey][`${status}_seconds`] +=
							globalContribution;
						results.shifts[shiftKey].total_seconds +=
							globalContribution;

						results.total[`${status}_seconds`] +=
							globalContribution;
						results.total.total_seconds += globalContribution;
					}
				}
			});

			return results;
		};

		const processed = processData(rawData);

		const calculatePercentages = (item, plannedSeconds = 0) => {
			const active =
				(parseFloat(item.red_seconds) || 0) +
				(parseFloat(item.amber_seconds) || 0) +
				(parseFloat(item.green_seconds) || 0);
			if (active === 0)
				return {
					...item,
					red_percent: "0.00",
					amber_percent: "0.00",
					green_percent: "0.00",
					unknown_percent: "0.00",
				};
			return {
				...item,
				red_percent: ((item.red_seconds / active) * 100).toFixed(2),
				amber_percent: ((item.amber_seconds / active) * 100).toFixed(2),
				green_percent: ((item.green_seconds / active) * 100).toFixed(2),
				unknown_percent:
					plannedSeconds > 0
						? (
								(item.unknown_seconds / plannedSeconds) *
								100
						  ).toFixed(2)
						: "0.00",
			};
		};

		let plannedMorning = 0,
			plannedNight = 0,
			morningType = "No Data",
			nightType = "No Data";

		Object.values(processed.shifts).forEach((shiftData) => {
			const key = `${shiftData.shift_date}_${shiftData.calculated_shift}`;
			const ts = processed.shiftTimestamps[key] || [];
			const planned = calculatePlannedTime(
				shiftData.calculated_shift,
				shiftData.shift_date,
				ts
			);
			if (shiftData.calculated_shift === "Morning") {
				plannedMorning = planned.seconds;
				morningType = planned.type;
			} else {
				plannedNight = planned.seconds;
				nightType = planned.type;
			}
		});

		if (
			plannedMorning === 0 &&
			(!shift || shift.toLowerCase() === "morning")
		) {
			const p = calculatePlannedTime(
				"Morning",
				getLogicalDate(startTime)
			);
			plannedMorning = p.seconds;
			morningType = p.type;
		}
		if (plannedNight === 0 && (!shift || shift.toLowerCase() === "night")) {
			const p = calculatePlannedTime("Night", getLogicalDate(startTime));
			plannedNight = p.seconds;
			nightType = p.type;
		}

		const totalPlanned = shift
			? shift.toLowerCase() === "morning"
				? plannedMorning
				: plannedNight
			: plannedMorning + plannedNight;

		const totalWithPerc = calculatePercentages(
			processed.total,
			totalPlanned
		);
		const greenSec = parseFloat(processed.total.green_seconds) || 0;
		const oee =
			totalPlanned > 0
				? ((greenSec / totalPlanned) * 100).toFixed(2)
				: "0.00";

		const totalRow = {
			...totalWithPerc,
			planned_production_seconds: totalPlanned.toString(),
			planned_morning_seconds: plannedMorning.toString(),
			planned_night_seconds: plannedNight.toString(),
			availability_oee: oee,
			shift_type: shift
				? shift.toLowerCase() === "morning"
					? morningType
					: nightType
				: `Morning: ${morningType}, Night: ${nightType}`,
		};

		const perDevice = [];
		Object.values(processed.devices).forEach((device) => {
			Object.values(device.shifts).forEach((shiftData) => {
				const key = `${shiftData.shift_date}_${shiftData.calculated_shift}`;
				const ts = device.shifts[key]?.timestamps || [];
				const planned = calculatePlannedTime(
					shiftData.calculated_shift,
					shiftData.shift_date,
					ts
				);
				const green = parseFloat(shiftData.green_seconds) || 0;
				const oeeShift =
					planned.seconds > 0
						? ((green / planned.seconds) * 100).toFixed(2)
						: "0.00";
				const withPercentages = calculatePercentages(
					shiftData,
					planned.seconds
				);
				perDevice.push({
					...withPercentages,
					mac_address: device.mac_address,
					device_name: device.device_name,
					planned_production_seconds: planned.seconds.toString(),
					availability_oee: oeeShift,
					shift_type: planned.type,
				});
			});
		});

		const perShift = Object.values(processed.shifts).map((shiftData) => {
			const key = `${shiftData.shift_date}_${shiftData.calculated_shift}`;
			const ts = processed.shiftTimestamps[key] || [];
			const planned = calculatePlannedTime(
				shiftData.calculated_shift,
				shiftData.shift_date,
				ts
			);
			const green = parseFloat(shiftData.green_seconds) || 0;
			const oeeShift =
				planned.seconds > 0
					? ((green / planned.seconds) * 100).toFixed(2)
					: "0.00";
			return {
				...calculatePercentages(shiftData, planned.seconds),
				planned_production_seconds: planned.seconds.toString(),
				availability_oee: oeeShift,
				shift_type: planned.type,
			};
		});

		const ganttSeries = {
			Run: { name: "Run", data: [] },
			Idle: { name: "Idle", data: [] },
			Error: { name: "Error", data: [] },
			Unknown: { name: "Unknown", data: [] },
		};

		const deviceGroups = {};
		rawData.forEach((item) => {
			if (!deviceGroups[item.mac_address]) {
				deviceGroups[item.mac_address] = [];
			}
			deviceGroups[item.mac_address].push(item);
		});

		Object.values(deviceGroups).forEach((deviceReadings) => {
			deviceReadings.sort(
				(a, b) =>
					new Date(a.insert_timestamp) - new Date(b.insert_timestamp)
			);

			for (let i = 0; i < deviceReadings.length - 1; i++) {
				const current = deviceReadings[i];
				const next = deviceReadings[i + 1];

				if (
					getLogicalDate(current.insert_timestamp) !==
					getLogicalDate(next.insert_timestamp)
				) {
					continue;
				}

				const start = new Date(current.insert_timestamp);
				const end = new Date(next.insert_timestamp);
				const durationMs = end - start;

				if (durationMs <= 0) continue;

				const status = getStatus(current)
					.replace("red", "Error")
					.replace("amber", "Idle")
					.replace("green", "Run")
					.replace("unknown", "Unknown");

				ganttSeries[status].data.push({
					x: current.device_name || current.mac_address,
					y: [start.getTime(), end.getTime()],
				});
			}
		});

		const ganttOrder = ["Run", "Idle", "Error", "Unknown"];
		const finalGanttSeries = ganttOrder
			.map((status) => ganttSeries[status])
			.filter((series) => series.data.length > 0);

		res.json({
			total: totalRow,
			per_device: perDevice,
			per_shift: perShift,
			gantt: finalGanttSeries,
		});
	} catch (err) {
		console.error("GET /summary error:", err);
		res.status(500).json({
			error: "Internal Server Error",
			message: err.message,
		});
	}
});

router.get("/summary-range", async (req, res) => {
	try {
		const { range } = req.query;

		const validRanges = ["3days", "7days", "1month"];
		if (!range || !validRanges.includes(range)) {
			return res.status(400).json({
				error: "Parameter 'range' wajib diisi dan harus salah satu dari: 3days, 7days, 1month",
			});
		}

		const getLogicalDate = (timestamp) => {
			const d = new Date(timestamp);
			if (d.getHours() < 7) {
				d.setDate(d.getDate() - 1);
			}
			const pad = (n) => n.toString().padStart(2, "0");
			return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
				d.getDate()
			)}`;
		};

		const calculateTimeRange = (date, shiftType) => {
			const startTime = new Date(date);
			const endTime = new Date(date);

			switch (shiftType?.toLowerCase()) {
				case "morning":
					startTime.setHours(7, 0, 0, 0);
					endTime.setHours(19, 0, 0, 0);
					break;
				case "night":
					startTime.setHours(19, 0, 0, 0);
					endTime.setDate(endTime.getDate() + 1);
					endTime.setHours(7, 0, 0, 0);
					break;
				default:
					startTime.setHours(7, 0, 0, 0);
					endTime.setDate(endTime.getDate() + 1);
					endTime.setHours(7, 0, 0, 0);
			}
			return { startTime, endTime };
		};

		const getStatus = (reading) => {
			if (reading.red_information === 1) return "red";
			if (
				reading.amber_information === 1 &&
				reading.red_information === 0
			)
				return "amber";
			if (
				reading.green_information === 1 &&
				reading.red_information === 0 &&
				reading.amber_information === 0
			)
				return "green";
			return "unknown";
		};

		const getShiftInfo = (timestamp) => {
			const hour = new Date(timestamp).getHours();
			const shift = hour >= 7 && hour < 19 ? "Morning" : "Night";
			return { shift };
		};

		const getEmptySummary = () => ({
			red_seconds: "0",
			amber_seconds: "0",
			green_seconds: "0",
			unknown_seconds: "0",
			total_seconds: "0",
			red_percent: "0.00",
			amber_percent: "0.00",
			green_percent: "0.00",
			unknown_percent: "0.00",
			planned_production_seconds: "0",
			planned_morning_seconds: "0",
			planned_night_seconds: "0",
			availability_oee: "0.00",
			shift_type: "No Data",
		});

		const detectOvertimeFromTimestamps = (timestamps, shiftType) => {
			if (!timestamps || timestamps.length === 0) return false;

			if (shiftType === "Morning") {
				return timestamps.some((ts) => {
					const hour = new Date(ts).getHours();
					return hour >= 16;
				});
			} else if (shiftType === "Night") {
				return timestamps.some((ts) => {
					const hour = new Date(ts).getHours();
					return hour >= 4 && hour < 7;
				});
			}
			return false;
		};

		const calculatePlannedTime = (
			shiftType,
			dateString,
			timestamps = []
		) => {
			const date = new Date(dateString);
			const isFriday = date.getDay() === 5;

			const hasOvertime = detectOvertimeFromTimestamps(
				timestamps,
				shiftType
			);

			if (shiftType === "Morning") {
				let hours;
				if (isFriday) {
					hours = hasOvertime ? 10 : 8;
				} else {
					hours = hasOvertime ? 10.5 : 8;
				}
				const typeLabel = isFriday
					? hasOvertime
						? "Jumat Pagi Overtime (10h)"
						: "Jumat Pagi Normal (8h)"
					: `${hasOvertime ? "Overtime" : "Normal"} (${hours}h)`;
				return { seconds: hours * 3600, type: typeLabel };
			}

			if (shiftType === "Night") {
				const hours = hasOvertime ? 10.5 : 8;
				const typeLabel = isFriday
					? hasOvertime
						? "Jumat Malam Overtime (10.5h)"
						: "Jumat Malam Normal (8h)"
					: `${hasOvertime ? "Overtime" : "Normal"} (${hours}h)`;
				return { seconds: hours * 3600, type: typeLabel };
			}

			const morningTs = timestamps.filter((ts) => {
				const h = new Date(ts).getHours();
				return h >= 7 && h < 19;
			});
			const nightTs = timestamps.filter((ts) => {
				const h = new Date(ts).getHours();
				return h >= 19 || h < 7;
			});

			const morningHasOvertime = detectOvertimeFromTimestamps(
				morningTs,
				"Morning"
			);
			const nightHasOvertime = detectOvertimeFromTimestamps(
				nightTs,
				"Night"
			);

			let morningHours, nightHours;

			if (isFriday) {
				morningHours = morningHasOvertime ? 10 : 8;
				nightHours = nightHasOvertime ? 10.5 : 8;
			} else {
				morningHours = morningHasOvertime ? 10.5 : 8;
				nightHours = nightHasOvertime ? 10.5 : 8;
			}

			return {
				seconds: (morningHours + nightHours) * 3600,
				type: `Full Day (${morningHours}h + ${nightHours}h)`,
			};
		};

		const now = new Date();
		now.setHours(23, 59, 59, 999);

		let startDate, endDate;

		switch (range) {
			case "3days":
				startDate = new Date(now);
				startDate.setDate(now.getDate() - 2);
				endDate = now;
				break;
			case "7days":
				startDate = new Date(now);
				startDate.setDate(now.getDate() - 6);
				endDate = now;
				break;
			case "1month":
				startDate = new Date(now.getFullYear(), now.getMonth(), 1);
				endDate = now;
				break;
			default:
				return res.status(400).json({ error: "Range tidak valid" });
		}

		const formatDate = (d) =>
			`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
				2,
				"0"
			)}-${String(d.getDate()).padStart(2, "0")}`;

		const dates = [];
		for (
			let d = new Date(startDate);
			d <= endDate;
			d.setDate(d.getDate() + 1)
		) {
			dates.push(new Date(d));
		}

		const processDate = async (date) => {
			const dateStr = formatDate(date);
			const { startTime, endTime } = calculateTimeRange(dateStr);

			const rawData = await knex("sensor_readings as r")
				.join("devices as d", "r.mac_address", "d.mac_address")
				.select(
					"r.mac_address",
					"d.device_name",
					"r.red_information",
					"r.amber_information",
					"r.green_information",
					"r.insert_timestamp"
				)
				.where("r.insert_timestamp", ">=", startTime)
				.andWhere("r.insert_timestamp", "<=", endTime)
				.orderBy("r.mac_address")
				.orderBy("r.insert_timestamp");

			if (rawData.length === 0) {
				return { date: dateStr, ...getEmptySummary() };
			}

			const allTimestamps = rawData.map((r) => r.insert_timestamp);
			const results = {
				total: {
					red_seconds: 0,
					amber_seconds: 0,
					green_seconds: 0,
					unknown_seconds: 0,
				},
			};

			const uniqueDevices = new Set(rawData.map((d) => d.mac_address));
			const totalDevices = uniqueDevices.size;

			const deviceGroups = {};
			rawData.forEach((item) => {
				if (!deviceGroups[item.mac_address])
					deviceGroups[item.mac_address] = [];
				deviceGroups[item.mac_address].push(item);
			});

			Object.values(deviceGroups).forEach((readings) => {
				readings.sort(
					(a, b) =>
						new Date(a.insert_timestamp) -
						new Date(b.insert_timestamp)
				);
				for (let i = 0; i < readings.length - 1; i++) {
					const current = readings[i];
					const next = readings[i + 1];

					if (
						getLogicalDate(current.insert_timestamp) !==
						getLogicalDate(next.insert_timestamp)
					) {
						continue;
					}

					const duration =
						(new Date(next.insert_timestamp) -
							new Date(current.insert_timestamp)) /
						1000;
					if (duration <= 0) continue;

					const status = getStatus(current);
					const { shift } = getShiftInfo(current.insert_timestamp);

					const globalContribution = duration / totalDevices;
					if (status === "unknown") {
						results.total.unknown_seconds += globalContribution;
					} else {
						results.total[`${status}_seconds`] +=
							globalContribution;
					}
				}
			});

			const totalActiveSeconds =
				results.total.red_seconds +
				results.total.amber_seconds +
				results.total.green_seconds;

			const morningTs = allTimestamps.filter((ts) => {
				const h = new Date(ts).getHours();
				return h >= 7 && h < 19;
			});
			const nightTs = allTimestamps.filter((ts) => {
				const h = new Date(ts).getHours();
				return h >= 19 || h < 7;
			});

			const plannedMorning = calculatePlannedTime(
				"Morning",
				dateStr,
				morningTs
			).seconds;
			const plannedNight = calculatePlannedTime(
				"Night",
				dateStr,
				nightTs
			).seconds;
			const totalPlanned = plannedMorning + plannedNight;

			const greenSec = parseFloat(results.total.green_seconds) || 0;
			const oee =
				totalPlanned > 0
					? ((greenSec / totalPlanned) * 100).toFixed(2)
					: "0.00";

			const active = totalActiveSeconds;
			const redPerc =
				active > 0
					? ((results.total.red_seconds / active) * 100).toFixed(2)
					: "0.00";
			const amberPerc =
				active > 0
					? ((results.total.amber_seconds / active) * 100).toFixed(2)
					: "0.00";
			const greenPerc =
				active > 0
					? ((results.total.green_seconds / active) * 100).toFixed(2)
					: "0.00";
			const unknownPerc =
				active > 0
					? ((results.total.unknown_seconds / active) * 100).toFixed(
							2
					  )
					: "0.00";

			let shiftTypeLabel = "No Data";
			if (plannedMorning > 0 && plannedNight > 0) {
				shiftTypeLabel = "Full Day";
			} else if (plannedMorning > 0) {
				shiftTypeLabel = "Morning";
			} else if (plannedNight > 0) {
				shiftTypeLabel = "Night";
			}

			return {
				date: dateStr,
				red_seconds: results.total.red_seconds.toString(),
				amber_seconds: results.total.amber_seconds.toString(),
				green_seconds: results.total.green_seconds.toString(),
				unknown_seconds: results.total.unknown_seconds.toString(),
				total_seconds: totalActiveSeconds.toString(),
				red_percent: redPerc,
				amber_percent: amberPerc,
				green_percent: greenPerc,
				unknown_percent: unknownPerc,
				planned_production_seconds: totalPlanned.toString(),
				planned_morning_seconds: plannedMorning.toString(),
				planned_night_seconds: plannedNight.toString(),
				availability_oee: oee,
				shift_type: shiftTypeLabel,
			};
		};

		const perDate = [];
		let totalAggregate = getEmptySummary();

		for (const date of dates) {
			const result = await processDate(date);
			perDate.push(result);

			totalAggregate.red_seconds = (
				parseFloat(totalAggregate.red_seconds) +
				parseFloat(result.red_seconds)
			).toString();
			totalAggregate.amber_seconds = (
				parseFloat(totalAggregate.amber_seconds) +
				parseFloat(result.amber_seconds)
			).toString();
			totalAggregate.green_seconds = (
				parseFloat(totalAggregate.green_seconds) +
				parseFloat(result.green_seconds)
			).toString();
			totalAggregate.unknown_seconds = (
				parseFloat(totalAggregate.unknown_seconds) +
				parseFloat(result.unknown_seconds)
			).toString();
			totalAggregate.total_seconds = (
				parseFloat(totalAggregate.total_seconds) +
				parseFloat(result.total_seconds)
			).toString();
			totalAggregate.planned_production_seconds = (
				parseFloat(totalAggregate.planned_production_seconds) +
				parseFloat(result.planned_production_seconds)
			).toString();
			totalAggregate.planned_morning_seconds = (
				parseFloat(totalAggregate.planned_morning_seconds) +
				parseFloat(result.planned_morning_seconds)
			).toString();
			totalAggregate.planned_night_seconds = (
				parseFloat(totalAggregate.planned_night_seconds) +
				parseFloat(result.planned_night_seconds)
			).toString();
		}

		const activeTotal = parseFloat(totalAggregate.total_seconds) || 0;
		const totalRedPerc =
			activeTotal > 0
				? (
						(parseFloat(totalAggregate.red_seconds) / activeTotal) *
						100
				  ).toFixed(2)
				: "0.00";
		const totalAmberPerc =
			activeTotal > 0
				? (
						(parseFloat(totalAggregate.amber_seconds) /
							activeTotal) *
						100
				  ).toFixed(2)
				: "0.00";
		const totalGreenPerc =
			activeTotal > 0
				? (
						(parseFloat(totalAggregate.green_seconds) /
							activeTotal) *
						100
				  ).toFixed(2)
				: "0.00";
		const totalUnknownPerc =
			activeTotal > 0
				? (
						(parseFloat(totalAggregate.unknown_seconds) /
							activeTotal) *
						100
				  ).toFixed(2)
				: "0.00";

		const totalGreenSec = parseFloat(totalAggregate.green_seconds) || 0;
		const totalPlannedSec =
			parseFloat(totalAggregate.planned_production_seconds) || 0;
		const totalOEE =
			totalPlannedSec > 0
				? ((totalGreenSec / totalPlannedSec) * 100).toFixed(2)
				: "0.00";

		const totalRow = {
			...totalAggregate,
			red_percent: totalRedPerc,
			amber_percent: totalAmberPerc,
			green_percent: totalGreenPerc,
			unknown_percent: totalUnknownPerc,
			availability_oee: totalOEE,
			shift_type: `Range: ${range}`,
		};

		res.json({
			total: totalRow,
			per_date: perDate,
			date_range: {
				start: formatDate(startDate),
				end: formatDate(endDate),
				range: range,
			},
		});
	} catch (err) {
		console.error("GET /summary-history error:", err);
		res.status(500).json({
			error: "Internal Server Error",
			message: err.message,
		});
	}
});

router.get("/summary-history", async (req, res) => {
	try {
		const { startDate, endDate, shift } = req.query;

		if (!startDate || !endDate) {
			return res.status(400).json({
				error: "Parameter 'startDate' dan 'endDate' wajib diisi",
			});
		}

		const getLogicalDate = (timestamp) => {
			const d = new Date(timestamp);
			if (d.getHours() < 7) {
				d.setDate(d.getDate() - 1);
			}
			const pad = (n) => n.toString().padStart(2, "0");
			return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
				d.getDate()
			)}`;
		};

		const calculateTimeRange = (date, shiftType) => {
			const startTime = new Date(date);
			const endTime = new Date(date);

			switch (shiftType?.toLowerCase()) {
				case "morning":
					startTime.setHours(7, 0, 0, 0);
					endTime.setHours(19, 0, 0, 0);
					break;
				case "night":
					startTime.setHours(19, 0, 0, 0);
					endTime.setDate(endTime.getDate() + 1);
					endTime.setHours(7, 0, 0, 0);
					break;
				default:
					startTime.setHours(7, 0, 0, 0);
					endTime.setDate(endTime.getDate() + 1);
					endTime.setHours(7, 0, 0, 0);
			}
			return { startTime, endTime };
		};

		const getStatus = (reading) => {
			if (reading.red_information === 1) return "red";
			if (
				reading.amber_information === 1 &&
				reading.red_information === 0
			)
				return "amber";
			if (
				reading.green_information === 1 &&
				reading.red_information === 0 &&
				reading.amber_information === 0
			)
				return "green";
			return "unknown";
		};

		const getShiftInfo = (timestamp) => {
			const hour = new Date(timestamp).getHours();
			const shift = hour >= 7 && hour < 19 ? "Morning" : "Night";
			return { shift };
		};

		const getEmptySummary = () => ({
			red_seconds: "0",
			amber_seconds: "0",
			green_seconds: "0",
			unknown_seconds: "0",
			total_seconds: "0",
			red_percent: "0.00",
			amber_percent: "0.00",
			green_percent: "0.00",
			unknown_percent: "0.00",
			planned_production_seconds: "0",
			planned_morning_seconds: "0",
			planned_night_seconds: "0",
			availability_oee: "0.00",
			shift_type: "No Data",
		});

		const detectOvertimeFromTimestamps = (timestamps, shiftType) => {
			if (!timestamps || timestamps.length === 0) return false;

			if (shiftType === "Morning") {
				return timestamps.some((ts) => {
					const hour = new Date(ts).getHours();
					return hour >= 16;
				});
			} else if (shiftType === "Night") {
				return timestamps.some((ts) => {
					const hour = new Date(ts).getHours();
					return hour >= 4 && hour < 7;
				});
			}
			return false;
		};

		const calculatePlannedTime = (
			shiftType,
			dateString,
			timestamps = []
		) => {
			const date = new Date(dateString);
			const isFriday = date.getDay() === 5;

			const hasOvertime = detectOvertimeFromTimestamps(
				timestamps,
				shiftType
			);

			if (shiftType === "Morning") {
				let hours;
				if (isFriday) {
					hours = hasOvertime ? 10 : 8;
				} else {
					hours = hasOvertime ? 10.5 : 8;
				}
				const typeLabel = isFriday
					? hasOvertime
						? "Jumat Pagi Overtime (10h)"
						: "Jumat Pagi Normal (8h)"
					: `${hasOvertime ? "Overtime" : "Normal"} (${hours}h)`;
				return { seconds: hours * 3600, type: typeLabel };
			}

			if (shiftType === "Night") {
				const hours = hasOvertime ? 10.5 : 8;
				const typeLabel = isFriday
					? hasOvertime
						? "Jumat Malam Overtime (10.5h)"
						: "Jumat Malam Normal (8h)"
					: `${hasOvertime ? "Overtime" : "Normal"} (${hours}h)`;
				return { seconds: hours * 3600, type: typeLabel };
			}
			const morningTs = timestamps.filter((ts) => {
				const h = new Date(ts).getHours();
				return h >= 7 && h < 19;
			});
			const nightTs = timestamps.filter((ts) => {
				const h = new Date(ts).getHours();
				return h >= 19 || h < 7;
			});

			const morningHasOvertime = detectOvertimeFromTimestamps(
				morningTs,
				"Morning"
			);
			const nightHasOvertime = detectOvertimeFromTimestamps(
				nightTs,
				"Night"
			);

			let morningHours, nightHours;

			if (isFriday) {
				morningHours = morningHasOvertime ? 10 : 8;
				nightHours = nightHasOvertime ? 10.5 : 8;
			} else {
				morningHours = morningHasOvertime ? 10.5 : 8;
				nightHours = nightHasOvertime ? 10.5 : 8;
			}

			return {
				seconds: (morningHours + nightHours) * 3600,
				type: `Full Day (${morningHours}h + ${nightHours}h)`,
			};
		};

		const start = new Date(startDate);
		const end = new Date(endDate);
		const dates = [];
		for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
			dates.push(new Date(d));
		}

		const processDate = async (date, shiftFilter) => {
			const dateStr = `${date.getFullYear()}-${String(
				date.getMonth() + 1
			).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
			const { startTime, endTime } = calculateTimeRange(
				dateStr,
				shiftFilter
			);

			const rawData = await knex("sensor_readings as r")
				.join("devices as d", "r.mac_address", "d.mac_address")
				.select(
					"r.mac_address",
					"d.device_name",
					"r.red_information",
					"r.amber_information",
					"r.green_information",
					"r.insert_timestamp"
				)
				.where("r.insert_timestamp", ">=", startTime)
				.andWhere("r.insert_timestamp", "<=", endTime)
				.orderBy("r.mac_address")
				.orderBy("r.insert_timestamp");

			if (rawData.length === 0) {
				return { date: dateStr, ...getEmptySummary() };
			}

			const allTimestamps = rawData.map((r) => r.insert_timestamp);

			const results = {
				total: {
					red_seconds: 0,
					amber_seconds: 0,
					green_seconds: 0,
					unknown_seconds: 0,
				},
			};
			const uniqueDevices = new Set(rawData.map((d) => d.mac_address));
			const totalDevices = uniqueDevices.size;

			const deviceGroups = {};
			rawData.forEach((item) => {
				if (!deviceGroups[item.mac_address])
					deviceGroups[item.mac_address] = [];
				deviceGroups[item.mac_address].push(item);
			});

			Object.values(deviceGroups).forEach((readings) => {
				readings.sort(
					(a, b) =>
						new Date(a.insert_timestamp) -
						new Date(b.insert_timestamp)
				);
				for (let i = 0; i < readings.length - 1; i++) {
					const current = readings[i];
					const next = readings[i + 1];

					if (
						getLogicalDate(current.insert_timestamp) !==
						getLogicalDate(next.insert_timestamp)
					) {
						continue;
					}

					const duration =
						(new Date(next.insert_timestamp) -
							new Date(current.insert_timestamp)) /
						1000;
					if (duration <= 0) continue;

					const status = getStatus(current);
					const { shift } = getShiftInfo(current.insert_timestamp);

					if (shiftFilter) {
						const req = shiftFilter.toLowerCase();
						if (
							(req === "morning" && shift !== "Morning") ||
							(req === "night" && shift !== "Night")
						) {
							continue;
						}
					}

					const globalContribution = duration / totalDevices;
					if (status === "unknown") {
						results.total.unknown_seconds += globalContribution;
					} else {
						results.total[`${status}_seconds`] +=
							globalContribution;
					}
				}
			});

			const totalActiveSeconds =
				results.total.red_seconds +
				results.total.amber_seconds +
				results.total.green_seconds;

			let plannedMorning = 0,
				plannedNight = 0,
				morningType = "No Data",
				nightType = "No Data";

			if (!shiftFilter || shiftFilter.toLowerCase() === "morning") {
				const morningTs = allTimestamps.filter((ts) => {
					const h = new Date(ts).getHours();
					return h >= 7 && h < 19;
				});
				const planned = calculatePlannedTime(
					"Morning",
					dateStr,
					morningTs
				);
				plannedMorning = planned.seconds;
				morningType = planned.type;
			}

			if (!shiftFilter || shiftFilter.toLowerCase() === "night") {
				const nightTs = allTimestamps.filter((ts) => {
					const h = new Date(ts).getHours();
					return h >= 19 || h < 7;
				});
				const planned = calculatePlannedTime("Night", dateStr, nightTs);
				plannedNight = planned.seconds;
				nightType = planned.type;
			}

			const totalPlanned = plannedMorning + plannedNight;
			const greenSec = parseFloat(results.total.green_seconds) || 0;
			const oee =
				totalPlanned > 0
					? ((greenSec / totalPlanned) * 100).toFixed(2)
					: "0.00";

			const active = totalActiveSeconds;
			const redPerc =
				active > 0
					? ((results.total.red_seconds / active) * 100).toFixed(2)
					: "0.00";
			const amberPerc =
				active > 0
					? ((results.total.amber_seconds / active) * 100).toFixed(2)
					: "0.00";
			const greenPerc =
				active > 0
					? ((results.total.green_seconds / active) * 100).toFixed(2)
					: "0.00";
			const unknownPerc =
				totalPlanned > 0
					? (
							(results.total.unknown_seconds / totalPlanned) *
							100
					  ).toFixed(2)
					: "0.00";

			let shiftTypeLabel = "No Data";
			if (plannedMorning > 0 && plannedNight > 0) {
				shiftTypeLabel = `Morning: ${morningType}, Night: ${nightType}`;
			} else if (plannedMorning > 0) {
				shiftTypeLabel = morningType;
			} else if (plannedNight > 0) {
				shiftTypeLabel = nightType;
			}

			return {
				date: dateStr,
				red_seconds: results.total.red_seconds.toString(),
				amber_seconds: results.total.amber_seconds.toString(),
				green_seconds: results.total.green_seconds.toString(),
				unknown_seconds: results.total.unknown_seconds.toString(),
				total_seconds: totalActiveSeconds.toString(),
				red_percent: redPerc,
				amber_percent: amberPerc,
				green_percent: greenPerc,
				unknown_percent: unknownPerc,
				planned_production_seconds: totalPlanned.toString(),
				planned_morning_seconds: plannedMorning.toString(),
				planned_night_seconds: plannedNight.toString(),
				availability_oee: oee,
				shift_type: shiftTypeLabel,
			};
		};

		const perDate = [];
		let totalAggregate = getEmptySummary();

		for (const date of dates) {
			const result = await processDate(date, shift);
			perDate.push(result);

			totalAggregate.red_seconds = (
				parseFloat(totalAggregate.red_seconds) +
				parseFloat(result.red_seconds)
			).toString();
			totalAggregate.amber_seconds = (
				parseFloat(totalAggregate.amber_seconds) +
				parseFloat(result.amber_seconds)
			).toString();
			totalAggregate.green_seconds = (
				parseFloat(totalAggregate.green_seconds) +
				parseFloat(result.green_seconds)
			).toString();
			totalAggregate.unknown_seconds = (
				parseFloat(totalAggregate.unknown_seconds) +
				parseFloat(result.unknown_seconds)
			).toString();
			totalAggregate.total_seconds = (
				parseFloat(totalAggregate.total_seconds) +
				parseFloat(result.total_seconds)
			).toString();
			totalAggregate.planned_production_seconds = (
				parseFloat(totalAggregate.planned_production_seconds) +
				parseFloat(result.planned_production_seconds)
			).toString();
			totalAggregate.planned_morning_seconds = (
				parseFloat(totalAggregate.planned_morning_seconds) +
				parseFloat(result.planned_morning_seconds)
			).toString();
			totalAggregate.planned_night_seconds = (
				parseFloat(totalAggregate.planned_night_seconds) +
				parseFloat(result.planned_night_seconds)
			).toString();
		}

		const activeTotal = parseFloat(totalAggregate.total_seconds) || 0;
		const totalPlannedSec =
			parseFloat(totalAggregate.planned_production_seconds) || 0;
		const totalRedPerc =
			activeTotal > 0
				? (
						(parseFloat(totalAggregate.red_seconds) / activeTotal) *
						100
				  ).toFixed(2)
				: "0.00";
		const totalAmberPerc =
			activeTotal > 0
				? (
						(parseFloat(totalAggregate.amber_seconds) /
							activeTotal) *
						100
				  ).toFixed(2)
				: "0.00";
		const totalGreenPerc =
			activeTotal > 0
				? (
						(parseFloat(totalAggregate.green_seconds) /
							activeTotal) *
						100
				  ).toFixed(2)
				: "0.00";
		const totalUnknownPerc =
			totalPlannedSec > 0
				? (
						(parseFloat(totalAggregate.unknown_seconds) /
							totalPlannedSec) *
						100
				  ).toFixed(2)
				: "0.00";

		const totalGreenSec = parseFloat(totalAggregate.green_seconds) || 0;
		const totalOEE =
			totalPlannedSec > 0
				? ((totalGreenSec / totalPlannedSec) * 100).toFixed(2)
				: "0.00";

		const totalRow = {
			...totalAggregate,
			red_percent: totalRedPerc,
			amber_percent: totalAmberPerc,
			green_percent: totalGreenPerc,
			unknown_percent: totalUnknownPerc,
			availability_oee: totalOEE,
			shift_type: `Range: ${startDate} to ${endDate}`,
		};

		res.json({
			total: totalRow,
			per_date: perDate,
			gantt: [],
			date_range: {
				start: startDate,
				end: endDate,
				shift: shift || "all",
			},
		});
	} catch (err) {
		console.error("GET /summary-history error:", err);
		res.status(500).json({
			error: "Internal Server Error",
			message: err.message,
		});
	}
});

module.exports = router;
