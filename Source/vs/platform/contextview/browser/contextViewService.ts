/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { getWindow } from "../../../base/browser/dom.js";
import {
	ContextView,
	ContextViewDOMPosition,
	type IContextViewProvider,
} from "../../../base/browser/ui/contextview/contextview.js";
import { Disposable } from "../../../base/common/lifecycle.js";
import { ILayoutService } from "../../layout/browser/layoutService.js";
import type {
	IContextViewDelegate,
	IContextViewService,
	IOpenContextView,
} from "./contextView.js";

export class ContextViewHandler
	extends Disposable
	implements IContextViewProvider
{
	private openContextView: IOpenContextView | undefined;
	protected readonly contextView = this._register(
		new ContextView(
			this.layoutService.mainContainer,
			ContextViewDOMPosition.ABSOLUTE,
		),
	);

	constructor(
		@ILayoutService private readonly layoutService: ILayoutService,
	) {
		super();

		this.layout();
		this._register(layoutService.onDidLayoutContainer(() => this.layout()));
	}

	// ContextView

	showContextView(
		delegate: IContextViewDelegate,
		container?: HTMLElement,
		shadowRoot?: boolean,
	): IOpenContextView {
		let domPosition: ContextViewDOMPosition;
		if (container) {
			if (
				container ===
				this.layoutService.getContainer(getWindow(container))
			) {
				domPosition = ContextViewDOMPosition.ABSOLUTE;
			} else if (shadowRoot) {
				domPosition = ContextViewDOMPosition.FIXED_SHADOW;
			} else {
				domPosition = ContextViewDOMPosition.FIXED;
			}
		} else {
			domPosition = ContextViewDOMPosition.ABSOLUTE;
		}

		this.contextView.setContainer(
			container ?? this.layoutService.activeContainer,
			domPosition,
		);

		this.contextView.show(delegate);

		const openContextView: IOpenContextView = {
			close: () => {
				if (this.openContextView === openContextView) {
					this.hideContextView();
				}
			},
		};

		this.openContextView = openContextView;
		return openContextView;
	}

	layout(): void {
		this.contextView.layout();
	}

	hideContextView(data?: any): void {
		this.contextView.hide(data);
		this.openContextView = undefined;
	}
}

export class ContextViewService
	extends ContextViewHandler
	implements IContextViewService
{
	declare readonly _serviceBrand: undefined;

	getContextViewElement(): HTMLElement {
		return this.contextView.getViewElement();
	}
}
