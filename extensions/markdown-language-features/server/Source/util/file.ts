/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { TextDocument } from "vscode-languageserver-textdocument";
import { type URI, Utils } from "vscode-uri";
import type { LsConfiguration } from "../config";

export function looksLikeMarkdownPath(
	config: LsConfiguration,
	resolvedHrefPath: URI,
) {
	return config.markdownFileExtensions.includes(
		Utils.extname(resolvedHrefPath).toLowerCase().replace(".", ""),
	);
}

export function isMarkdownFile(document: TextDocument) {
	return document.languageId === "markdown";
}
