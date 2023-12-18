/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { QuickHelpNLS } from "vs/editor/common/standaloneStrings";
import { HelpQuickAccessProvider } from "vs/platform/quickinput/browser/helpQuickAccess";
import {
	Extensions,
	IQuickAccessRegistry,
} from "vs/platform/quickinput/common/quickAccess";
import { Registry } from "vs/platform/registry/common/platform";

Registry.as<IQuickAccessRegistry>(
	Extensions.Quickaccess,
).registerQuickAccessProvider({
	ctor: HelpQuickAccessProvider,
	prefix: "",
	helpEntries: [{ description: QuickHelpNLS.helpQuickAccessActionLabel }],
});
