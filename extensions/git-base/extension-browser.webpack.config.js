const withBrowserDefaults = require("../shared.webpack.config").browser;

module.exports = withBrowserDefaults({
	context: __dirname,
	entry: {
		extension: "./src/extension.ts",
	},
	output: {
		filename: "extension.js",
	},
});
