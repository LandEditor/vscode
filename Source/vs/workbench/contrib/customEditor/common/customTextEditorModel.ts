/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Emitter, type Event } from "../../../../base/common/event.js";
import type { IMarkdownString } from "../../../../base/common/htmlContent.js";
import {
	Disposable,
	type IReference,
} from "../../../../base/common/lifecycle.js";
import { isEqual } from "../../../../base/common/resources.js";
import type { URI } from "../../../../base/common/uri.js";
import {
	type IResolvedTextEditorModel,
	ITextModelService,
} from "../../../../editor/common/services/resolverService.js";
import type { IInstantiationService } from "../../../../platform/instantiation/common/instantiation.js";
import type { IRevertOptions, ISaveOptions } from "../../../common/editor.js";
import {
	type ITextFileEditorModel,
	ITextFileService,
	TextFileEditorModelState,
} from "../../../services/textfile/common/textfiles.js";
import type { ICustomEditorModel } from "./customEditor.js";

export class CustomTextEditorModel
	extends Disposable
	implements ICustomEditorModel
{
	public static async create(
		instantiationService: IInstantiationService,
		viewType: string,
		resource: URI,
	): Promise<CustomTextEditorModel> {
		return instantiationService.invokeFunction(async (accessor) => {
			const textModelResolverService = accessor.get(ITextModelService);
			const model =
				await textModelResolverService.createModelReference(resource);
			return instantiationService.createInstance(
				CustomTextEditorModel,
				viewType,
				resource,
				model,
			);
		});
	}

	private readonly _textFileModel: ITextFileEditorModel | undefined;

	private readonly _onDidChangeOrphaned = this._register(new Emitter<void>());
	public readonly onDidChangeOrphaned = this._onDidChangeOrphaned.event;

	private readonly _onDidChangeReadonly = this._register(new Emitter<void>());
	public readonly onDidChangeReadonly = this._onDidChangeReadonly.event;

	constructor(
		public readonly viewType: string,
		private readonly _resource: URI,
		private readonly _model: IReference<IResolvedTextEditorModel>,
		@ITextFileService private readonly textFileService: ITextFileService,
	) {
		super();

		this._register(_model);

		this._textFileModel = this.textFileService.files.get(_resource);
		if (this._textFileModel) {
			this._register(
				this._textFileModel.onDidChangeOrphaned(() =>
					this._onDidChangeOrphaned.fire(),
				),
			);
			this._register(
				this._textFileModel.onDidChangeReadonly(() =>
					this._onDidChangeReadonly.fire(),
				),
			);
		}

		this._register(
			this.textFileService.files.onDidChangeDirty((e) => {
				if (isEqual(this.resource, e.resource)) {
					this._onDidChangeDirty.fire();
					this._onDidChangeContent.fire();
				}
			}),
		);
	}

	public get resource() {
		return this._resource;
	}

	public isReadonly(): boolean | IMarkdownString {
		return this._model.object.isReadonly();
	}

	public get backupId() {
		return undefined;
	}

	public get canHotExit() {
		return true; // ensured via backups from text file models
	}

	public isDirty(): boolean {
		return this.textFileService.isDirty(this.resource);
	}

	public isOrphaned(): boolean {
		return !!this._textFileModel?.hasState(TextFileEditorModelState.ORPHAN);
	}

	private readonly _onDidChangeDirty: Emitter<void> = this._register(
		new Emitter<void>(),
	);
	readonly onDidChangeDirty: Event<void> = this._onDidChangeDirty.event;

	private readonly _onDidChangeContent: Emitter<void> = this._register(
		new Emitter<void>(),
	);
	readonly onDidChangeContent: Event<void> = this._onDidChangeContent.event;

	public async revert(options?: IRevertOptions) {
		return this.textFileService.revert(this.resource, options);
	}

	public saveCustomEditor(options?: ISaveOptions): Promise<URI | undefined> {
		return this.textFileService.save(this.resource, options);
	}

	public async saveCustomEditorAs(
		resource: URI,
		targetResource: URI,
		options?: ISaveOptions,
	): Promise<boolean> {
		return !!(await this.textFileService.saveAs(
			resource,
			targetResource,
			options,
		));
	}
}
