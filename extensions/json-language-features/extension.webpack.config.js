const withDefaults = require("../shared.webpack.config");
const path = require("path");

const config = withDefaults({
	context: path.join(__dirname, "client"),
	entry: {
		extension: "./src/node/jsonClientMain.ts",
	},
	output: {
		filename: "jsonClientMain.js",
		path: path.join(__dirname, "client", "dist", "node"),
	},
});

module.exports = config;
