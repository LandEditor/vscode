/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationTokenSource } from "../../../../base/common/cancellation.js";
import { Codicon } from "../../../../base/common/codicons.js";
import { isCancellationError } from "../../../../base/common/errors.js";
import { Event } from "../../../../base/common/event.js";
import { KeyCode, KeyMod } from "../../../../base/common/keyCodes.js";
import { DisposableStore } from "../../../../base/common/lifecycle.js";
import type { ICodeEditor } from "../../../../editor/browser/editorBrowser.js";
import {
	EditorAction2,
	EditorContributionInstantiation,
	registerEditorContribution,
} from "../../../../editor/browser/editorExtensions.js";
import { ICodeEditorService } from "../../../../editor/browser/services/codeEditorService.js";
import type { IPosition } from "../../../../editor/common/core/position.js";
import { Range } from "../../../../editor/common/core/range.js";
import type { IEditorContribution } from "../../../../editor/common/editorCommon.js";
import { EditorContextKeys } from "../../../../editor/common/editorContextKeys.js";
import { PeekContext } from "../../../../editor/contrib/peekView/browser/peekView.js";
import { localize, localize2 } from "../../../../nls.js";
import {
	MenuId,
	registerAction2,
} from "../../../../platform/actions/common/actions.js";
import {
	ContextKeyExpr,
	IContextKeyService,
	RawContextKey,
	type IContextKey,
} from "../../../../platform/contextkey/common/contextkey.js";
import {
	IInstantiationService,
	type ServicesAccessor,
} from "../../../../platform/instantiation/common/instantiation.js";
import { KeybindingWeight } from "../../../../platform/keybinding/common/keybindingsRegistry.js";
import {
	IStorageService,
	StorageScope,
	StorageTarget,
} from "../../../../platform/storage/common/storage.js";
import { registerIcon } from "../../../../platform/theme/common/iconRegistry.js";
import {
	CallHierarchyDirection,
	CallHierarchyModel,
	CallHierarchyProviderRegistry,
} from "../common/callHierarchy.js";
import { CallHierarchyTreePeekWidget } from "./callHierarchyPeek.js";

const _ctxHasCallHierarchyProvider = new RawContextKey<boolean>(
	"editorHasCallHierarchyProvider",
	false,
	localize(
		"editorHasCallHierarchyProvider",
		"Whether a call hierarchy provider is available",
	),
);
const _ctxCallHierarchyVisible = new RawContextKey<boolean>(
	"callHierarchyVisible",
	false,
	localize(
		"callHierarchyVisible",
		"Whether call hierarchy peek is currently showing",
	),
);
const _ctxCallHierarchyDirection = new RawContextKey<string>(
	"callHierarchyDirection",
	undefined,
	{
		type: "string",
		description: localize(
			"callHierarchyDirection",
			"Whether call hierarchy shows incoming or outgoing calls",
		),
	},
);

function sanitizedDirection(candidate: string): CallHierarchyDirection {
	return candidate === CallHierarchyDirection.CallsFrom ||
		candidate === CallHierarchyDirection.CallsTo
		? candidate
		: CallHierarchyDirection.CallsTo;
}

class CallHierarchyController implements IEditorContribution {
	static readonly Id = "callHierarchy";

	static get(editor: ICodeEditor): CallHierarchyController | null {
		return editor.getContribution<CallHierarchyController>(
			CallHierarchyController.Id,
		);
	}

	private static readonly _StorageDirection =
		"callHierarchy/defaultDirection";

	private readonly _ctxHasProvider: IContextKey<boolean>;
	private readonly _ctxIsVisible: IContextKey<boolean>;
	private readonly _ctxDirection: IContextKey<string>;
	private readonly _dispoables = new DisposableStore();
	private readonly _sessionDisposables = new DisposableStore();

	private _widget?: CallHierarchyTreePeekWidget;

	constructor(
		private readonly _editor: ICodeEditor,
		@IContextKeyService
		private readonly _contextKeyService: IContextKeyService,
		@IStorageService private readonly _storageService: IStorageService,
		@ICodeEditorService private readonly _editorService: ICodeEditorService,
		@IInstantiationService
		private readonly _instantiationService: IInstantiationService,
	) {
		this._ctxIsVisible = _ctxCallHierarchyVisible.bindTo(
			this._contextKeyService,
		);
		this._ctxHasProvider = _ctxHasCallHierarchyProvider.bindTo(
			this._contextKeyService,
		);
		this._ctxDirection = _ctxCallHierarchyDirection.bindTo(
			this._contextKeyService,
		);
		this._dispoables.add(
			Event.any<any>(
				_editor.onDidChangeModel,
				_editor.onDidChangeModelLanguage,
				CallHierarchyProviderRegistry.onDidChange,
			)(() => {
				this._ctxHasProvider.set(
					_editor.hasModel() &&
						CallHierarchyProviderRegistry.has(_editor.getModel()),
				);
			}),
		);
		this._dispoables.add(this._sessionDisposables);
	}

