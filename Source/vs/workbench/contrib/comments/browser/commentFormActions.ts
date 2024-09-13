/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Button } from "../../../../base/browser/ui/button/button.js";
import type { IAction } from "../../../../base/common/actions.js";
import {
	DisposableStore,
	type IDisposable,
} from "../../../../base/common/lifecycle.js";
import type { IMenu } from "../../../../platform/actions/common/actions.js";
import type { IContextKeyService } from "../../../../platform/contextkey/common/contextkey.js";
import type { IKeybindingService } from "../../../../platform/keybinding/common/keybinding.js";
import { defaultButtonStyles } from "../../../../platform/theme/browser/defaultStyles.js";
import { CommentCommandId } from "../common/commentCommandIds.js";

export class CommentFormActions implements IDisposable {
	private _buttonElements: HTMLElement[] = [];
	private readonly _toDispose = new DisposableStore();
	private _actions: IAction[] = [];

	constructor(
		private readonly keybindingService: IKeybindingService,
		private readonly contextKeyService: IContextKeyService,
		private container: HTMLElement,
		private actionHandler: (action: IAction) => void,
		private readonly maxActions?: number,
	) {}

	setActions(menu: IMenu, hasOnlySecondaryActions = false) {
		this._toDispose.clear();

		this._buttonElements.forEach((b) => b.remove());
		this._buttonElements = [];

		const groups = menu.getActions({ shouldForwardArgs: true });
		let isPrimary = !hasOnlySecondaryActions;
		for (const group of groups) {
			const [, actions] = group;

			this._actions = actions;
			for (const action of actions) {
				let keybinding = this.keybindingService
					.lookupKeybinding(action.id, this.contextKeyService)
					?.getLabel();
				if (!keybinding && isPrimary) {
					keybinding = this.keybindingService
						.lookupKeybinding(
							CommentCommandId.Submit,
							this.contextKeyService,
						)
						?.getLabel();
				}
				const title = keybinding
					? `${action.label} (${keybinding})`
					: action.label;
				const button = new Button(this.container, {
					secondary: !isPrimary,
					title,
					...defaultButtonStyles,
				});

				isPrimary = false;
				this._buttonElements.push(button.element);

				this._toDispose.add(button);
				this._toDispose.add(
					button.onDidClick(() => this.actionHandler(action)),
				);

				button.enabled = action.enabled;
				button.label = action.label;
				if (
					this.maxActions !== undefined &&
					this._buttonElements.length >= this.maxActions
				) {
					console.warn(
						`An extension has contributed more than the allowable number of actions to a comments menu.`,
					);
					return;
				}
			}
		}
	}

	triggerDefaultAction() {
		if (this._actions.length) {
			const lastAction = this._actions[0];

			if (lastAction.enabled) {
				return this.actionHandler(lastAction);
			}
		}
	}

	dispose() {
		this._toDispose.dispose();
	}
}
