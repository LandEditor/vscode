/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { raceCancellationError } from "../../../base/common/async.js";
import type { CancellationToken } from "../../../base/common/cancellation.js";
import type { IDisposable } from "../../../base/common/lifecycle.js";
import { localize } from "../../../nls.js";
import { IInstantiationService } from "../../../platform/instantiation/common/instantiation.js";
import type {
	IProgress,
	IProgressStep,
} from "../../../platform/progress/common/progress.js";
import { NotebookFileWorkingCopyModel } from "../../contrib/notebook/common/notebookEditorModel.js";
import {
	type IExtHostContext,
	extHostCustomer,
} from "../../services/extensions/common/extHostCustomers.js";
import type {
	IStoredFileWorkingCopy,
	IStoredFileWorkingCopyModel,
} from "../../services/workingCopy/common/storedFileWorkingCopy.js";
import {
	type IStoredFileWorkingCopySaveParticipant,
	type IStoredFileWorkingCopySaveParticipantContext,
	IWorkingCopyFileService,
} from "../../services/workingCopy/common/workingCopyFileService.js";
import {
	ExtHostContext,
	type ExtHostNotebookDocumentSaveParticipantShape,
} from "../common/extHost.protocol.js";

class ExtHostNotebookDocumentSaveParticipant
	implements IStoredFileWorkingCopySaveParticipant
{
	private readonly _proxy: ExtHostNotebookDocumentSaveParticipantShape;

	constructor(extHostContext: IExtHostContext) {
		this._proxy = extHostContext.getProxy(
			ExtHostContext.ExtHostNotebookDocumentSaveParticipant,
		);
	}

	async participate(
		workingCopy: IStoredFileWorkingCopy<IStoredFileWorkingCopyModel>,
		context: IStoredFileWorkingCopySaveParticipantContext,
		_progress: IProgress<IProgressStep>,
		token: CancellationToken,
	): Promise<void> {
		if (
			!workingCopy.model ||
			!(workingCopy.model instanceof NotebookFileWorkingCopyModel)
		) {
			return undefined;
		}

		let _warningTimeout: any;

		const p = new Promise<any>((resolve, reject) => {
			_warningTimeout = setTimeout(
				() =>
					reject(
						new Error(
							localize(
								"timeout.onWillSave",
								"Aborted onWillSaveNotebookDocument-event after 1750ms",
							),
						),
					),
				1750,
			);
			this._proxy
				.$participateInSave(workingCopy.resource, context.reason, token)
				.then((_) => {
					clearTimeout(_warningTimeout);
					return undefined;
				})
				.then(resolve, reject);
		});

		return raceCancellationError(p, token);
	}
}

@extHostCustomer
export class SaveParticipant {
	private _saveParticipantDisposable: IDisposable;

	constructor(
		extHostContext: IExtHostContext,
		@IInstantiationService instantiationService: IInstantiationService,
		@IWorkingCopyFileService
		private readonly workingCopyFileService: IWorkingCopyFileService,
	) {
		this._saveParticipantDisposable =
			this.workingCopyFileService.addSaveParticipant(
				instantiationService.createInstance(
					ExtHostNotebookDocumentSaveParticipant,
					extHostContext,
				),
			);
	}

	dispose(): void {
		this._saveParticipantDisposable.dispose();
	}
}
