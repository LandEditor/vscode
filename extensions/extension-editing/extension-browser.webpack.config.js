const withBrowserDefaults = require("../shared.webpack.config").browser;

module.exports = withBrowserDefaults({
	context: __dirname,
	entry: {
		extension: "./src/extensionEditingBrowserMain.ts",
	},
	output: {
		filename: "extensionEditingBrowserMain.js",
	},
});
