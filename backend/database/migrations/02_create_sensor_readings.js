/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
	return knex.schema.createTable("sensor_readings", function (table) {
		table.increments("id").primary();
		table
			.timestamp("insert_timestamp", { useTz: false })
			.defaultTo(knex.fn.now());
		table
			.string("mac_address")
			.references("mac_address")
			.inTable("devices")
			.onDelete("CASCADE");
		table
			.integer("red_information")
			.notNullable()
			.defaultTo(0)
			.checkIn([0, 1]);
		table
			.integer("amber_information")
			.notNullable()
			.defaultTo(0)
			.checkIn([0, 1]);
		table
			.integer("green_information")
			.notNullable()
			.defaultTo(0)
			.checkIn([0, 1]);
	});
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
	return knex.schema.dropTableIfExists("sensor_readings");
};
