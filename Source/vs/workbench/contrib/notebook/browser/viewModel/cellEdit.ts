/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { URI } from "vs/base/common/uri";
import type { Range } from "vs/editor/common/core/range";
import type { Selection } from "vs/editor/common/core/selection";
import {
	type IResourceUndoRedoElement,
	UndoRedoElementType,
} from "vs/platform/undoRedo/common/undoRedo";
import { CellFocusMode } from "vs/workbench/contrib/notebook/browser/notebookBrowser";
import type { BaseCellViewModel } from "vs/workbench/contrib/notebook/browser/viewModel/baseCellViewModel";
import type { ITextCellEditingDelegate } from "vs/workbench/contrib/notebook/common/model/cellEdit";
import type { NotebookCellTextModel } from "vs/workbench/contrib/notebook/common/model/notebookCellTextModel";
import {
	type CellKind,
	type IOutputDto,
	type NotebookCellMetadata,
	SelectionStateType,
} from "vs/workbench/contrib/notebook/common/notebookCommon";

export interface IViewCellEditingDelegate extends ITextCellEditingDelegate {
	createCellViewModel?(cell: NotebookCellTextModel): BaseCellViewModel;
	createCell?(
		index: number,
		source: string,
		language: string,
		type: CellKind,
		metadata: NotebookCellMetadata | undefined,
		outputs: IOutputDto[],
	): BaseCellViewModel;
}

export class JoinCellEdit implements IResourceUndoRedoElement {
	type: UndoRedoElementType.Resource = UndoRedoElementType.Resource;
	label = "Join Cell";
	code = "undoredo.textBufferEdit";
	private _deletedRawCell: NotebookCellTextModel;
	constructor(
		public resource: URI,
		private index: number,
		private direction: "above" | "below",
		private cell: BaseCellViewModel,
		private selections: Selection[],
		private inverseRange: Range,
		private insertContent: string,
		private removedCell: BaseCellViewModel,
		private editingDelegate: IViewCellEditingDelegate,
	) {
		this._deletedRawCell = this.removedCell.model;
	}

	async undo(): Promise<void> {
		if (
			!this.editingDelegate.insertCell ||
			!this.editingDelegate.createCellViewModel
		) {
			throw new Error(
				"Notebook Insert Cell not implemented for Undo/Redo",
			);
		}

		await this.cell.resolveTextModel();

		this.cell.textModel?.applyEdits([
			{ range: this.inverseRange, text: "" },
		]);

		this.cell.setSelections(this.selections);

		const cell = this.editingDelegate.createCellViewModel(
			this._deletedRawCell,
		);
		if (this.direction === "above") {
			this.editingDelegate.insertCell(this.index, this._deletedRawCell, {
				kind: SelectionStateType.Handle,
				primary: cell.handle,
				selections: [cell.handle],
			});
			cell.focusMode = CellFocusMode.Editor;
		} else {
			this.editingDelegate.insertCell(this.index, cell.model, {
				kind: SelectionStateType.Handle,
				primary: this.cell.handle,
				selections: [this.cell.handle],
			});
			this.cell.focusMode = CellFocusMode.Editor;
		}
	}

	async redo(): Promise<void> {
		if (!this.editingDelegate.deleteCell) {
			throw new Error(
				"Notebook Delete Cell not implemented for Undo/Redo",
			);
		}

		await this.cell.resolveTextModel();
		this.cell.textModel?.applyEdits([
			{ range: this.inverseRange, text: this.insertContent },
		]);

		this.editingDelegate.deleteCell(this.index, {
			kind: SelectionStateType.Handle,
			primary: this.cell.handle,
			selections: [this.cell.handle],
		});
		this.cell.focusMode = CellFocusMode.Editor;
	}
}
