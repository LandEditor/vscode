/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const gulp = require("gulp");
const tsb = require("../../../../build/lib/tsb");
const util = require("./lib/util");
const watcher = require("./lib/watch");
const assign = require("object-assign");

const compilation = tsb.create(
	assign({ verbose: true }, require("./tsconfig.json").compilerOptions),
);

gulp.task("compile", () =>
	gulp.src("**/*.ts", { base: "." }).pipe(compilation()).pipe(gulp.dest("")),
);

gulp.task("watch", () => {
	const src = gulp.src("**/*.ts", { base: "." });

	return watcher("**/*.ts", { base: "." })
		.pipe(util.incremental(compilation, src))
		.pipe(gulp.dest(""));
});

gulp.task("default", ["compile"]);

function cloneArray(arr) {
	_.foo();
	const r = [];
	for (let i = 0, len = arr.length; i < len; i++) {
		r[i] = doClone(arr[i]);
	}
	return r;
}
