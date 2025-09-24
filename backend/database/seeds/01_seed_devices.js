/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
	await knex("devices").del();

	const now = new Date();
	await knex("devices").insert([
		{
			device_name: "LG-001",
			mac_address: "40:F5:20:47:24:BC",
			location: "Auto Label Machine 01",
			status: "Active",
			created_at: now,
			updated_at: now,
		},
		{
			device_name: "LG-002",
			mac_address: "B8:27:EB:12:34:56",
			location: "Auto Label Machine 02",
			status: "Inactive",
			created_at: now,
			updated_at: now,
		},
	]);
};
