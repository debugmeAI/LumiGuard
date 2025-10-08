exports.up = function (knex) {
	return knex.schema.createTable("users", function (table) {
		table
			.uuid("user_id")
			.primary()
			.defaultTo(knex.raw("gen_random_uuid()"));
		table.string("username", 50).notNullable().unique();
		table.string("email", 100).notNullable().unique();
		table.string("password", 255).notNullable();
		table
			.enu("role", ["Admin", "User", "Viewer"])
			.notNullable()
			.defaultTo("User");
		table
			.enu("status", ["Active", "Inactive"])
			.notNullable()
			.defaultTo("Active");
		table.timestamp("created_at").defaultTo(knex.fn.now());
		table.timestamp("last_login").nullable();

		table.index(["username", "email", "status", "role"]);
	});
};

exports.down = function (knex) {
	return knex.schema.dropTableIfExists("users");
};
