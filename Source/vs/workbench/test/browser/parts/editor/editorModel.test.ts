/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from "assert";
import { DisposableStore } from "vs/base/common/lifecycle";
import { Mimes } from "vs/base/common/mime";
import { URI } from "vs/base/common/uri";
import { ensureNoDisposablesAreLeakedInTestSuite } from "vs/base/test/common/utils";
import { ILanguageService } from "vs/editor/common/languages/language";
import { ILanguageConfigurationService } from "vs/editor/common/languages/languageConfigurationRegistry";
import { ITextBufferFactory } from "vs/editor/common/model";
import { createTextBufferFactory } from "vs/editor/common/model/textModel";
import { LanguageService } from "vs/editor/common/services/languageService";
import { IModelService } from "vs/editor/common/services/model";
import { ModelService } from "vs/editor/common/services/modelService";
import { ITextResourcePropertiesService } from "vs/editor/common/services/textResourceConfiguration";
import { TestLanguageConfigurationService } from "vs/editor/test/common/modes/testLanguageConfigurationService";
import { TestAccessibilityService } from "vs/platform/accessibility/test/common/testAccessibilityService";
import { IConfigurationService } from "vs/platform/configuration/common/configuration";
import { TestConfigurationService } from "vs/platform/configuration/test/common/testConfigurationService";
import { IDialogService } from "vs/platform/dialogs/common/dialogs";
import { TestDialogService } from "vs/platform/dialogs/test/common/testDialogService";
import { TestInstantiationService } from "vs/platform/instantiation/test/common/instantiationServiceMock";
import { INotificationService } from "vs/platform/notification/common/notification";
import { TestNotificationService } from "vs/platform/notification/test/common/testNotificationService";
import { IStorageService } from "vs/platform/storage/common/storage";
import { IThemeService } from "vs/platform/theme/common/themeService";
import { TestThemeService } from "vs/platform/theme/test/common/testThemeService";
import { IUndoRedoService } from "vs/platform/undoRedo/common/undoRedo";
import { UndoRedoService } from "vs/platform/undoRedo/common/undoRedoService";
import { EditorModel } from "vs/workbench/common/editor/editorModel";
import { BaseTextEditorModel } from "vs/workbench/common/editor/textEditorModel";
import { IEditorService } from "vs/workbench/services/editor/common/editorService";
import { IWorkbenchEnvironmentService } from "vs/workbench/services/environment/common/environmentService";
import { LanguageDetectionService } from "vs/workbench/services/languageDetection/browser/languageDetectionWorkerServiceImpl";
import {
	TestEditorService,
	TestEnvironmentService,
} from "vs/workbench/test/browser/workbenchTestServices";
import {
	TestStorageService,
	TestTextResourcePropertiesService,
} from "vs/workbench/test/common/workbenchTestServices";

suite("EditorModel", () => {
	class MyEditorModel extends EditorModel {}
	class MyTextEditorModel extends BaseTextEditorModel {
		testCreateTextEditorModel(
			value: ITextBufferFactory,
			resource?: URI,
			preferredLanguageId?: string,
		) {
			return super.createTextEditorModel(
				value,
				resource,
				preferredLanguageId,
			);
		}

		override isReadonly(): boolean {
			return false;
		}
	}

	function stubModelService(
		instantiationService: TestInstantiationService,
	): IModelService {
		const dialogService = new TestDialogService();
		const notificationService = new TestNotificationService();
		const undoRedoService = new UndoRedoService(
			dialogService,
			notificationService,
		);
		instantiationService.stub(
			IWorkbenchEnvironmentService,
			TestEnvironmentService,
		);
		instantiationService.stub(
			IConfigurationService,
			new TestConfigurationService(),
		);
		instantiationService.stub(
			ITextResourcePropertiesService,
			new TestTextResourcePropertiesService(
				instantiationService.get(IConfigurationService),
			),
		);
		instantiationService.stub(IDialogService, dialogService);
		instantiationService.stub(INotificationService, notificationService);
		instantiationService.stub(IUndoRedoService, undoRedoService);
		instantiationService.stub(
			IEditorService,
			disposables.add(new TestEditorService()),
		);
		instantiationService.stub(IThemeService, new TestThemeService());
		instantiationService.stub(
			ILanguageConfigurationService,
			disposables.add(new TestLanguageConfigurationService()),
		);
		instantiationService.stub(
			IStorageService,
			disposables.add(new TestStorageService()),
		);

		return disposables.add(
			instantiationService.createInstance(ModelService),
		);
	}

	let instantiationService: TestInstantiationService;
	let languageService: ILanguageService;

	const disposables = new DisposableStore();

	setup(() => {
		instantiationService = disposables.add(new TestInstantiationService());
		languageService = instantiationService.stub(
			ILanguageService,
			LanguageService,
		);
	});

	teardown(() => {
		disposables.clear();
	});

	test("basics", async () => {
		let counter = 0;

		const model = disposables.add(new MyEditorModel());

		disposables.add(
			model.onWillDispose(() => {
				assert(true);
				counter++;
			}),
		);

		await model.resolve();
		assert.strictEqual(model.isDisposed(), false);
		assert.strictEqual(model.isResolved(), true);
		model.dispose();
		assert.strictEqual(counter, 1);
		assert.strictEqual(model.isDisposed(), true);
	});

	test("BaseTextEditorModel", async () => {
		const modelService = stubModelService(instantiationService);

		const model = disposables.add(
			new MyTextEditorModel(
				modelService,
				languageService,
				disposables.add(
					instantiationService.createInstance(
						LanguageDetectionService,
					),
				),
				instantiationService.createInstance(TestAccessibilityService),
			),
		);
		await model.resolve();

		disposables.add(
			model.testCreateTextEditorModel(
				createTextBufferFactory("foo"),
				null!,
				Mimes.text,
			),
		);
		assert.strictEqual(model.isResolved(), true);
	});

	ensureNoDisposablesAreLeakedInTestSuite();
});
