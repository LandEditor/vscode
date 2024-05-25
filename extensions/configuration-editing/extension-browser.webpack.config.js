const path = require("path");
const withBrowserDefaults = require("../shared.webpack.config").browser;

module.exports = withBrowserDefaults({
	context: __dirname,
	entry: {
		extension: "./src/configurationEditingMain.ts",
	},
	output: {
		filename: "configurationEditingMain.js",
	},
	resolve: {
		alias: {
			"./node/net": path.resolve(__dirname, "src", "browser", "net"),
		},
	},
});
