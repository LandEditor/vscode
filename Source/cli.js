// ESM-comment-begin
// // Delete `VSCODE_CWD` very early. We have seen
// // reports where `code .` would use the wrong
// // current working directory due to our variable
// // somehow escaping to the parent shell
// // (https://github.com/microsoft/vscode/issues/126399)
// delete process.env['VSCODE_CWD'];
// const bootstrapNode = require('./bootstrap-node');
// const bootstrapAmd = require('./bootstrap-amd');
// const { resolveNLSConfiguration } = require('./vs/base/node/nls');
// const product = require('./bootstrap-meta').product;
// ESM-comment-end
// ESM-uncomment-begin
import "./bootstrap-cli.js"; // this MUST come before other imports as it changes global state

import * as path from "path";
import { fileURLToPath } from "url";

import * as bootstrapAmd from "./bootstrap-amd.js";
import { product } from "./bootstrap-meta.js";
import * as bootstrapNode from "./bootstrap-node.js";
import { resolveNLSConfiguration } from "./vs/base/node/nls.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// ESM-uncomment-end

async function start() {
	// NLS
	const nlsConfiguration = await resolveNLSConfiguration({
		userLocale: "en",
		osLocale: "en",
		commit: product.commit,
		userDataPath: "",
		nlsMetadataPath: __dirname,
	});
	process.env["VSCODE_NLS_CONFIG"] = JSON.stringify(nlsConfiguration); // required for `bootstrap-amd` to pick up NLS messages

	// Enable portable support
	// @ts-ignore
	bootstrapNode.configurePortable(product);

	// Enable ASAR support
	bootstrapNode.enableASARSupport();

	// Signal processes that we got launched as CLI
	process.env["VSCODE_CLI"] = "1";

	// Load CLI through AMD loader
	bootstrapAmd.load("vs/code/node/cli");
}

start();
