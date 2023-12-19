/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const path = require("path");
const fs = require("fs");
const child_process = require("child_process");

const generatedNote = `//
// **NOTE**: Do not edit directly! This file is generated using \`npm run import-typescript\`
//
`;

const TYPESCRIPT_LIB_SOURCE = path.join(
	__dirname,
	"../../node_modules/typescript/lib",
);
const TYPESCRIPT_LIB_DESTINATION = path.join(__dirname, "../server/build");

(() => {
	try {
		fs.statSync(TYPESCRIPT_LIB_DESTINATION);
	} catch (err) {
		fs.mkdirSync(TYPESCRIPT_LIB_DESTINATION);
	}
	importLibs("es6");
})();

function importLibs(startLib) {
	function getFileName(name) {
		return name === "" ? "lib.d.ts" : `lib.${name}.d.ts`;
	}
	function getVariableName(name) {
		return name === "" ? "lib_dts" : `lib_${name.replace(/\./g, "_")}_dts`;
	}
	function readLibFile(name) {
		const srcPath = path.join(TYPESCRIPT_LIB_SOURCE, getFileName(name));
		return fs.readFileSync(srcPath).toString();
	}

	const queue = [];
	const in_queue = {};

	const enqueue = (name) => {
		if (in_queue[name]) {
			return;
		}
		in_queue[name] = true;
		queue.push(name);
	};

	enqueue(startLib);

	const result = [];
	while (queue.length > 0) {
		const name = queue.shift();
		const contents = readLibFile(name);
		const lines = contents.split(/\r\n|\r|\n/);

		let output = "";
		const writeOutput = (text) => {
			if (output.length === 0) {
				output = text;
			} else {
				output += ` + ${text}`;
			}
		};
		let outputLines = [];
		const flushOutputLines = () => {
			writeOutput(`"${escapeText(outputLines.join("\n"))}"`);
			outputLines = [];
		};
		const deps = [];
		for (let i = 0; i < lines.length; i++) {
			const m = lines[i].match(/\/\/\/\s*<reference\s*lib="([^"]+)"/);
			if (m) {
				flushOutputLines();
				writeOutput(getVariableName(m[1]));
				deps.push(getVariableName(m[1]));
				enqueue(m[1]);
				continue;
			}
			outputLines.push(lines[i]);
		}
		flushOutputLines();

		result.push({
			name: getVariableName(name),
			deps: deps,
			output: output,
		});
	}

	let strResult = `/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
${generatedNote}`;
	// Do a topological sort
	while (result.length > 0) {
		for (let i = result.length - 1; i >= 0; i--) {
			if (result[i].deps.length === 0) {
				// emit this node
				strResult += `\nexport const ${result[i].name}: string = ${result[i].output};\n`;

				// mark dep as resolved
				for (let j = 0; j < result.length; j++) {
					for (let k = 0; k < result[j].deps.length; k++) {
						if (result[j].deps[k] === result[i].name) {
							result[j].deps.splice(k, 1);
							break;
						}
					}
				}

				// remove from result
				result.splice(i, 1);
				break;
			}
		}
	}

	const dstPath = path.join(TYPESCRIPT_LIB_DESTINATION, "lib.ts");
	fs.writeFileSync(dstPath, strResult);
}

/**
 * Escape text such that it can be used in a javascript string enclosed by double quotes (")
 */
function escapeText(text) {
	// See http://www.javascriptkit.com/jsref/escapesequence.shtml
	const _backspace = "\b".charCodeAt(0);
	const _formFeed = "\f".charCodeAt(0);
	const _newLine = "\n".charCodeAt(0);
	const _nullChar = 0;
	const _carriageReturn = "\r".charCodeAt(0);
	const _tab = "\t".charCodeAt(0);
	const _verticalTab = "\v".charCodeAt(0);
	const _backslash = "\\".charCodeAt(0);
	const _doubleQuote = '"'.charCodeAt(0);

	let startPos = 0;
	let chrCode;
	let replaceWith = null;
	const resultPieces = [];

	for (let i = 0, len = text.length; i < len; i++) {
		chrCode = text.charCodeAt(i);
		switch (chrCode) {
			case _backspace: {
				replaceWith = "\\b";
				break;
			}
			case _formFeed: {
				replaceWith = "\\f";
				break;
			}
			case _newLine: {
				replaceWith = "\\n";
				break;
			}
			case _nullChar: {
				replaceWith = "\\0";
				break;
			}
			case _carriageReturn: {
				replaceWith = "\\r";
				break;
			}
			case _tab: {
				replaceWith = "\\t";
				break;
			}
			case _verticalTab: {
				replaceWith = "\\v";
				break;
			}
			case _backslash: {
				replaceWith = "\\\\";
				break;
			}
			case _doubleQuote: {
				replaceWith = '\\"';
				break;
			}
		}
		if (replaceWith !== null) {
			resultPieces.push(text.substring(startPos, i));
			resultPieces.push(replaceWith);
			startPos = i + 1;
			replaceWith = null;
		}
	}
	resultPieces.push(text.substring(startPos, len));
	return resultPieces.join("");
}
