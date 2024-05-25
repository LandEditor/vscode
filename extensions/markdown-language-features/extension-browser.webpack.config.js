const withBrowserDefaults = require("../shared.webpack.config").browser;

module.exports = withBrowserDefaults(
	{
		context: __dirname,
		entry: {
			extension: "./src/extension.browser.ts",
		},
	},
	{
		configFile: "tsconfig.browser.json",
	},
);
