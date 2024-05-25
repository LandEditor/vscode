const withDefaults = require("../shared.webpack.config");

module.exports = withDefaults({
	context: __dirname,
	entry: {
		extension: "./src/npmMain.ts",
	},
	output: {
		filename: "npmMain.js",
	},
	resolve: {
		mainFields: ["module", "main"],
		extensions: [".ts", ".js"], // support ts-files and js-files
	},
});
