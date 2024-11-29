/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Promises } from "../../../../base/common/async.js";
import { URI } from "../../../../base/common/uri.js";
import { ICodeEditorService } from "../../../../editor/browser/services/codeEditorService.js";
import { ILanguageService } from "../../../../editor/common/languages/language.js";
import { IModelService } from "../../../../editor/common/services/model.js";
import { ITextResourceConfigurationService } from "../../../../editor/common/services/textResourceConfiguration.js";
import { localize } from "../../../../nls.js";
import {
	IDialogService,
	IFileDialogService,
} from "../../../../platform/dialogs/common/dialogs.js";
import {
	IFileReadLimits,
	IFileService,
} from "../../../../platform/files/common/files.js";
import {
	InstantiationType,
	registerSingleton,
} from "../../../../platform/instantiation/common/extensions.js";
import { IInstantiationService } from "../../../../platform/instantiation/common/instantiation.js";
import { ILogService } from "../../../../platform/log/common/log.js";
import { IUriIdentityService } from "../../../../platform/uriIdentity/common/uriIdentity.js";
import { IDecorationsService } from "../../decorations/common/decorations.js";
import { INativeWorkbenchEnvironmentService } from "../../environment/electron-sandbox/environmentService.js";
import { IElevatedFileService } from "../../files/common/elevatedFileService.js";
import { IFilesConfigurationService } from "../../filesConfiguration/common/filesConfigurationService.js";
import { ILifecycleService } from "../../lifecycle/common/lifecycle.js";
import { IPathService } from "../../path/common/pathService.js";
import { IUntitledTextEditorService } from "../../untitled/common/untitledTextEditorService.js";
import { IWorkingCopyFileService } from "../../workingCopy/common/workingCopyFileService.js";
import { AbstractTextFileService } from "../browser/textFileService.js";
import {
	IReadTextFileOptions,
	ITextFileContent,
	ITextFileEditorModel,
	ITextFileService,
	ITextFileStreamContent,
	TextFileEditorModelState,
} from "../common/textfiles.js";

export class NativeTextFileService extends AbstractTextFileService {
	protected override readonly environmentService: INativeWorkbenchEnvironmentService;

	constructor(
		@IFileService
		fileService: IFileService,
		@IUntitledTextEditorService
		untitledTextEditorService: IUntitledTextEditorService,
		@ILifecycleService
		lifecycleService: ILifecycleService,
		@IInstantiationService
		instantiationService: IInstantiationService,
		@IModelService
		modelService: IModelService,
		@INativeWorkbenchEnvironmentService
		environmentService: INativeWorkbenchEnvironmentService,
		@IDialogService
		dialogService: IDialogService,
		@IFileDialogService
		fileDialogService: IFileDialogService,
		@ITextResourceConfigurationService
		textResourceConfigurationService: ITextResourceConfigurationService,
		@IFilesConfigurationService
		filesConfigurationService: IFilesConfigurationService,
		@ICodeEditorService
		codeEditorService: ICodeEditorService,
		@IPathService
		pathService: IPathService,
		@IWorkingCopyFileService
		workingCopyFileService: IWorkingCopyFileService,
		@IUriIdentityService
		uriIdentityService: IUriIdentityService,
		@ILanguageService
		languageService: ILanguageService,
		@IElevatedFileService
		elevatedFileService: IElevatedFileService,
		@ILogService
		logService: ILogService,
		@IDecorationsService
		decorationsService: IDecorationsService,
	) {
		super(
			fileService,
			untitledTextEditorService,
			lifecycleService,
			instantiationService,
			modelService,
			environmentService,
			dialogService,
			fileDialogService,
			textResourceConfigurationService,
			filesConfigurationService,
			codeEditorService,
			pathService,
			workingCopyFileService,
			uriIdentityService,
			languageService,
			logService,
			elevatedFileService,
			decorationsService,
		);

		this.environmentService = environmentService;

		this.registerListeners();
	}

	private registerListeners(): void {
		// Lifecycle
		this._register(
			this.lifecycleService.onWillShutdown((event) =>
				event.join(this.onWillShutdown(), {
					id: "join.textFiles",
					label: localize("join.textFiles", "Saving text files"),
				}),
			),
		);
	}

	private async onWillShutdown(): Promise<void> {
		let modelsPendingToSave: ITextFileEditorModel[];
		// As long as models are pending to be saved, we prolong the shutdown
		// until that has happened to ensure we are not shutting down in the
		// middle of writing to the file
		// (https://github.com/microsoft/vscode/issues/116600)
		while (
			(modelsPendingToSave = this.files.models.filter((model) =>
				model.hasState(TextFileEditorModelState.PENDING_SAVE),
			)).length > 0
		) {
			await Promises.settled(
				modelsPendingToSave.map((model) =>
					model.joinState(TextFileEditorModelState.PENDING_SAVE),
				),
			);
		}
	}

	override async read(
		resource: URI,
		options?: IReadTextFileOptions,
	): Promise<ITextFileContent> {
		// ensure platform limits are applied
		options = this.ensureLimits(options);

		return super.read(resource, options);
	}

	override async readStream(
		resource: URI,
		options?: IReadTextFileOptions,
	): Promise<ITextFileStreamContent> {
		// ensure platform limits are applied
		options = this.ensureLimits(options);

		return super.readStream(resource, options);
	}

	private ensureLimits(options?: IReadTextFileOptions): IReadTextFileOptions {
		let ensuredOptions: IReadTextFileOptions;

		if (!options) {
			ensuredOptions = Object.create(null);
		} else {
			ensuredOptions = options;
		}

		let ensuredLimits: IFileReadLimits;

		if (!ensuredOptions.limits) {
			ensuredLimits = Object.create(null);

			ensuredOptions = {
				...ensuredOptions,
				limits: ensuredLimits,
			};
		} else {
			ensuredLimits = ensuredOptions.limits;
		}

		return ensuredOptions;
	}
}
registerSingleton(
	ITextFileService,
	NativeTextFileService,
	InstantiationType.Eager,
);
