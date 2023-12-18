/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Dimension } from "vs/base/browser/dom";
import { ActionsOrientation } from "vs/base/browser/ui/actionbar/actionbar";
import { HoverPosition } from "vs/base/browser/ui/hover/hoverWidget";
import {
	IAction,
	Separator,
	SubmenuAction,
	toAction,
} from "vs/base/common/actions";
import { assertIsDefined } from "vs/base/common/types";
import "vs/css!./media/panelpart";
import { localize } from "vs/nls";
import { createAndFillInContextMenuActions } from "vs/platform/actions/browser/menuEntryActionViewItem";
import { IMenuService, MenuId } from "vs/platform/actions/common/actions";
import { ICommandService } from "vs/platform/commands/common/commands";
import { IContextKeyService } from "vs/platform/contextkey/common/contextkey";
import { IContextMenuService } from "vs/platform/contextview/browser/contextView";
import { IInstantiationService } from "vs/platform/instantiation/common/instantiation";
import { IKeybindingService } from "vs/platform/keybinding/common/keybinding";
import { INotificationService } from "vs/platform/notification/common/notification";
import { IStorageService } from "vs/platform/storage/common/storage";
import {
	badgeBackground,
	badgeForeground,
	contrastBorder,
} from "vs/platform/theme/common/colorRegistry";
import { IThemeService } from "vs/platform/theme/common/themeService";
import { IPaneCompositeBarOptions } from "vs/workbench/browser/parts/paneCompositeBar";
import { AbstractPaneCompositePart } from "vs/workbench/browser/parts/paneCompositePart";
import { TogglePanelAction } from "vs/workbench/browser/parts/panel/panelActions";
import {
	ActivePanelContext,
	PanelFocusContext,
} from "vs/workbench/common/contextkeys";
import {
	PANEL_ACTIVE_TITLE_BORDER,
	PANEL_ACTIVE_TITLE_FOREGROUND,
	PANEL_BACKGROUND,
	PANEL_BORDER,
	PANEL_DRAG_AND_DROP_BORDER,
	PANEL_INACTIVE_TITLE_FOREGROUND,
} from "vs/workbench/common/theme";
import { IViewDescriptorService } from "vs/workbench/common/views";
import { IExtensionService } from "vs/workbench/services/extensions/common/extensions";
import {
	IWorkbenchLayoutService,
	Parts,
	Position,
} from "vs/workbench/services/layout/browser/layoutService";

export class PanelPart extends AbstractPaneCompositePart {
	//#region IView

	readonly minimumWidth: number = 300;
	readonly maximumWidth: number = Number.POSITIVE_INFINITY;
	readonly minimumHeight: number = 77;
	readonly maximumHeight: number = Number.POSITIVE_INFINITY;

	get preferredHeight(): number | undefined {
		// Don't worry about titlebar or statusbar visibility
		// The difference is minimal and keeps this function clean
		return this.layoutService.mainContainerDimension.height * 0.4;
	}

	get preferredWidth(): number | undefined {
		const activeComposite = this.getActivePaneComposite();

		if (!activeComposite) {
			return;
		}

		const width = activeComposite.getOptimalWidth();
		if (typeof width !== "number") {
			return;
		}

		return Math.max(width, 300);
	}

	//#endregion

	static readonly activePanelSettingsKey =
		"workbench.panelpart.activepanelid";

	constructor(
		@INotificationService notificationService: INotificationService,
		@IStorageService storageService: IStorageService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IWorkbenchLayoutService layoutService: IWorkbenchLayoutService,
		@IKeybindingService keybindingService: IKeybindingService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IThemeService themeService: IThemeService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IExtensionService extensionService: IExtensionService,
		@ICommandService private commandService: ICommandService,
		@IMenuService menuService: IMenuService
	) {
		super(
			Parts.PANEL_PART,
			{ hasTitle: true },
			PanelPart.activePanelSettingsKey,
			ActivePanelContext.bindTo(contextKeyService),
			PanelFocusContext.bindTo(contextKeyService),
			"panel",
			"panel",
			undefined,
			notificationService,
			storageService,
			contextMenuService,
			layoutService,
			keybindingService,
			instantiationService,
			themeService,
			viewDescriptorService,
			contextKeyService,
			extensionService,
			menuService
		);
	}

