const withBrowserDefaults = require("../shared.webpack.config").browser;

const config = withBrowserDefaults({
	context: __dirname,
	entry: {
		extension: "./src/npmBrowserMain.ts",
	},
	output: {
		filename: "npmBrowserMain.js",
	},
	resolve: {
		fallback: {
			child_process: false,
		},
	},
});

module.exports = config;
