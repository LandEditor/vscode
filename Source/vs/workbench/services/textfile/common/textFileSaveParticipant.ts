/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { insert } from "../../../../base/common/arrays.js";
import { raceCancellation } from "../../../../base/common/async.js";
import type { CancellationToken } from "../../../../base/common/cancellation.js";
import {
	Disposable,
	type IDisposable,
	toDisposable,
} from "../../../../base/common/lifecycle.js";
import { ILogService } from "../../../../platform/log/common/log.js";
import type {
	IProgress,
	IProgressStep,
} from "../../../../platform/progress/common/progress.js";
import type {
	ITextFileEditorModel,
	ITextFileSaveParticipant,
	ITextFileSaveParticipantContext,
} from "./textfiles.js";

export class TextFileSaveParticipant extends Disposable {
	private readonly saveParticipants: ITextFileSaveParticipant[] = [];

	constructor(@ILogService private readonly logService: ILogService) {
		super();
	}

	addSaveParticipant(participant: ITextFileSaveParticipant): IDisposable {
		const remove = insert(this.saveParticipants, participant);

		return toDisposable(() => remove());
	}

	async participate(
		model: ITextFileEditorModel,
		context: ITextFileSaveParticipantContext,
		progress: IProgress<IProgressStep>,
		token: CancellationToken,
	): Promise<void> {
		// undoStop before participation
		model.textEditorModel?.pushStackElement();

		for (const saveParticipant of this.saveParticipants) {
			if (
				token.isCancellationRequested ||
				!model.textEditorModel /* disposed */
			) {
				break;
			}

			try {
				const promise = saveParticipant.participate(
					model,
					context,
					progress,
					token,
				);
				await raceCancellation(promise, token);
			} catch (err) {
				this.logService.error(err);
			}
		}

		// undoStop after participation
		model.textEditorModel?.pushStackElement();
	}

	override dispose(): void {
		this.saveParticipants.splice(0, this.saveParticipants.length);

		super.dispose();
	}
}
