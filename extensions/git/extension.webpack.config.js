const withDefaults = require("../shared.webpack.config");

module.exports = withDefaults({
	context: __dirname,
	entry: {
		main: "./src/main.ts",
		["askpass-main"]: "./src/askpass-main.ts",
		["git-editor-main"]: "./src/git-editor-main.ts",
	},
});
