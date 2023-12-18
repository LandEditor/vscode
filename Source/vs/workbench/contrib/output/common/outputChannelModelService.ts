/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { toLocalISOString } from "vs/base/common/date";
import { joinPath } from "vs/base/common/resources";
import { URI } from "vs/base/common/uri";
import { ILanguageSelection } from "vs/editor/common/languages/language";
import { IFileService } from "vs/platform/files/common/files";
import {
	InstantiationType,
	registerSingleton,
} from "vs/platform/instantiation/common/extensions";
import {
	IInstantiationService,
	createDecorator,
} from "vs/platform/instantiation/common/instantiation";
import {
	DelegatedOutputChannelModel,
	FileOutputChannelModel,
	IOutputChannelModel,
} from "vs/workbench/contrib/output/common/outputChannelModel";
import { IWorkbenchEnvironmentService } from "vs/workbench/services/environment/common/environmentService";

export const IOutputChannelModelService =
	createDecorator<IOutputChannelModelService>("outputChannelModelService");

export interface IOutputChannelModelService {
	readonly _serviceBrand: undefined;

	createOutputChannelModel(
		id: string,
		modelUri: URI,
		language: ILanguageSelection,
		file?: URI,
	): IOutputChannelModel;
}

export class OutputChannelModelService {
	declare readonly _serviceBrand: undefined;

	private readonly outputLocation: URI;

	constructor(
		@IFileService private readonly fileService: IFileService,
		@IInstantiationService
		private readonly instantiationService: IInstantiationService,
		@IWorkbenchEnvironmentService
		environmentService: IWorkbenchEnvironmentService
	) {
		this.outputLocation = joinPath(
			environmentService.windowLogsPath,
			`output_${toLocalISOString(new Date()).replace(/-|:|\.\d+Z$/g, "")}`
		);
	}

	createOutputChannelModel(
		id: string,
		modelUri: URI,
		language: ILanguageSelection,
		file?: URI,
	): IOutputChannelModel {
		return file
			? this.instantiationService.createInstance(
					FileOutputChannelModel,
					modelUri,
					language,
					file,
			  )
			: this.instantiationService.createInstance(
					DelegatedOutputChannelModel,
					id,
					modelUri,
					language,
					this.outputDir,
			  );
	}

	private _outputDir: Promise<URI> | null = null;
	private get outputDir(): Promise<URI> {
		if (!this._outputDir) {
			this._outputDir = this.fileService
				.createFolder(this.outputLocation)
				.then(() => this.outputLocation);
		}
		return this._outputDir;
	}
}

registerSingleton(
	IOutputChannelModelService,
	OutputChannelModelService,
	InstantiationType.Delayed,
);
