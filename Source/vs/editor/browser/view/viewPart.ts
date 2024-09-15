/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { FastDomNode } from "../../../base/browser/fastDomNode.js";
import { ViewEventHandler } from "../../common/viewEventHandler.js";
import type { ViewContext } from "../../common/viewModel/viewContext.js";
import type {
	RenderingContext,
	RestrictedRenderingContext,
} from "./renderingContext.js";

export abstract class ViewPart extends ViewEventHandler {
	_context: ViewContext;

	constructor(context: ViewContext) {
		super();
		this._context = context;
		this._context.addEventHandler(this);
	}

	public override dispose(): void {
		this._context.removeEventHandler(this);
		super.dispose();
	}

	public abstract prepareRender(ctx: RenderingContext): void;
	public abstract render(ctx: RestrictedRenderingContext): void;
}

export enum PartFingerprint {
	None = 0,
	ContentWidgets = 1,
	OverflowingContentWidgets = 2,
	OverflowGuard = 3,
	OverlayWidgets = 4,
	OverflowingOverlayWidgets = 5,
	ScrollableElement = 6,
	TextArea = 7,
	ViewLines = 8,
	Minimap = 9,
}

export class PartFingerprints {
	public static write(
		target: Element | FastDomNode<HTMLElement>,
		partId: PartFingerprint,
	) {
		target.setAttribute("data-mprt", String(partId));
	}

	public static read(target: Element): PartFingerprint {
		const r = target.getAttribute("data-mprt");
		if (r === null) {
			return PartFingerprint.None;
		}
		return Number.parseInt(r, 10);
	}

	public static collect(child: Element | null, stopAt: Element): Uint8Array {
		const result: PartFingerprint[] = [];
		let resultLen = 0;

		while (child && child !== child.ownerDocument.body) {
			if (child === stopAt) {
				break;
			}
			if (child.nodeType === child.ELEMENT_NODE) {
				result[resultLen++] = this.read(child);
			}
			child = child.parentElement;
		}

		const r = new Uint8Array(resultLen);
		for (let i = 0; i < resultLen; i++) {
			r[i] = result[resultLen - i - 1];
		}
		return r;
	}
}
