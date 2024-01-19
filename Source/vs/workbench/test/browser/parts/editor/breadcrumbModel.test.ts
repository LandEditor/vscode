/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from "assert";
import { URI } from "vs/base/common/uri";
import { mock } from "vs/base/test/common/mock";
import { ensureNoDisposablesAreLeakedInTestSuite } from "vs/base/test/common/utils";
import { TestConfigurationService } from "vs/platform/configuration/test/common/testConfigurationService";
import { FileKind } from "vs/platform/files/common/files";
import { WorkspaceFolder } from "vs/platform/workspace/common/workspace";
import { Workspace } from "vs/platform/workspace/test/common/testWorkspace";
import {
	BreadcrumbsModel,
	FileElement,
} from "vs/workbench/browser/parts/editor/breadcrumbsModel";
import { IOutlineService } from "vs/workbench/services/outline/browser/outline";
import { TestContextService } from "vs/workbench/test/common/workbenchTestServices";

suite("Breadcrumb Model", () => {
	let model: BreadcrumbsModel;
	const workspaceService = new TestContextService(
		new Workspace("ffff", [
			new WorkspaceFolder({
				uri: URI.parse("foo:/bar/baz/ws"),
				name: "ws",
				index: 0,
			}),
		]),
	);
	const configService = new (class extends TestConfigurationService {
		override getValue(...args: any[]) {
			if (args[0] === "breadcrumbs.filePath") {
				return "on";
			}
			if (args[0] === "breadcrumbs.symbolPath") {
				return "on";
			}
			return super.getValue(...args);
		}
		override updateValue() {
			return Promise.resolve();
		}
	})();

	teardown(() => {
		model.dispose();
	});

	ensureNoDisposablesAreLeakedInTestSuite();

	test("only uri, inside workspace", () => {
		model = new BreadcrumbsModel(
			URI.parse("foo:/bar/baz/ws/some/path/file.ts"),
			undefined,
			configService,
			workspaceService,
			new (class extends mock<IOutlineService>() {})(),
		);
		const elements = model.getElements();

		assert.strictEqual(elements.length, 3);
		const [one, two, three] = elements as FileElement[];
		assert.strictEqual(one.kind, FileKind.FOLDER);
		assert.strictEqual(two.kind, FileKind.FOLDER);
		assert.strictEqual(three.kind, FileKind.FILE);
		assert.strictEqual(one.uri.toString(), "foo:/bar/baz/ws/some");
		assert.strictEqual(two.uri.toString(), "foo:/bar/baz/ws/some/path");
		assert.strictEqual(
			three.uri.toString(),
			"foo:/bar/baz/ws/some/path/file.ts",
		);
	});

	test("display uri matters for FileElement", () => {
		model = new BreadcrumbsModel(
			URI.parse("foo:/bar/baz/ws/some/PATH/file.ts"),
			undefined,
			configService,
			workspaceService,
			new (class extends mock<IOutlineService>() {})(),
		);
		const elements = model.getElements();

		assert.strictEqual(elements.length, 3);
		const [one, two, three] = elements as FileElement[];
		assert.strictEqual(one.kind, FileKind.FOLDER);
		assert.strictEqual(two.kind, FileKind.FOLDER);
		assert.strictEqual(three.kind, FileKind.FILE);
		assert.strictEqual(one.uri.toString(), "foo:/bar/baz/ws/some");
		assert.strictEqual(two.uri.toString(), "foo:/bar/baz/ws/some/PATH");
		assert.strictEqual(
			three.uri.toString(),
			"foo:/bar/baz/ws/some/PATH/file.ts",
		);
	});

	test("only uri, outside workspace", () => {
		model = new BreadcrumbsModel(
			URI.parse("foo:/outside/file.ts"),
			undefined,
			configService,
			workspaceService,
			new (class extends mock<IOutlineService>() {})(),
		);
		const elements = model.getElements();

		assert.strictEqual(elements.length, 2);
		const [one, two] = elements as FileElement[];
		assert.strictEqual(one.kind, FileKind.FOLDER);
		assert.strictEqual(two.kind, FileKind.FILE);
		assert.strictEqual(one.uri.toString(), "foo:/outside");
		assert.strictEqual(two.uri.toString(), "foo:/outside/file.ts");
	});
});
