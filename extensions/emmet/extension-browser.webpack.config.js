const withBrowserDefaults = require("../shared.webpack.config").browser;

module.exports = withBrowserDefaults({
	context: __dirname,
	entry: {
		extension: "./src/browser/emmetBrowserMain.ts",
	},
	output: {
		filename: "emmetBrowserMain.js",
	},
});
