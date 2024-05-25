const withDefaults = require("../shared.webpack.config");
const path = require("path");

module.exports = withDefaults({
	context: path.join(__dirname, "client"),
	entry: {
		extension: "./src/node/htmlClientMain.ts",
	},
	output: {
		filename: "htmlClientMain.js",
		path: path.join(__dirname, "client", "dist", "node"),
	},
});
