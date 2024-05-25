const withDefaults = require("../shared.webpack.config");

module.exports = withDefaults({
	context: __dirname,
	entry: {
		main: "./src/main.ts",
	},
	resolve: {
		mainFields: ["module", "main"],
	},
});
