/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Codicon } from "../../../../base/common/codicons.js";
import { Disposable } from "../../../../base/common/lifecycle.js";
import { localize } from "../../../../nls.js";
import { IClipboardService } from "../../../../platform/clipboard/common/clipboardService.js";
import {
	IExtensionService,
	isProposedApiEnabled,
} from "../../../services/extensions/common/extensions.js";
import { IChatRequestVariableEntry } from "../common/chatModel.js";
import { ChatInputPart } from "./chatInputPart.js";

export class ChatImageDropAndPaste extends Disposable {
	constructor(
		private readonly inputPart: ChatInputPart,
		@IClipboardService private readonly clipboardService: IClipboardService,
		@IExtensionService private readonly extensionService: IExtensionService,
	) {
		super();

		this._register(
			this.inputPart.inputEditor.onDidPaste((e) => {
				if (
					this.extensionService.extensions.some((ext) =>
						isProposedApiEnabled(ext, "chatReferenceBinaryData"),
					)
				) {
					this._handlePaste();
				}
			}),
		);
	}

	private async _handlePaste(): Promise<void> {
		const currClipboard = await this.clipboardService.readImage();

		if (!currClipboard || !isImage(currClipboard)) {
			return;
		}

		const context = await getImageAttachContext(currClipboard);

		if (!context) {
			return;
		}

		this.inputPart.attachmentModel.addContext(context);
	}
}

async function getImageAttachContext(
	data: Uint8Array,
): Promise<IChatRequestVariableEntry> {
	return {
		value: data,
		id: await imageToHash(data),
		name: localize("pastedImage", "Pasted Image"),
		isImage: true,
		icon: Codicon.fileMedia,
		isDynamic: true,
	};
}

export async function imageToHash(data: Uint8Array): Promise<string> {
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);

	const hashArray = Array.from(new Uint8Array(hashBuffer));

	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function isImage(array: Uint8Array): boolean {
	if (array.length < 4) {
		return false;
	}

	// Magic numbers (identification bytes) for various image formats
	const identifier: { [key: string]: number[] } = {
		png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
		jpeg: [0xff, 0xd8, 0xff],
		bmp: [0x42, 0x4d],
		gif: [0x47, 0x49, 0x46, 0x38],
		tiff: [0x49, 0x49, 0x2a, 0x00],
	};

	return Object.values(identifier).some((signature) =>
		signature.every((byte, index) => array[index] === byte),
	);
}
