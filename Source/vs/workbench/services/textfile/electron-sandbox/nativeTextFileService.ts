/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Promises } from "vs/base/common/async";
import { URI } from "vs/base/common/uri";
import { ICodeEditorService } from "vs/editor/browser/services/codeEditorService";
import { ILanguageService } from "vs/editor/common/languages/language";
import { IModelService } from "vs/editor/common/services/model";
import { ITextResourceConfigurationService } from "vs/editor/common/services/textResourceConfiguration";
import { localize } from "vs/nls";
import {
	IDialogService,
	IFileDialogService,
} from "vs/platform/dialogs/common/dialogs";
import { IFileReadLimits, IFileService } from "vs/platform/files/common/files";
import {
	InstantiationType,
	registerSingleton,
} from "vs/platform/instantiation/common/extensions";
import { IInstantiationService } from "vs/platform/instantiation/common/instantiation";
import { ILogService } from "vs/platform/log/common/log";
import { IUriIdentityService } from "vs/platform/uriIdentity/common/uriIdentity";
import { IDecorationsService } from "vs/workbench/services/decorations/common/decorations";
import { INativeWorkbenchEnvironmentService } from "vs/workbench/services/environment/electron-sandbox/environmentService";
import { IElevatedFileService } from "vs/workbench/services/files/common/elevatedFileService";
import { IFilesConfigurationService } from "vs/workbench/services/filesConfiguration/common/filesConfigurationService";
import { ILifecycleService } from "vs/workbench/services/lifecycle/common/lifecycle";
import { IPathService } from "vs/workbench/services/path/common/pathService";
import { AbstractTextFileService } from "vs/workbench/services/textfile/browser/textFileService";
import {
	IReadTextFileOptions,
	ITextFileContent,
	ITextFileEditorModel,
	ITextFileService,
	ITextFileStreamContent,
	TextFileEditorModelState,
} from "vs/workbench/services/textfile/common/textfiles";
import { IUntitledTextEditorService } from "vs/workbench/services/untitled/common/untitledTextEditorService";
import { IWorkingCopyFileService } from "vs/workbench/services/workingCopy/common/workingCopyFileService";

export class NativeTextFileService extends AbstractTextFileService {
	protected override readonly environmentService: INativeWorkbenchEnvironmentService;

	constructor(
		@IFileService fileService: IFileService,
		@IUntitledTextEditorService untitledTextEditorService: IUntitledTextEditorService,
		@ILifecycleService lifecycleService: ILifecycleService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IModelService modelService: IModelService,
		@INativeWorkbenchEnvironmentService environmentService: INativeWorkbenchEnvironmentService,
		@IDialogService dialogService: IDialogService,
		@IFileDialogService fileDialogService: IFileDialogService,
		@ITextResourceConfigurationService textResourceConfigurationService: ITextResourceConfigurationService,
		@IFilesConfigurationService filesConfigurationService: IFilesConfigurationService,
		@ICodeEditorService codeEditorService: ICodeEditorService,
		@IPathService pathService: IPathService,
		@IWorkingCopyFileService workingCopyFileService: IWorkingCopyFileService,
		@IUriIdentityService uriIdentityService: IUriIdentityService,
		@ILanguageService languageService: ILanguageService,
		@IElevatedFileService elevatedFileService: IElevatedFileService,
		@ILogService logService: ILogService,
		@IDecorationsService decorationsService: IDecorationsService,
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
		this.lifecycleService.onWillShutdown((event) =>
			event.join(this.onWillShutdown(), {
				id: "join.textFiles",
				label: localize("join.textFiles", "Saving text files"),
			}),
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
		if (options) {
			ensuredOptions = options;
		} else {
			ensuredOptions = Object.create(null);
		}

		let ensuredLimits: IFileReadLimits;
		if (ensuredOptions.limits) {
			ensuredLimits = ensuredOptions.limits;
		} else {
			ensuredLimits = Object.create(null);
			ensuredOptions = {
				...ensuredOptions,
				limits: ensuredLimits,
			};
		}

		return ensuredOptions;
	}
}

registerSingleton(
	ITextFileService,
	NativeTextFileService,
	InstantiationType.Eager,
);
