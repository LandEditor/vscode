/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ChildProcess, spawn, SpawnOptions, StdioOptions } from "child_process";
import {
	chmodSync,
	existsSync,
	readFileSync,
	statSync,
	truncateSync,
	unlinkSync,
} from "fs";
import { homedir, release, tmpdir } from "os";
import type { ProfilingSession, Target } from "v8-inspect-profiler";
import { Event } from "vs/base/common/event";
import { isAbsolute, resolve, join, dirname } from "vs/base/common/path";
import {
	IProcessEnvironment,
	isMacintosh,
	isWindows,
} from "vs/base/common/platform";
import { randomPort } from "vs/base/common/ports";
import { whenDeleted, writeFileSync } from "vs/base/node/pfs";
import { findFreePort } from "vs/base/node/ports";
import { watchFileContents } from "vs/platform/files/node/watcher/nodejs/nodejsWatcherLib";
import { NativeParsedArgs } from "vs/platform/environment/common/argv";
import {
	buildHelpMessage,
	buildVersionMessage,
	NATIVE_CLI_COMMANDS,
	OPTIONS,
} from "vs/platform/environment/node/argv";
import {
	addArg,
	parseCLIProcessArgv,
} from "vs/platform/environment/node/argvHelper";
import {
	getStdinFilePath,
	hasStdinWithoutTty,
	readFromStdin,
	stdinDataListener,
} from "vs/platform/environment/node/stdin";
import { createWaitMarkerFileSync } from "vs/platform/environment/node/wait";
import product from "vs/platform/product/common/product";
import { CancellationTokenSource } from "vs/base/common/cancellation";
import { isUNC, randomPath } from "vs/base/common/extpath";
import { Utils } from "vs/platform/profiling/common/profiling";
import { FileAccess } from "vs/base/common/network";
import { cwd } from "vs/base/common/process";
import { addUNCHostToAllowlist } from "vs/base/node/unc";
import { URI } from "vs/base/common/uri";

function shouldSpawnCliProcess(argv: NativeParsedArgs): boolean {
	return (
		!!argv["install-source"] ||
		!!argv["list-extensions"] ||
		!!argv["install-extension"] ||
		!!argv["uninstall-extension"] ||
		!!argv["locate-extension"] ||
		!!argv["telemetry"]
	);
}

interface IMainCli {
	main: (argv: NativeParsedArgs) => Promise<void>;
}

