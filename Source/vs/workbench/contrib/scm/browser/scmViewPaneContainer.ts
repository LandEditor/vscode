/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import "vs/css!./media/scm";
import { localize } from "vs/nls";
import { IConfigurationService } from "vs/platform/configuration/common/configuration";
import { IContextMenuService } from "vs/platform/contextview/browser/contextView";
import { IInstantiationService } from "vs/platform/instantiation/common/instantiation";
import { IStorageService } from "vs/platform/storage/common/storage";
import { ITelemetryService } from "vs/platform/telemetry/common/telemetry";
import { IThemeService } from "vs/platform/theme/common/themeService";
import { IWorkspaceContextService } from "vs/platform/workspace/common/workspace";
import { ViewPaneContainer } from "vs/workbench/browser/parts/views/viewPaneContainer";
import { IViewDescriptorService } from "vs/workbench/common/views";
import {
	ISCMViewService,
	VIEWLET_ID,
} from "vs/workbench/contrib/scm/common/scm";
import { IExtensionService } from "vs/workbench/services/extensions/common/extensions";
import { IWorkbenchLayoutService } from "vs/workbench/services/layout/browser/layoutService";

export class SCMViewPaneContainer extends ViewPaneContainer {
	constructor(
		@ISCMViewService private readonly scmViewService: ISCMViewService,
		@IWorkbenchLayoutService layoutService: IWorkbenchLayoutService,
		@ITelemetryService telemetryService: ITelemetryService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IThemeService themeService: IThemeService,
		@IStorageService storageService: IStorageService,
		@IConfigurationService configurationService: IConfigurationService,
		@IExtensionService extensionService: IExtensionService,
		@IWorkspaceContextService contextService: IWorkspaceContextService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService
	) {
		super(
			VIEWLET_ID,
			{ mergeViewWithContainerWhenSingleView: true },
			instantiationService,
			configurationService,
			layoutService,
			contextMenuService,
			telemetryService,
			extensionService,
			themeService,
			storageService,
			contextService,
			viewDescriptorService
		);
	}

	override create(parent: HTMLElement): void {
		super.create(parent);
		parent.classList.add("scm-viewlet");
	}

	override getOptimalWidth(): number {
		return 400;
	}

	override getTitle(): string {
		return localize("source control", "Source Control");
	}

	override getActionsContext(): unknown {
		return this.scmViewService.visibleRepositories.length === 1
			? this.scmViewService.visibleRepositories[0].provider
			: undefined;
	}
}
