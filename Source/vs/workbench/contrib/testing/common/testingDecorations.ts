/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IAction } from "vs/base/common/actions";
import { binarySearch } from "vs/base/common/arrays";
import { Event } from "vs/base/common/event";
import { URI } from "vs/base/common/uri";
import { Position } from "vs/editor/common/core/position";
import { IModelDeltaDecoration } from "vs/editor/common/model";
import { createDecorator } from "vs/platform/instantiation/common/instantiation";
import { ITestMessage } from "vs/workbench/contrib/testing/common/testTypes";

export interface ITestingDecorationsService {
	_serviceBrand: undefined;

	/**
	 * Fires when something happened to change decorations in an editor.
	 * Interested consumers should call {@link syncDecorations} to update them.
	 */
	onDidChange: Event<void>;

	/**
	 * Signals the code underlying a test message has changed, and it should
	 * no longer be decorated in the source.
	 */
	invalidateResultMessage(message: ITestMessage): void;

	/**
	 * Ensures decorations in the given document URI are up to date,
	 * and returns them.
	 */
	syncDecorations(resource: URI): Iterable<ITestDecoration> & {
		readonly size: number;
		getById(decorationId: string): ITestDecoration | undefined;
	};

	/**
	 * Gets the range where a test ID is displayed, in the given URI.
	 * Returns undefined if there's no such decoration.
	 */
	getDecoratedTestPosition(
		resource: URI,
		testId: string
	): Position | undefined;
}

export interface ITestDecoration {
	/**
	 * ID of the decoration after being added to the editor, set after the
	 * decoration is applied.
	 */
	readonly id: string;

	/**
	 * Original decoration line number.
	 */
	readonly line: number;

	/**
	 * Editor decoration instance.
	 */
	readonly editorDecoration: IModelDeltaDecoration;

	getContextMenuActions(): { object: IAction[]; dispose(): void };
}

export class TestDecorations<
	T extends { id: string; line: number } = ITestDecoration,
> {
	public value: T[] = [];
	/**
	 * Adds a new value to the decorations.
	 */
	public push(value: T) {
		const searchIndex = binarySearch(
			this.value,
			value,
			(a, b) => a.line - b.line
		);
		this.value.splice(
			searchIndex < 0 ? ~searchIndex : searchIndex,
			0,
			value
		);
	}

	/**
	 * Gets decorations on each line.
	 */
	public *lines(): Iterable<[number, T[]]> {
		if (!this.value.length) {
			return;
		}

		let startIndex = 0;
		let startLine = this.value[0].line;
		for (let i = 1; i < this.value.length; i++) {
			const v = this.value[i];
			if (v.line !== startLine) {
				yield [startLine, this.value.slice(startIndex, i)];
				startLine = v.line;
				startIndex = i;
			}
		}

		yield [startLine, this.value.slice(startIndex)];
	}
}

export const ITestingDecorationsService =
	createDecorator<ITestingDecorationsService>("testingDecorationService");
