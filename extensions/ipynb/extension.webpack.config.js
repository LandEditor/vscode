const withDefaults = require("../shared.webpack.config");

module.exports = withDefaults({
	context: __dirname,
	entry: {
		extension: "./src/ipynbMain.ts",
	},
	output: {
		filename: "ipynbMain.js",
	},
});
