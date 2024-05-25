const withBrowserDefaults = require("../shared.webpack.config").browser;
const path = require("path");

module.exports = withBrowserDefaults({
	context: __dirname,
	entry: {
		extension: "./src/extension.ts",
	},
	output: {
		filename: "extension.js",
		path: path.join(__dirname, "dist"),
	},
});
