import type { CancellationToken } from "vs/base/common/cancellation";
import type { Event } from "vs/base/common/event";
import type { IDisposable } from "vs/base/common/lifecycle";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import type { URI } from "vs/base/common/uri";
import type {
	IActiveCodeEditor,
	ICodeEditor,
} from "vs/editor/browser/editorBrowser";
import type { IRange } from "vs/editor/common/core/range";
import type { IValidEditOperation } from "vs/editor/common/model";
import { createDecorator } from "vs/platform/instantiation/common/instantiation";
import type {
	EditMode,
	IInlineChatResponse,
	IInlineChatSession,
} from "vs/workbench/contrib/inlineChat/common/inlineChat";
import type { Session, StashedSession } from "./inlineChatSession";

export type Recording = {
	when: Date;
	session: IInlineChatSession;
	exchanges: { prompt: string; res: IInlineChatResponse }[];
};

export interface ISessionKeyComputer {
	getComparisonKey(editor: ICodeEditor, uri: URI): string;
}

export const IInlineChatSessionService =
	createDecorator<IInlineChatSessionService>("IInlineChatSessionService");

export interface IInlineChatSessionEvent {
	readonly editor: ICodeEditor;
	readonly session: Session;
}

export interface IInlineChatSessionEndEvent extends IInlineChatSessionEvent {
	readonly endedByExternalCause: boolean;
}

export interface IInlineChatSessionService {
	_serviceBrand: undefined;

	onWillStartSession: Event<IActiveCodeEditor>;
	onDidMoveSession: Event<IInlineChatSessionEvent>;
	onDidStashSession: Event<IInlineChatSessionEvent>;
	onDidEndSession: Event<IInlineChatSessionEndEvent>;

	createSession(
		editor: IActiveCodeEditor,
		options: { editMode: EditMode; wholeRange?: IRange },
		token: CancellationToken,
	): Promise<Session | undefined>;

	moveSession(session: Session, newEditor: ICodeEditor): void;

	getCodeEditor(session: Session): ICodeEditor;

	getSession(editor: ICodeEditor, uri: URI): Session | undefined;

	releaseSession(session: Session): void;

	stashSession(
		session: Session,
		editor: ICodeEditor,
		undoCancelEdits: IValidEditOperation[],
	): StashedSession;

	registerSessionKeyComputer(
		scheme: string,
		value: ISessionKeyComputer,
	): IDisposable;

	//
	recordings(): readonly Recording[];

	dispose(): void;
}
