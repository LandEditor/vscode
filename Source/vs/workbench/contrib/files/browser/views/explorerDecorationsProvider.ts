/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { toErrorMessage } from "vs/base/common/errorMessage";
import { Emitter, Event } from "vs/base/common/event";
import { DisposableStore } from "vs/base/common/lifecycle";
import { URI } from "vs/base/common/uri";
import { localize } from "vs/nls";
import {
	listDeemphasizedForeground,
	listInvalidItemForeground,
} from "vs/platform/theme/common/colorRegistry";
import { IWorkspaceContextService } from "vs/platform/workspace/common/workspace";
import { IExplorerService } from "vs/workbench/contrib/files/browser/files";
import { explorerRootErrorEmitter } from "vs/workbench/contrib/files/browser/views/explorerViewer";
import { ExplorerItem } from "vs/workbench/contrib/files/common/explorerModel";
import {
	IDecorationData,
	IDecorationsProvider,
} from "vs/workbench/services/decorations/common/decorations";

export function provideDecorations(
	fileStat: ExplorerItem,
): IDecorationData | undefined {
	if (fileStat.isRoot && fileStat.error) {
		return {
			tooltip: localize(
				"canNotResolve",
				"Unable to resolve workspace folder ({0})",
				toErrorMessage(fileStat.error),
			),
			letter: "!",
			color: listInvalidItemForeground,
		};
	}
	if (fileStat.isSymbolicLink) {
		return {
			tooltip: localize("symbolicLlink", "Symbolic Link"),
			letter: "\u2937",
		};
	}
	if (fileStat.isUnknown) {
		return {
			tooltip: localize("unknown", "Unknown File Type"),
			letter: "?",
		};
	}
	if (fileStat.isExcluded) {
		return {
			color: listDeemphasizedForeground,
		};
	}

	return undefined;
}

export class ExplorerDecorationsProvider implements IDecorationsProvider {
	readonly label: string = localize("label", "Explorer");
	private readonly _onDidChange = new Emitter<URI[]>();
	private readonly toDispose = new DisposableStore();

	constructor(
		@IExplorerService private explorerService: IExplorerService,
		@IWorkspaceContextService contextService: IWorkspaceContextService
	) {
		this.toDispose.add(this._onDidChange);
		this.toDispose.add(
			contextService.onDidChangeWorkspaceFolders((e) => {
				this._onDidChange.fire(
					e.changed.concat(e.added).map((wf) => wf.uri)
				);
			})
		);
		this.toDispose.add(
			explorerRootErrorEmitter.event((resource) => {
				this._onDidChange.fire([resource]);
			})
		);
	}

	get onDidChange(): Event<URI[]> {
		return this._onDidChange.event;
	}

	async provideDecorations(
		resource: URI,
	): Promise<IDecorationData | undefined> {
		const fileStat = this.explorerService.findClosest(resource);
		if (!fileStat) {
			throw new Error("ExplorerItem not found");
		}

		return provideDecorations(fileStat);
	}

	dispose(): void {
		this.toDispose.dispose();
	}
}
