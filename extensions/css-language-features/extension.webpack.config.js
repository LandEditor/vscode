const withDefaults = require("../shared.webpack.config");
const path = require("path");

module.exports = withDefaults({
	context: path.join(__dirname, "client"),
	entry: {
		extension: "./src/node/cssClientMain.ts",
	},
	output: {
		filename: "cssClientMain.js",
		path: path.join(__dirname, "client", "dist", "node"),
	},
});
