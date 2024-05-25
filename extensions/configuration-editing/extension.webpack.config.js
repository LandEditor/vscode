const withDefaults = require("../shared.webpack.config");

module.exports = withDefaults({
	context: __dirname,
	entry: {
		extension: "./src/configurationEditingMain.ts",
	},
	output: {
		filename: "configurationEditingMain.js",
	},
	resolve: {
		mainFields: ["module", "main"],
	},
});
