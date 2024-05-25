const withDefaults = require("../shared.webpack.config");

module.exports = withDefaults({
	context: __dirname,
	entry: {
		extension: "./src/phpMain.ts",
	},
	output: {
		filename: "phpMain.js",
	},
});
