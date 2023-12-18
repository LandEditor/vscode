/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { registerAction2 } from "vs/platform/actions/common/actions";
import {
	InlineVoiceChatAction,
	QuickVoiceChatAction,
	StartVoiceChatAction,
	StopListeningAction,
	StopListeningAndSubmitAction,
	StopListeningInChatEditorAction,
	StopListeningInChatViewAction,
	StopListeningInInlineChatAction,
	StopListeningInQuickChatAction,
	VoiceChatInChatViewAction,
} from "vs/workbench/contrib/chat/electron-sandbox/actions/voiceChatActions";

registerAction2(StartVoiceChatAction);

registerAction2(VoiceChatInChatViewAction);
registerAction2(QuickVoiceChatAction);
registerAction2(InlineVoiceChatAction);

registerAction2(StopListeningAction);
registerAction2(StopListeningAndSubmitAction);

registerAction2(StopListeningInChatViewAction);
registerAction2(StopListeningInChatEditorAction);
registerAction2(StopListeningInQuickChatAction);
registerAction2(StopListeningInInlineChatAction);
