/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Event } from "../../../../base/common/event.js";
import type { URI } from "../../../../base/common/uri.js";
import type {
	ExtensionIdentifier,
	IExtensionDescription,
} from "../../../../platform/extensions/common/extensions.js";
import type { ExtensionHostKind } from "./extensionHostKind.js";
import type { IExtensionDescriptionDelta } from "./extensionHostProtocol.js";
import type { IResolveAuthorityResult } from "./extensionHostProxy.js";
import type { ExtensionRunningLocation } from "./extensionRunningLocation.js";
import type {
	ActivationKind,
	ExtensionActivationReason,
	ExtensionHostStartup,
} from "./extensions.js";
import type { ResponsiveState } from "./rpcProtocol.js";

export interface IExtensionHostManager {
	readonly pid: number | null;
	readonly kind: ExtensionHostKind;
	readonly startup: ExtensionHostStartup;
	readonly friendyName: string;
	readonly onDidExit: Event<[number, string | null]>;
	readonly onDidChangeResponsiveState: Event<ResponsiveState>;
	disconnect(): Promise<void>;
	dispose(): void;
	ready(): Promise<void>;
	representsRunningLocation(
		runningLocation: ExtensionRunningLocation,
	): boolean;
	deltaExtensions(extensionsDelta: IExtensionDescriptionDelta): Promise<void>;
	containsExtension(extensionId: ExtensionIdentifier): boolean;
	activate(
		extension: ExtensionIdentifier,
		reason: ExtensionActivationReason,
	): Promise<boolean>;
	activateByEvent(
		activationEvent: string,
		activationKind: ActivationKind,
	): Promise<void>;
	activationEventIsDone(activationEvent: string): boolean;
	getInspectPort(
		tryEnableInspector: boolean,
	): Promise<{ port: number; host: string } | undefined>;
	resolveAuthority(
		remoteAuthority: string,
		resolveAttempt: number,
	): Promise<IResolveAuthorityResult>;
	/**
	 * Returns `null` if no resolver for `remoteAuthority` is found.
	 */
	getCanonicalURI(remoteAuthority: string, uri: URI): Promise<URI | null>;
	start(
		extensionRegistryVersionId: number,
		allExtensions: readonly IExtensionDescription[],
		myExtensions: ExtensionIdentifier[],
	): Promise<void>;
	extensionTestsExecute(): Promise<number>;
	setRemoteEnvironment(env: { [key: string]: string | null }): Promise<void>;
}
