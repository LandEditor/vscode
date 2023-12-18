/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IInstantiationService } from "vs/platform/instantiation/common/instantiation";
import { Registry } from "vs/platform/registry/common/platform";
import {
	Extensions as WorkbenchExtensions,
	IWorkbenchContribution,
	IWorkbenchContributionsRegistry,
} from "vs/workbench/common/contributions";
import { LifecyclePhase } from "vs/workbench/services/lifecycle/common/lifecycle";

import { StatusBarItemsExtensionPoint } from "vs/workbench/api/browser/statusBarExtensionPoint";
// --- other interested parties
import { JSONValidationExtensionPoint } from "vs/workbench/api/common/jsonValidationExtensionPoint";
import { LanguageConfigurationFileHandler } from "vs/workbench/contrib/codeEditor/browser/languageConfigurationExtensionPoint";
import { ColorExtensionPoint } from "vs/workbench/services/themes/common/colorExtensionPoint";
import { IconExtensionPoint } from "vs/workbench/services/themes/common/iconExtensionPoint";
import { TokenClassificationExtensionPoints } from "vs/workbench/services/themes/common/tokenClassificationExtensionPoint";

import "./mainThreadAiEmbeddingVector";
import "./mainThreadAiRelatedInformation";
import "./mainThreadAuthentication";
import "./mainThreadBulkEdits";
import "./mainThreadCLICommands";
import "./mainThreadChat";
import "./mainThreadChatAgents2";
import "./mainThreadChatProvider";
import "./mainThreadChatVariables";
import "./mainThreadClipboard";
import "./mainThreadCodeInsets";
import "./mainThreadCommands";
import "./mainThreadComments";
import "./mainThreadConfiguration";
import "./mainThreadConsole";
import "./mainThreadDebugService";
import "./mainThreadDecorations";
import "./mainThreadDiagnostics";
import "./mainThreadDialogs";
import "./mainThreadDocumentContentProviders";
import "./mainThreadDocuments";
import "./mainThreadDocumentsAndEditors";
import "./mainThreadDownloadService";
import "./mainThreadEditSessionIdentityParticipant";
import "./mainThreadEditor";
import "./mainThreadEditorTabs";
import "./mainThreadEditors";
import "./mainThreadErrors";
import "./mainThreadExtensionService";
import "./mainThreadFileSystem";
import "./mainThreadFileSystemEventService";
import "./mainThreadInlineChat";
import "./mainThreadInteractive";
import "./mainThreadIssueReporter";
import "./mainThreadLabelService";
import "./mainThreadLanguageFeatures";
import "./mainThreadLanguages";
// --- mainThread participants
import "./mainThreadLocalization";
import "./mainThreadLogService";
import "./mainThreadManagedSockets";
import "./mainThreadMessageService";
import "./mainThreadNotebook";
import "./mainThreadNotebookDocumentsAndEditors";
import "./mainThreadNotebookKernels";
import "./mainThreadNotebookRenderers";
import "./mainThreadNotebookSaveParticipant";
import "./mainThreadOutputService";
import "./mainThreadProfilContentHandlers";
import "./mainThreadProgress";
import "./mainThreadQuickDiff";
import "./mainThreadQuickOpen";
import "./mainThreadRemoteConnectionData";
import "./mainThreadSCM";
import "./mainThreadSaveParticipant";
import "./mainThreadSearch";
import "./mainThreadSecretState";
import "./mainThreadShare";
import "./mainThreadSpeech";
import "./mainThreadStatusBar";
import "./mainThreadStorage";
import "./mainThreadTask";
import "./mainThreadTelemetry";
import "./mainThreadTerminalService";
import "./mainThreadTesting";
import "./mainThreadTheming";
import "./mainThreadTimeline";
import "./mainThreadTreeViews";
import "./mainThreadTunnelService";
import "./mainThreadUriOpeners";
import "./mainThreadUrls";
import "./mainThreadWebviewManager";
import "./mainThreadWindow";
import "./mainThreadWorkspace";

export class ExtensionPoints implements IWorkbenchContribution {
	constructor(
		@IInstantiationService
		private readonly instantiationService: IInstantiationService
	) {
		// Classes that handle extension points...
		this.instantiationService.createInstance(JSONValidationExtensionPoint);
		this.instantiationService.createInstance(ColorExtensionPoint);
		this.instantiationService.createInstance(IconExtensionPoint);
		this.instantiationService.createInstance(
			TokenClassificationExtensionPoints
		);
		this.instantiationService.createInstance(
			LanguageConfigurationFileHandler
		);
		this.instantiationService.createInstance(StatusBarItemsExtensionPoint);
	}
}

Registry.as<IWorkbenchContributionsRegistry>(
	WorkbenchExtensions.Workbench,
).registerWorkbenchContribution(ExtensionPoints, LifecyclePhase.Starting);
