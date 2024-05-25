/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { IListView } from "vs/base/browser/ui/list/listView";
import type { Event } from "vs/base/common/event";
import type { IDisposable } from "vs/base/common/lifecycle";
import type { ScrollEvent } from "vs/base/common/scrollable";
import type { IConfigurationService } from "vs/platform/configuration/common/configuration";
import {
	CellFocusMode,
	type ICellViewModel,
} from "vs/workbench/contrib/notebook/browser/notebookBrowser";
import type { CodeCellViewModel } from "vs/workbench/contrib/notebook/browser/viewModel/codeCellViewModel";
import type { CellViewModel } from "vs/workbench/contrib/notebook/browser/viewModel/notebookViewModelImpl";
import {
	CellKind,
	NotebookCellExecutionState,
	NotebookSetting,
} from "vs/workbench/contrib/notebook/common/notebookCommon";
import type { INotebookExecutionStateService } from "vs/workbench/contrib/notebook/common/notebookExecutionStateService";

export class NotebookCellAnchor implements IDisposable {
	private stopAnchoring = false;
	private executionWatcher: IDisposable | undefined;
	private scrollWatcher: IDisposable | undefined;

	constructor(
		private readonly notebookExecutionStateService: INotebookExecutionStateService,
		private readonly configurationService: IConfigurationService,
		private readonly scrollEvent: Event<ScrollEvent>,
	) {}

	public shouldAnchor(
		cellListView: IListView<CellViewModel>,
		focusedIndex: number,
		heightDelta: number,
		executingCellUri: ICellViewModel,
	) {
		if (
			cellListView.element(focusedIndex).focusMode ===
			CellFocusMode.Editor
		) {
			return true;
		}
		if (this.stopAnchoring) {
			return false;
		}

		const newFocusBottom =
			cellListView.elementTop(focusedIndex) +
			cellListView.elementHeight(focusedIndex) +
			heightDelta;
		const viewBottom =
			cellListView.renderHeight + cellListView.getScrollTop();
		const focusStillVisible = viewBottom > newFocusBottom;
		const allowScrolling =
			this.configurationService.getValue(
				NotebookSetting.scrollToRevealCell,
			) !== "none";
		const growing = heightDelta > 0;
		const autoAnchor = allowScrolling && growing && !focusStillVisible;

		if (autoAnchor) {
			this.watchAchorDuringExecution(executingCellUri);
			return true;
		}

		return false;
	}

	public watchAchorDuringExecution(executingCell: ICellViewModel) {
		// anchor while the cell is executing unless the user scrolls up.
		if (
			!this.executionWatcher &&
			executingCell.cellKind === CellKind.Code
		) {
			const executionState =
				this.notebookExecutionStateService.getCellExecution(
					executingCell.uri,
				);
			if (
				executionState &&
				executionState.state === NotebookCellExecutionState.Executing
			) {
				this.executionWatcher = (
					executingCell as CodeCellViewModel
				).onDidStopExecution(() => {
					this.executionWatcher?.dispose();
					this.executionWatcher = undefined;
					this.scrollWatcher?.dispose();
					this.stopAnchoring = false;
				});
				this.scrollWatcher = this.scrollEvent((scrollEvent) => {
					if (scrollEvent.scrollTop < scrollEvent.oldScrollTop) {
						this.stopAnchoring = true;
						this.scrollWatcher?.dispose();
					}
				});
			}
		}
	}

	dispose(): void {
		this.executionWatcher?.dispose();
		this.scrollWatcher?.dispose();
	}
}