	dispose(): void {
		this._ctxHasProvider.reset();
		this._ctxIsVisible.reset();
		this._dispoables.dispose();
	}

	async startCallHierarchyFromEditor(): Promise<void> {
		this._sessionDisposables.clear();

		if (!this._editor.hasModel()) {
			return;
		}

		const document = this._editor.getModel();
		const position = this._editor.getPosition();
		if (!CallHierarchyProviderRegistry.has(document)) {
			return;
		}

		const cts = new CancellationTokenSource();
		const model = CallHierarchyModel.create(document, position, cts.token);
		const direction = sanitizedDirection(
			this._storageService.get(
				CallHierarchyController._StorageDirection,
				StorageScope.PROFILE,
				CallHierarchyDirection.CallsTo,
			),
		);

		this._showCallHierarchyWidget(position, direction, model, cts);
	}

	async startCallHierarchyFromCallHierarchy(): Promise<void> {
		if (!this._widget) {
			return;
		}
		const model = this._widget.getModel();
		const call = this._widget.getFocused();
		if (!call || !model) {
			return;
		}
		const newEditor = await this._editorService.openCodeEditor(
			{ resource: call.item.uri },
			this._editor,
		);
		if (!newEditor) {
			return;
		}
		const newModel = model.fork(call.item);
		this._sessionDisposables.clear();

		CallHierarchyController.get(newEditor)?._showCallHierarchyWidget(
			Range.lift(newModel.root.selectionRange).getStartPosition(),
			this._widget.direction,
			Promise.resolve(newModel),
			new CancellationTokenSource(),
		);
	}

	private _showCallHierarchyWidget(
		position: IPosition,
		direction: CallHierarchyDirection,
		model: Promise<CallHierarchyModel | undefined>,
		cts: CancellationTokenSource,
	) {
		this._ctxIsVisible.set(true);
		this._ctxDirection.set(direction);
		Event.any<any>(
			this._editor.onDidChangeModel,
			this._editor.onDidChangeModelLanguage,
		)(this.endCallHierarchy, this, this._sessionDisposables);
		this._widget = this._instantiationService.createInstance(
			CallHierarchyTreePeekWidget,
			this._editor,
			position,
			direction,
		);
		this._widget.showLoading();
		this._sessionDisposables.add(
			this._widget.onDidClose(() => {
				this.endCallHierarchy();
				this._storageService.store(
					CallHierarchyController._StorageDirection,
					this._widget!.direction,
					StorageScope.PROFILE,
					StorageTarget.USER,
				);
			}),
		);
		this._sessionDisposables.add({
			dispose() {
				cts.dispose(true);
			},
		});
		this._sessionDisposables.add(this._widget);

		model
			.then((model) => {
				if (cts.token.isCancellationRequested) {
					return; // nothing
				}
				if (model) {
					this._sessionDisposables.add(model);
					this._widget!.showModel(model);
				} else {
					this._widget!.showMessage(
						localize("no.item", "No results"),
					);
				}
			})
			.catch((err) => {
				if (isCancellationError(err)) {
					this.endCallHierarchy();
					return;
				}
				this._widget!.showMessage(
					localize("error", "Failed to show call hierarchy"),
				);
			});
	}

	showOutgoingCalls(): void {
		this._widget?.updateDirection(CallHierarchyDirection.CallsFrom);
		this._ctxDirection.set(CallHierarchyDirection.CallsFrom);
	}

	showIncomingCalls(): void {
		this._widget?.updateDirection(CallHierarchyDirection.CallsTo);
		this._ctxDirection.set(CallHierarchyDirection.CallsTo);
	}

	endCallHierarchy(): void {
		this._sessionDisposables.clear();
		this._ctxIsVisible.set(false);
		this._editor.focus();
	}
}

registerEditorContribution(
	CallHierarchyController.Id,
	CallHierarchyController,
	EditorContributionInstantiation.Eager,
); // eager because it needs to define a context key

