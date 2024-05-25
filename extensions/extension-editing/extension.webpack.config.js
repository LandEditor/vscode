const withDefaults = require("../shared.webpack.config");

module.exports = withDefaults({
	context: __dirname,
	entry: {
		extension: "./src/extensionEditingMain.ts",
	},
	output: {
		filename: "extensionEditingMain.js",
	},
	externals: {
		"../../../product.json": "commonjs ../../../product.json",
	},
});
