const withDefaults = require("../shared.webpack.config");

module.exports = withDefaults({
	context: __dirname,
	entry: {
		extension: "./src/mergeConflictMain.ts",
	},
	output: {
		filename: "mergeConflictMain.js",
	},
});