	override updateStyles(): void {
		super.updateStyles();

		const container = assertIsDefined(this.getContainer());
		container.style.backgroundColor = this.getColor(PANEL_BACKGROUND) || "";
		const borderColor =
			this.getColor(PANEL_BORDER) || this.getColor(contrastBorder) || "";
		container.style.borderLeftColor = borderColor;
		container.style.borderRightColor = borderColor;

		const title = this.getTitleArea();
		if (title) {
			title.style.borderTopColor =
				this.getColor(PANEL_BORDER) ||
				this.getColor(contrastBorder) ||
				"";
		}
	}

	protected getCompositeBarOptions(): IPaneCompositeBarOptions {
		return {
			partContainerClass: "panel",
			pinnedViewContainersKey: "workbench.panel.pinnedPanels",
			placeholderViewContainersKey: "workbench.panel.placeholderPanels",
			viewContainersWorkspaceStateKey:
				"workbench.panel.viewContainersWorkspaceState",
			icon: false,
			orientation: ActionsOrientation.HORIZONTAL,
			recomputeSizes: true,
			activityHoverOptions: {
				position: () =>
					this.layoutService.getPanelPosition() === Position.BOTTOM &&
					!this.layoutService.isPanelMaximized()
						? HoverPosition.ABOVE
						: HoverPosition.BELOW,
			},
			fillExtraContextMenuActions: (actions) =>
				this.fillExtraContextMenuActions(actions),
			compositeSize: 0,
			iconSize: 16,
			overflowActionSize: 44,
			colors: (theme) => ({
				activeBackgroundColor: theme.getColor(PANEL_BACKGROUND), // Background color for overflow action
				inactiveBackgroundColor: theme.getColor(PANEL_BACKGROUND), // Background color for overflow action
				activeBorderBottomColor: theme.getColor(
					PANEL_ACTIVE_TITLE_BORDER,
				),
				activeForegroundColor: theme.getColor(
					PANEL_ACTIVE_TITLE_FOREGROUND,
				),
				inactiveForegroundColor: theme.getColor(
					PANEL_INACTIVE_TITLE_FOREGROUND,
				),
				badgeBackground: theme.getColor(badgeBackground),
				badgeForeground: theme.getColor(badgeForeground),
				dragAndDropBorder: theme.getColor(PANEL_DRAG_AND_DROP_BORDER),
			}),
		};
	}

	private fillExtraContextMenuActions(actions: IAction[]): void {
		const panelPositionMenu = this.menuService.createMenu(
			MenuId.PanelPositionMenu,
			this.contextKeyService,
		);
		const panelAlignMenu = this.menuService.createMenu(
			MenuId.PanelAlignmentMenu,
			this.contextKeyService,
		);
		const positionActions: IAction[] = [];
		const alignActions: IAction[] = [];
		createAndFillInContextMenuActions(
			panelPositionMenu,
			{ shouldForwardArgs: true },
			{ primary: [], secondary: positionActions },
		);
		createAndFillInContextMenuActions(
			panelAlignMenu,
			{ shouldForwardArgs: true },
			{ primary: [], secondary: alignActions },
		);
		panelAlignMenu.dispose();
		panelPositionMenu.dispose();

		actions.push(
			...[
				new Separator(),
				new SubmenuAction(
					"workbench.action.panel.position",
					localize("panel position", "Panel Position"),
					positionActions,
				),
				new SubmenuAction(
					"workbench.action.panel.align",
					localize("align panel", "Align Panel"),
					alignActions,
				),
				toAction({
					id: TogglePanelAction.ID,
					label: localize("hidePanel", "Hide Panel"),
					run: () =>
						this.commandService.executeCommand(
							TogglePanelAction.ID,
						),
				}),
			],
		);
	}

	override layout(
		width: number,
		height: number,
		top: number,
		left: number,
	): void {
		let dimensions: Dimension;
		if (this.layoutService.getPanelPosition() === Position.RIGHT) {
			dimensions = new Dimension(width - 1, height); // Take into account the 1px border when layouting
		} else {
			dimensions = new Dimension(width, height);
		}

		// Layout contents
		super.layout(dimensions.width, dimensions.height, top, left);
	}

	protected shouldShowCompositeBar(): boolean {
		return true;
	}

	toJSON(): object {
		return {
			type: Parts.PANEL_PART,
		};
	}
}