registerAction2(
	class PeekCallHierarchyAction extends EditorAction2 {
		constructor() {
			super({
				id: "editor.showCallHierarchy",
				title: localize2("title", "Peek Call Hierarchy"),
				menu: {
					id: MenuId.EditorContextPeek,
					group: "navigation",
					order: 1000,
					when: ContextKeyExpr.and(
						_ctxHasCallHierarchyProvider,
						PeekContext.notInPeekEditor,
						EditorContextKeys.isInEmbeddedEditor.toNegated(),
					),
				},
				keybinding: {
					when: EditorContextKeys.editorTextFocus,
					weight: KeybindingWeight.WorkbenchContrib,
					primary: KeyMod.Shift + KeyMod.Alt + KeyCode.KeyH,
				},
				precondition: ContextKeyExpr.and(
					_ctxHasCallHierarchyProvider,
					PeekContext.notInPeekEditor,
				),
				f1: true,
			});
		}

		async runEditorCommand(
			_accessor: ServicesAccessor,
			editor: ICodeEditor,
		): Promise<void> {
			return CallHierarchyController.get(
				editor,
			)?.startCallHierarchyFromEditor();
		}
	},
);

registerAction2(
	class extends EditorAction2 {
		constructor() {
			super({
				id: "editor.showIncomingCalls",
				title: localize2("title.incoming", "Show Incoming Calls"),
				icon: registerIcon(
					"callhierarchy-incoming",
					Codicon.callIncoming,
					localize(
						"showIncomingCallsIcons",
						"Icon for incoming calls in the call hierarchy view.",
					),
				),
				precondition: ContextKeyExpr.and(
					_ctxCallHierarchyVisible,
					_ctxCallHierarchyDirection.isEqualTo(
						CallHierarchyDirection.CallsFrom,
					),
				),
				keybinding: {
					weight: KeybindingWeight.WorkbenchContrib,
					primary: KeyMod.Shift + KeyMod.Alt + KeyCode.KeyH,
				},
				menu: {
					id: CallHierarchyTreePeekWidget.TitleMenu,
					when: _ctxCallHierarchyDirection.isEqualTo(
						CallHierarchyDirection.CallsFrom,
					),
					order: 1,
				},
			});
		}

		runEditorCommand(_accessor: ServicesAccessor, editor: ICodeEditor) {
			return CallHierarchyController.get(editor)?.showIncomingCalls();
		}
	},
);

registerAction2(
	class extends EditorAction2 {
		constructor() {
			super({
				id: "editor.showOutgoingCalls",
				title: localize2("title.outgoing", "Show Outgoing Calls"),
				icon: registerIcon(
					"callhierarchy-outgoing",
					Codicon.callOutgoing,
					localize(
						"showOutgoingCallsIcon",
						"Icon for outgoing calls in the call hierarchy view.",
					),
				),
				precondition: ContextKeyExpr.and(
					_ctxCallHierarchyVisible,
					_ctxCallHierarchyDirection.isEqualTo(
						CallHierarchyDirection.CallsTo,
					),
				),
				keybinding: {
					weight: KeybindingWeight.WorkbenchContrib,
					primary: KeyMod.Shift + KeyMod.Alt + KeyCode.KeyH,
				},
				menu: {
					id: CallHierarchyTreePeekWidget.TitleMenu,
					when: _ctxCallHierarchyDirection.isEqualTo(
						CallHierarchyDirection.CallsTo,
					),
					order: 1,
				},
			});
		}

		runEditorCommand(_accessor: ServicesAccessor, editor: ICodeEditor) {
			return CallHierarchyController.get(editor)?.showOutgoingCalls();
		}
	},
);

registerAction2(
	class extends EditorAction2 {
		constructor() {
			super({
				id: "editor.refocusCallHierarchy",
				title: localize2("title.refocus", "Refocus Call Hierarchy"),
				precondition: _ctxCallHierarchyVisible,
				keybinding: {
					weight: KeybindingWeight.WorkbenchContrib,
					primary: KeyMod.Shift + KeyCode.Enter,
				},
			});
		}

		async runEditorCommand(
			_accessor: ServicesAccessor,
			editor: ICodeEditor,
		): Promise<void> {
			return CallHierarchyController.get(
				editor,
			)?.startCallHierarchyFromCallHierarchy();
		}
	},
);

registerAction2(
	class extends EditorAction2 {
		constructor() {
			super({
				id: "editor.closeCallHierarchy",
				title: localize("close", "Close"),
				icon: Codicon.close,
				precondition: _ctxCallHierarchyVisible,
				keybinding: {
					weight: KeybindingWeight.WorkbenchContrib + 10,
					primary: KeyCode.Escape,
					when: ContextKeyExpr.not("config.editor.stablePeek"),
				},
				menu: {
					id: CallHierarchyTreePeekWidget.TitleMenu,
					order: 1000,
				},
			});
		}

		runEditorCommand(
			_accessor: ServicesAccessor,
			editor: ICodeEditor,
		): void {
			return CallHierarchyController.get(editor)?.endCallHierarchy();
		}
	},
);
