/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Action } from "../../../../base/common/actions.js";
import type { ExtensionIdentifier } from "../../../../platform/extensions/common/extensions.js";
import type { IExtensionHostProfile } from "../../../services/extensions/common/extensions.js";
import { ReportExtensionIssueAction } from "../common/reportExtensionIssueAction.js";
import {
	AbstractRuntimeExtensionsEditor,
	type IRuntimeExtension,
} from "./abstractRuntimeExtensionsEditor.js";

export class RuntimeExtensionsEditor extends AbstractRuntimeExtensionsEditor {
	protected _getProfileInfo(): IExtensionHostProfile | null {
		return null;
	}

	protected _getUnresponsiveProfile(
		extensionId: ExtensionIdentifier,
	): IExtensionHostProfile | undefined {
		return undefined;
	}

	protected _createSlowExtensionAction(
		element: IRuntimeExtension,
	): Action | null {
		return null;
	}

	protected _createReportExtensionIssueAction(
		element: IRuntimeExtension,
	): Action | null {
		if (element.marketplaceInfo) {
			return this._instantiationService.createInstance(
				ReportExtensionIssueAction,
				element.description,
			);
		}
		return null;
	}
}
