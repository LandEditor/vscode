/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// @ts-check

import { spawn } from "child_process";
import { promises as fs } from "fs";
import * as path from "path";

const yarn = process.platform === "win32" ? "yarn.cmd" : "yarn";
const rootDir = path.resolve(__dirname, "..", "..");

function runProcess(command: string, args: readonly string[] = []) {
	return new Promise<void>((resolve, reject) => {
		const child = spawn(command, args, {
			cwd: rootDir,
			stdio: "inherit",
			env: process.env,
		});
		child.on("exit", (err) => (err ? process.exit(err ?? 1) : resolve()));
		child.on("error", reject);
	});
}

async function exists(subdir: string) {
	try {
		await fs.stat(path.join(rootDir, subdir));
		return true;
	} catch {
		return false;
	}
}

async function ensureNodeModules() {
	if (!(await exists("node_modules"))) {
		await runProcess(yarn);
	}
}

async function getElectron() {
	await runProcess(yarn, ["electron"]);
}

async function ensureCompiled() {
	if (!(await exists("out"))) {
		await runProcess(yarn, ["compile"]);
	}
}

async function main() {
	await ensureNodeModules();
	await getElectron();
	await ensureCompiled();

	// Can't require this until after dependencies are installed
	const { getBuiltInExtensions } = require("./builtInExtensions");
	await getBuiltInExtensions();
}

if (require.main === module) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
