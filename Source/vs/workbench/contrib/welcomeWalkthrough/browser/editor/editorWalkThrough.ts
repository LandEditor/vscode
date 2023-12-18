/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FileAccess, Schemas } from "vs/base/common/network";
import { localize } from "vs/nls";
import { Categories } from "vs/platform/action/common/actionCommonCategories";
import { Action2 } from "vs/platform/actions/common/actions";
import {
	IInstantiationService,
	ServicesAccessor,
} from "vs/platform/instantiation/common/instantiation";
import { IEditorSerializer } from "vs/workbench/common/editor";
import { EditorInput } from "vs/workbench/common/editor/editorInput";
import "vs/workbench/contrib/welcomeWalkthrough/browser/editor/vs_code_editor_walkthrough";
import {
	WalkThroughInput,
	WalkThroughInputOptions,
} from "vs/workbench/contrib/welcomeWalkthrough/browser/walkThroughInput";
import { IEditorService } from "vs/workbench/services/editor/common/editorService";

const typeId = "workbench.editors.walkThroughInput";
const inputOptions: WalkThroughInputOptions = {
	typeId,
	name: localize("editorWalkThrough.title", "Editor Playground"),
	resource: FileAccess.asBrowserUri(
		"vs/workbench/contrib/welcomeWalkthrough/browser/editor/vs_code_editor_walkthrough.md",
	).with({
		scheme: Schemas.walkThrough,
		query: JSON.stringify({
			moduleId:
				"vs/workbench/contrib/welcomeWalkthrough/browser/editor/vs_code_editor_walkthrough",
		}),
	}),
	telemetryFrom: "walkThrough",
};

export class EditorWalkThroughAction extends Action2 {
	public static readonly ID = "workbench.action.showInteractivePlayground";
	public static readonly LABEL = {
		value: localize("editorWalkThrough", "Interactive Editor Playground"),
		original: "Interactive Editor Playground",
	};

	constructor() {
		super({
			id: EditorWalkThroughAction.ID,
			title: EditorWalkThroughAction.LABEL,
			category: Categories.Help,
			f1: true,
		});
	}

	public override run(serviceAccessor: ServicesAccessor): Promise<void> {
		const editorService = serviceAccessor.get(IEditorService);
		const instantiationService = serviceAccessor.get(IInstantiationService);
		const input = instantiationService.createInstance(
			WalkThroughInput,
			inputOptions,
		);
		// TODO @lramos15 adopt the resolver here
		return editorService
			.openEditor(input, { pinned: true })
			.then(() => void 0);
	}
}

export class EditorWalkThroughInputSerializer implements IEditorSerializer {
	static readonly ID = typeId;

	public canSerialize(editorInput: EditorInput): boolean {
		return true;
	}

	public serialize(editorInput: EditorInput): string {
		return "";
	}

	public deserialize(
		instantiationService: IInstantiationService,
	): WalkThroughInput {
		return instantiationService.createInstance(
			WalkThroughInput,
			inputOptions,
		);
	}
}
