/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IEditorContribution } from "../../common/editorCommon.js";
import { IMarkerDecorationsService } from "../../common/services/markerDecorations.js";
import { ICodeEditor } from "../editorBrowser.js";
import {
	EditorContributionInstantiation,
	registerEditorContribution,
} from "../editorExtensions.js";

export class MarkerDecorationsContribution implements IEditorContribution {
	public static readonly ID: string = "editor.contrib.markerDecorations";

	constructor(
		_editor: ICodeEditor,
		@IMarkerDecorationsService
		_markerDecorationsService: IMarkerDecorationsService,
	) {
		// Doesn't do anything, just requires `IMarkerDecorationsService` to make sure it gets instantiated
	}

	dispose(): void {}
}
registerEditorContribution(
	MarkerDecorationsContribution.ID,
	MarkerDecorationsContribution,
	EditorContributionInstantiation.Eager,
); // eager because it instantiates IMarkerDecorationsService which is responsible for rendering squiggles
