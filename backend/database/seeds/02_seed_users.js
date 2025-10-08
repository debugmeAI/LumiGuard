const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
	await knex("users").del();

	const adminPassword = await bcrypt.hash("admin123", 10);
	const userPassword = await bcrypt.hash("user123", 10);

	await knex("users").insert([
		{
			user_id: uuidv4(),
			username: "Mulyono",
			email: "mulyono@example.com",
			password: adminPassword,
			role: "Admin",
			status: "Active",
			created_at: knex.fn.now(),
			last_login: knex.fn.now(),
		},
		{
			user_id: uuidv4(),
			username: "Bahlil",
			email: "bahlil@example.com",
			password: userPassword,
			role: "User",
			status: "Active",
			created_at: knex.fn.now(),
			last_login: knex.fn.now(),
		},
	]);
};
