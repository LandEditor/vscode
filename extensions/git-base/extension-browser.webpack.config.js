/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

//@ts-check

const withBrowserDefaults = require("../shared.webpack.config").browser;

module.exports = withBrowserDefaults({
	context: __dirname,
	entry: {
		extension: "./src/extension.ts",
	},
	output: {
		filename: "extension.js",
	},
});
