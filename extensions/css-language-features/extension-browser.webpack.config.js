const withBrowserDefaults = require("../shared.webpack.config").browser;
const path = require("path");

module.exports = withBrowserDefaults({
	context: path.join(__dirname, "client"),
	entry: {
		extension: "./src/browser/cssClientMain.ts",
	},
	output: {
		filename: "cssClientMain.js",
		path: path.join(__dirname, "client", "dist", "browser"),
	},
});