export async function main(argv: string[]): Promise<any> {
	let args: NativeParsedArgs;

	try {
		args = parseCLIProcessArgv(argv);
	} catch (err) {
		console.error(err.message);
		return;
	}

	for (const subcommand of NATIVE_CLI_COMMANDS) {
		if (args[subcommand]) {
			if (!product.tunnelApplicationName) {
				console.error(
					`'${subcommand}' command not supported in ${product.applicationName}`
				);
				return;
			}
			const tunnelArgs = argv.slice(argv.indexOf(subcommand) + 1); // all arguments behind `tunnel`
			return new Promise((resolve, reject) => {
				let tunnelProcess: ChildProcess;
				const stdio: StdioOptions = ["ignore", "pipe", "pipe"];
				if (process.env["VSCODE_DEV"]) {
					tunnelProcess = spawn(
						"cargo",
						["run", "--", subcommand, ...tunnelArgs],
						{ cwd: join(getAppRoot(), "cli"), stdio }
					);
				} else {
					const appPath =
						process.platform === "darwin"
							? // ./Contents/MacOS/Electron => ./Contents/Resources/app/bin/code-tunnel-insiders
							  join(
									dirname(dirname(process.execPath)),
									"Resources",
									"app"
							  )
							: dirname(process.execPath);
					const tunnelCommand = join(
						appPath,
						"bin",
						`${product.tunnelApplicationName}${
							isWindows ? ".exe" : ""
						}`
					);
					tunnelProcess = spawn(
						tunnelCommand,
						[subcommand, ...tunnelArgs],
						{ cwd: cwd(), stdio }
					);
				}

				tunnelProcess.stdout!.pipe(process.stdout);
				tunnelProcess.stderr!.pipe(process.stderr);
				tunnelProcess.on("exit", resolve);
				tunnelProcess.on("error", reject);
			});
		}
	}

	// Help
	if (args.help) {
		const executable = `${product.applicationName}${
			isWindows ? ".exe" : ""
		}`;
		console.log(
			buildHelpMessage(
				product.nameLong,
				executable,
				product.version,
				OPTIONS
			)
		);
	}

	// Version Info
	else if (args.version) {
		console.log(buildVersionMessage(product.version, product.commit));
	}

	// Shell integration
	else if (args["locate-shell-integration-path"]) {
		let file: string;
		switch (args["locate-shell-integration-path"]) {
			// Usage: `[[ "$TERM_PROGRAM" == "vscode" ]] && . "$(code --locate-shell-integration-path bash)"`
			case "bash":
				file = "shellIntegration-bash.sh";
				break;
			// Usage: `if ($env:TERM_PROGRAM -eq "vscode") { . "$(code --locate-shell-integration-path pwsh)" }`
			case "pwsh":
				file = "shellIntegration.ps1";
				break;
			// Usage: `[[ "$TERM_PROGRAM" == "vscode" ]] && . "$(code --locate-shell-integration-path zsh)"`
			case "zsh":
				file = "shellIntegration-rc.zsh";
				break;
			// Usage: `string match -q "$TERM_PROGRAM" "vscode"; and . (code --locate-shell-integration-path fish)`
			case "fish":
				file = "fish_xdg_data/fish/vendor_conf.d/shellIntegration.fish";
				break;
			default:
				throw new Error(
					"Error using --locate-shell-integration-path: Invalid shell type"
				);
		}
		console.log(
			join(
				getAppRoot(),
				"out",
				"vs",
				"workbench",
				"contrib",
				"terminal",
				"browser",
				"media",
				file
			)
		);
	}

	// Extensions Management
	else if (shouldSpawnCliProcess(args)) {
		const cli = await new Promise<IMainCli>((resolve, reject) =>
			require(["vs/code/node/cliProcessMain"], resolve, reject)
		);
		await cli.main(args);

		return;
	}

	// Write File
	else if (args["file-write"]) {
		const source = args._[0];
		const target = args._[1];

		// Windows: set the paths as allowed UNC paths given
		// they are explicitly provided by the user as arguments
		if (isWindows) {
			for (const path of [source, target]) {
				if (isUNC(path)) {
					addUNCHostToAllowlist(URI.file(path).authority);
				}
			}
		}

		// Validate
		if (
			!source ||
			!target ||
			source === target || // make sure source and target are provided and are not the same
			!isAbsolute(source) ||
			!isAbsolute(target) || // make sure both source and target are absolute paths
			!existsSync(source) ||
			!statSync(source).isFile() || // make sure source exists as file
			!existsSync(target) ||
			!statSync(target).isFile() // make sure target exists as file
		) {
			throw new Error("Using --file-write with invalid arguments.");
		}

		try {
			// Check for readonly status and chmod if so if we are told so
			let targetMode: number = 0;
			let restoreMode = false;
			if (!!args["file-chmod"]) {
				targetMode = statSync(target).mode;
				if (
					!(
						(
							targetMode & 0o200
						) /* File mode indicating writable by owner */
					)
				) {
					chmodSync(target, targetMode | 0o200);
					restoreMode = true;
				}
			}

			// Write source to target
			const data = readFileSync(source);
			if (isWindows) {
				// On Windows we use a different strategy of saving the file
				// by first truncating the file and then writing with r+ mode.
				// This helps to save hidden files on Windows
				// (see https://github.com/microsoft/vscode/issues/931) and
				// prevent removing alternate data streams
				// (see https://github.com/microsoft/vscode/issues/6363)
				truncateSync(target, 0);
				writeFileSync(target, data, { flag: "r+" });
			} else {
				writeFileSync(target, data);
			}

			// Restore previous mode as needed
			if (restoreMode) {
				chmodSync(target, targetMode);
			}
		} catch (error) {
			error.message = `Error using --file-write: ${error.message}`;
			throw error;
		}
	}

	// Just Code
	else {
		const env: IProcessEnvironment = {
			...process.env,
			"ELECTRON_NO_ATTACH_CONSOLE": "1",
		};

		delete env["ELECTRON_RUN_AS_NODE"];

		const processCallbacks: ((child: ChildProcess) => Promise<void>)[] = [];

		if (args.verbose) {
			env["ELECTRON_ENABLE_LOGGING"] = "1";
		}

		if (args.verbose || args.status) {
			processCallbacks.push(async (child) => {
				child.stdout?.on("data", (data: Buffer) =>
					console.log(data.toString("utf8").trim())
				);
				child.stderr?.on("data", (data: Buffer) =>
					console.log(data.toString("utf8").trim())
				);

				await Event.toPromise(
					Event.fromNodeEventEmitter(child, "exit")
				);
			});
		}

		const hasReadStdinArg = args._.some((a) => a === "-");
		if (hasReadStdinArg) {
			// remove the "-" argument when we read from stdin
			args._ = args._.filter((a) => a !== "-");
			argv = argv.filter((a) => a !== "-");
		}

		let stdinFilePath: string | undefined;
		if (hasStdinWithoutTty()) {
			// Read from stdin: we require a single "-" argument to be passed in order to start reading from
			// stdin. We do this because there is no reliable way to find out if data is piped to stdin. Just
			// checking for stdin being connected to a TTY is not enough (https://github.com/microsoft/vscode/issues/40351)

			if (hasReadStdinArg) {
				stdinFilePath = getStdinFilePath();

				// returns a file path where stdin input is written into (write in progress).
				try {
					await readFromStdin(stdinFilePath, !!args.verbose); // throws error if file can not be written

					// Make sure to open tmp file
					addArg(argv, stdinFilePath);

					// Enable --wait to get all data and ignore adding this to history
					addArg(argv, "--wait");
					addArg(argv, "--skip-add-to-recently-opened");
					args.wait = true;

					console.log(`Reading from stdin via: ${stdinFilePath}`);
				} catch (e) {
					console.log(
						`Failed to create file to read via stdin: ${e.toString()}`
					);
					stdinFilePath = undefined;
				}
			} else {
				// If the user pipes data via stdin but forgot to add the "-" argument, help by printing a message
				// if we detect that data flows into via stdin after a certain timeout.
				processCallbacks.push((_) =>
					stdinDataListener(1000).then((dataReceived) => {
						if (dataReceived) {
							if (isWindows) {
								console.log(
									`Run with '${product.applicationName} -' to read output from another program (e.g. 'echo Hello World | ${product.applicationName} -').`
								);
							} else {
								console.log(
									`Run with '${product.applicationName} -' to read from stdin (e.g. 'ps aux | grep code | ${product.applicationName} -').`
								);
							}
						}
					})
				);
			}
		}

		const isMacOSBigSurOrNewer = isMacintosh && release() > "20.0.0";

		// If we are started with --wait create a random temporary file
		// and pass it over to the starting instance. We can use this file
		// to wait for it to be deleted to monitor that the edited file
		// is closed and then exit the waiting process.
		let waitMarkerFilePath: string | undefined;
		if (args.wait) {
			waitMarkerFilePath = createWaitMarkerFileSync(args.verbose);
			if (waitMarkerFilePath) {
				addArg(argv, "--waitMarkerFilePath", waitMarkerFilePath);
			}

			// When running with --wait, we want to continue running CLI process
			// until either:
			// - the wait marker file has been deleted (e.g. when closing the editor)
			// - the launched process terminates (e.g. due to a crash)
			processCallbacks.push(async (child) => {
				let childExitPromise;
				if (isMacOSBigSurOrNewer) {
					// On Big Sur, we resolve the following promise only when the child,
					// i.e. the open command, exited with a signal or error. Otherwise, we
					// wait for the marker file to be deleted or for the child to error.
					childExitPromise = new Promise<void>((resolve) => {
						// Only resolve this promise if the child (i.e. open) exited with an error
						child.on("exit", (code, signal) => {
							if (code !== 0 || signal) {
								resolve();
							}
						});
					});
				} else {
					// On other platforms, we listen for exit in case the child exits before the
					// marker file is deleted.
					childExitPromise = Event.toPromise(
						Event.fromNodeEventEmitter(child, "exit")
					);
				}
				try {
					await Promise.race([
						whenDeleted(waitMarkerFilePath!),
						Event.toPromise(
							Event.fromNodeEventEmitter(child, "error")
						),
						childExitPromise,
					]);
				} finally {
					if (stdinFilePath) {
						unlinkSync(stdinFilePath); // Make sure to delete the tmp stdin file if we have any
					}
				}
			});
		}

		// If we have been started with `--prof-startup` we need to find free ports to profile
		// the main process, the renderer, and the extension host. We also disable v8 cached data
		// to get better profile traces. Last, we listen on stdout for a signal that tells us to
		// stop profiling.
		if (args["prof-startup"]) {
			const portMain = await findFreePort(randomPort(), 10, 3000);
			const portRenderer = await findFreePort(portMain + 1, 10, 3000);
			const portExthost = await findFreePort(portRenderer + 1, 10, 3000);

			// fail the operation when one of the ports couldn't be acquired.
			if (portMain * portRenderer * portExthost === 0) {
				throw new Error(
					"Failed to find free ports for profiler. Make sure to shutdown all instances of the editor first."
				);
			}

			const filenamePrefix = randomPath(homedir(), "prof");

			addArg(argv, `--inspect-brk=${portMain}`);
			addArg(argv, `--remote-debugging-port=${portRenderer}`);
			addArg(argv, `--inspect-brk-extensions=${portExthost}`);
			addArg(argv, `--prof-startup-prefix`, filenamePrefix);
			addArg(argv, `--no-cached-data`);

			writeFileSync(filenamePrefix, argv.slice(-6).join("|"));

			processCallbacks.push(async (_child) => {
				class Profiler {
					static async start(
						name: string,
						filenamePrefix: string,
						opts: {
							port: number;
							tries?: number;
							target?: (targets: Target[]) => Target;
						}
					) {
						const profiler = await import("v8-inspect-profiler");

						let session: ProfilingSession;
						try {
							session = await profiler.startProfiling(opts);
						} catch (err) {
							console.error(
								`FAILED to start profiling for '${name}' on port '${opts.port}'`
							);
						}

						return {
							async stop() {
								if (!session) {
									return;
								}
								let suffix = "";
								const result = await session.stop();
								if (!process.env["VSCODE_DEV"]) {
									// when running from a not-development-build we remove
									// absolute filenames because we don't want to reveal anything
									// about users. We also append the `.txt` suffix to make it
									// easier to attach these files to GH issues
									result.profile = Utils.rewriteAbsolutePaths(
										result.profile,
										"piiRemoved"
									);
									suffix = ".txt";
								}

								writeFileSync(
									`${filenamePrefix}.${name}.cpuprofile${suffix}`,
									JSON.stringify(result.profile, undefined, 4)
								);
							},
						};
					}
				}

				try {
					// load and start profiler
					const mainProfileRequest = Profiler.start(
						"main",
						filenamePrefix,
						{ port: portMain }
					);
					const extHostProfileRequest = Profiler.start(
						"extHost",
						filenamePrefix,
						{ port: portExthost, tries: 300 }
					);
					const rendererProfileRequest = Profiler.start(
						"renderer",
						filenamePrefix,
						{
							port: portRenderer,
							tries: 200,
							target: function (targets) {
								return targets.filter((target) => {
									if (!target.webSocketDebuggerUrl) {
										return false;
									}
									if (target.type === "page") {
										return (
											target.url.indexOf(
												"workbench/workbench.html"
											) > 0 ||
											target.url.indexOf(
												"workbench/workbench-dev.html"
											) > 0
										);
									} else {
										return true;
									}
								})[0];
							},
						}
					);

					const main = await mainProfileRequest;
					const extHost = await extHostProfileRequest;
					const renderer = await rendererProfileRequest;

					// wait for the renderer to delete the
					// marker file
					await whenDeleted(filenamePrefix);

					// stop profiling
					await main.stop();
					await renderer.stop();
					await extHost.stop();

					// re-create the marker file to signal that profiling is done
					writeFileSync(filenamePrefix, "");
				} catch (e) {
					console.error(
						"Failed to profile startup. Make sure to quit Code first."
					);
				}
			});
		}

		const options: SpawnOptions = {
			detached: true,
			env,
		};

		if (!args.verbose) {
			options["stdio"] = "ignore";
		}

		let child: ChildProcess;
		if (!isMacOSBigSurOrNewer) {
			if (!args.verbose && args.status) {
				options["stdio"] = ["ignore", "pipe", "ignore"]; // restore ability to see output when --status is used
			}

			// We spawn process.execPath directly
			child = spawn(process.execPath, argv.slice(2), options);
		} else {
			// On Big Sur, we spawn using the open command to obtain behavior
			// similar to if the app was launched from the dock
			// https://github.com/microsoft/vscode/issues/102975

			// The following args are for the open command itself, rather than for VS Code:
			// -n creates a new instance.
			//    Without -n, the open command re-opens the existing instance as-is.
			// -g starts the new instance in the background.
			//    Later, Electron brings the instance to the foreground.
			//    This way, Mac does not automatically try to foreground the new instance, which causes
			//    focusing issues when the new instance only sends data to a previous instance and then closes.
			const spawnArgs = ["-n", "-g"];
			// -a opens the given application.
			spawnArgs.push("-a", process.execPath); // -a: opens a specific application

			if (args.verbose || args.status) {
				spawnArgs.push("--wait-apps"); // `open --wait-apps`: blocks until the launched app is closed (even if they were already running)

				// The open command only allows for redirecting stderr and stdout to files,
				// so we make it redirect those to temp files, and then use a logger to
				// redirect the file output to the console
				for (const outputType of args.verbose
					? ["stdout", "stderr"]
					: ["stdout"]) {
					// Tmp file to target output to
					const tmpName = randomPath(tmpdir(), `code-${outputType}`);
					writeFileSync(tmpName, "");
					spawnArgs.push(`--${outputType}`, tmpName);

					// Listener to redirect content to stdout/stderr
					processCallbacks.push(async (child) => {
						try {
							const stream =
								outputType === "stdout"
									? process.stdout
									: process.stderr;

							const cts = new CancellationTokenSource();
							child.on("close", () => {
								// We must dispose the token to stop watching,
								// but the watcher might still be reading data.
								setTimeout(() => cts.dispose(true), 200);
							});
							await watchFileContents(
								tmpName,
								(chunk) => stream.write(chunk),
								() => {
									/* ignore */
								},
								cts.token
							);
						} finally {
							unlinkSync(tmpName);
						}
					});
				}
			}

			for (const e in env) {
				// Ignore the _ env var, because the open command
				// ignores it anyway.
				// Pass the rest of the env vars in to fix
				// https://github.com/microsoft/vscode/issues/134696.
				if (e !== "_") {
					spawnArgs.push("--env");
					spawnArgs.push(`${e}=${env[e]}`);
				}
			}

			spawnArgs.push("--args", ...argv.slice(2)); // pass on our arguments

			if (env["VSCODE_DEV"]) {
				// If we're in development mode, replace the . arg with the
				// vscode source arg. Because the OSS app isn't bundled,
				// it needs the full vscode source arg to launch properly.
				const curdir = ".";
				const launchDirIndex = spawnArgs.indexOf(curdir);
				if (launchDirIndex !== -1) {
					spawnArgs[launchDirIndex] = resolve(curdir);
				}
			}

			// We already passed over the env variables
			// using the --env flags, so we can leave them out here.
			// Also, we don't need to pass env._, which is different from argv._
			child = spawn("open", spawnArgs, { ...options, env: {} });
		}

		return Promise.all(processCallbacks.map((callback) => callback(child)));
	}
}

function getAppRoot() {
	return dirname(FileAccess.asFileUri("").fsPath);
}

function eventuallyExit(code: number): void {
	setTimeout(() => process.exit(code), 0);
}

main(process.argv)
	.then(() => eventuallyExit(0))
	.then(null, (err) => {
		console.error(err.message || err.stack || err);
		eventuallyExit(1);
	});
