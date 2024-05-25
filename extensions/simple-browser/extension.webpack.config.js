const withDefaults = require("../shared.webpack.config");

module.exports = withDefaults({
	context: __dirname,
	resolve: {
		mainFields: ["module", "main"],
	},
	entry: {
		extension: "./src/extension.ts",
	},
});
