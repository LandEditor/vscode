/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

//@ts-check
(() => {
	const bootstrapWindow = bootstrapWindowLib();

	// Load process explorer into window
	bootstrapWindow.load(
		["vs/code/electron-sandbox/processExplorer/processExplorerMain"],
		(processExplorer, configuration) =>
			processExplorer.startup(configuration),
		{
			configureDeveloperSettings: () => ({
				forceEnableDeveloperKeybindings: true,
			}),
		},
	);

	/**
	 * @typedef {import('../../../base/parts/sandbox/common/sandboxTypes').ISandboxConfiguration} ISandboxConfiguration
	 *
	 * @returns {{
	 *   load: (
	 *     modules: string[],
	 *     resultCallback: (result, configuration: ISandboxConfiguration) => unknown,
	 *     options?: {
	 *       configureDeveloperSettings?: (config: ISandboxConfiguration) => {
	 * 			forceEnableDeveloperKeybindings?: boolean,
	 * 			disallowReloadKeybinding?: boolean,
	 * 			removeDeveloperKeybindingsAfterLoad?: boolean
	 * 		 }
	 *     }
	 *   ) => Promise<unknown>
	 * }}
	 */
	function bootstrapWindowLib() {
		// @ts-ignore (defined in bootstrap-window.js)
		return window.MonacoBootstrapWindow;
	}
})();
