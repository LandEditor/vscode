const withDefaults = require("../shared.webpack.config");

module.exports = withDefaults({
	context: __dirname,
	entry: {
		extension: "./src/extension.ts",
	},
	output: {
		filename: "extension.js",
	},
});
