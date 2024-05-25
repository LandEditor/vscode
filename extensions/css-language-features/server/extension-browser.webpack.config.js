const withBrowserDefaults = require("../../shared.webpack.config").browser;
const path = require("path");

module.exports = withBrowserDefaults({
	context: __dirname,
	entry: {
		extension: "./src/browser/cssServerWorkerMain.ts",
	},
	output: {
		filename: "cssServerMain.js",
		path: path.join(__dirname, "dist", "browser"),
		libraryTarget: "var",
		library: "serverExportVar",
	},
});
