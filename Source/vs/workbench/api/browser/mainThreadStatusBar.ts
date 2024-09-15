/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { IMarkdownString } from "../../../base/common/htmlContent.js";
import {
	DisposableStore,
	toDisposable,
} from "../../../base/common/lifecycle.js";
import type { ThemeColor } from "../../../base/common/themables.js";
import type { Command } from "../../../editor/common/languages.js";
import type { IAccessibilityInformation } from "../../../platform/accessibility/common/accessibility.js";
import {
	extHostNamedCustomer,
	type IExtHostContext,
} from "../../services/extensions/common/extHostCustomers.js";
import {
	StatusbarAlignment,
	type IStatusbarEntry,
} from "../../services/statusbar/browser/statusbar.js";
import {
	ExtHostContext,
	MainContext,
	type MainThreadStatusBarShape,
	type StatusBarItemDto,
} from "../common/extHost.protocol.js";
import {
	IExtensionStatusBarItemService,
	StatusBarUpdateKind,
} from "./statusBarExtensionPoint.js";

@extHostNamedCustomer(MainContext.MainThreadStatusBar)
export class MainThreadStatusBar implements MainThreadStatusBarShape {
	private readonly _store = new DisposableStore();

	constructor(
		extHostContext: IExtHostContext,
		@IExtensionStatusBarItemService
		private readonly statusbarService: IExtensionStatusBarItemService,
	) {
		const proxy = extHostContext.getProxy(ExtHostContext.ExtHostStatusBar);

		// once, at startup read existing items and send them over
		const entries: StatusBarItemDto[] = [];
		for (const [entryId, item] of statusbarService.getEntries()) {
			entries.push(asDto(entryId, item));
		}

		proxy.$acceptStaticEntries(entries);

		this._store.add(
			statusbarService.onDidChange((e) => {
				if (e.added) {
					proxy.$acceptStaticEntries([asDto(e.added[0], e.added[1])]);
				}
			}),
		);

		function asDto(
			entryId: string,
			item: {
				entry: IStatusbarEntry;
				alignment: StatusbarAlignment;
				priority: number;
			},
		): StatusBarItemDto {
			return {
				entryId,
				name: item.entry.name,
				text: item.entry.text,
				tooltip: item.entry.tooltip as string | undefined,
				command:
					typeof item.entry.command === "string"
						? item.entry.command
						: typeof item.entry.command === "object"
							? item.entry.command.id
							: undefined,
				priority: item.priority,
				alignLeft: item.alignment === StatusbarAlignment.LEFT,
				accessibilityInformation: item.entry.ariaLabel
					? { label: item.entry.ariaLabel, role: item.entry.role }
					: undefined,
			};
		}
	}

	dispose(): void {
		this._store.dispose();
	}

	$setEntry(
		entryId: string,
		id: string,
		extensionId: string | undefined,
		name: string,
		text: string,
		tooltip: IMarkdownString | string | undefined,
		command: Command | undefined,
		color: string | ThemeColor | undefined,
		backgroundColor: ThemeColor | undefined,
		alignLeft: boolean,
		priority: number | undefined,
		accessibilityInformation: IAccessibilityInformation | undefined,
	): void {
		const kind = this.statusbarService.setOrUpdateEntry(
			entryId,
			id,
			extensionId,
			name,
			text,
			tooltip,
			command,
			color,
			backgroundColor,
			alignLeft,
			priority,
			accessibilityInformation,
		);
		if (kind === StatusBarUpdateKind.DidDefine) {
			this._store.add(
				toDisposable(() => this.statusbarService.unsetEntry(entryId)),
			);
		}
	}

	$disposeEntry(entryId: string) {
		this.statusbarService.unsetEntry(entryId);
	}
}
