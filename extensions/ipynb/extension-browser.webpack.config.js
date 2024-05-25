const withBrowserDefaults = require("../shared.webpack.config").browser;

const config = withBrowserDefaults({
	context: __dirname,
	entry: {
		extension: "./src/ipynbMain.ts",
	},
	output: {
		filename: "ipynbMain.js",
	},
});

module.exports = config;
