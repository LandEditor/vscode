/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/**
 * Open ended enum at runtime
 */
export const enum LanguageId {
	Null = 0,
	PlainText = 1,
}
/**
 * A font style. Values are 2^x such that a bit mask can be used.
 */
export const enum FontStyle {
	NotSet = -1,
	None = 0,
	Italic = 1,
	Bold = 2,
	Underline = 4,
	Strikethrough = 8,
}
/**
 * Open ended enum at runtime
 */
export const enum ColorId {
	None = 0,
	DefaultForeground = 1,
	DefaultBackground = 2,
}
/**
 * A standard token type.
 */
export const enum StandardTokenType {
	Other = 0,
	Comment = 1,
	String = 2,
	RegEx = 3,
}
/**
 * Helpers to manage the "collapsed" metadata of an entire StackElement stack.
 * The following assumptions have been made:
 *  - languageId < 256 => needs 8 bits
 *  - unique color count < 512 => needs 9 bits
 *
 * The binary format is:
 * - -------------------------------------------
 *     3322 2222 2222 1111 1111 1100 0000 0000
 *     1098 7654 3210 9876 5432 1098 7654 3210
 * - -------------------------------------------
 *     xxxx xxxx xxxx xxxx xxxx xxxx xxxx xxxx
 *     bbbb bbbb ffff ffff fFFF FBTT LLLL LLLL
 * - -------------------------------------------
 *  - L = LanguageId (8 bits)
 *  - T = StandardTokenType (2 bits)
 *  - B = Balanced bracket (1 bit)
 *  - F = FontStyle (4 bits)
 *  - f = foreground color (9 bits)
 *  - b = background color (8 bits)
 *
 */
export const enum MetadataConsts {
	LANGUAGEID_MASK /*            */ = 255,
	TOKEN_TYPE_MASK /*            */ = 768,
	BALANCED_BRACKETS_MASK /*     */ = 1024,
	FONT_STYLE_MASK /*            */ = 30720,
	FOREGROUND_MASK /*            */ = 16744448,
	BACKGROUND_MASK /*            */ = 4278190080,
	ITALIC_MASK /*                */ = 2048,
	BOLD_MASK /*                  */ = 4096,
	UNDERLINE_MASK /*             */ = 8192,
	STRIKETHROUGH_MASK /*         */ = 16384,
	// Semantic tokens cannot set the language id, so we can
	// use the first 8 bits for control purposes
	SEMANTIC_USE_ITALIC /*        */ = 1,
	SEMANTIC_USE_BOLD /*          */ = 2,
	SEMANTIC_USE_UNDERLINE /*    */ = 4,
	SEMANTIC_USE_STRIKETHROUGH /* */ = 8,
	SEMANTIC_USE_FOREGROUND /*    */ = 16,
	SEMANTIC_USE_BACKGROUND /*    */ = 32,
	LANGUAGEID_OFFSET = 0,
	TOKEN_TYPE_OFFSET = 8,
	BALANCED_BRACKETS_OFFSET = 10,
	FONT_STYLE_OFFSET = 11,
	FOREGROUND_OFFSET = 15,
	BACKGROUND_OFFSET = 24,
}
/**
 */
export class TokenMetadata {
	public static getLanguageId(metadata: number): LanguageId {
		return (
			(metadata & MetadataConsts.LANGUAGEID_MASK) >>>
			MetadataConsts.LANGUAGEID_OFFSET
		);
	}

	public static getTokenType(metadata: number): StandardTokenType {
		return (
			(metadata & MetadataConsts.TOKEN_TYPE_MASK) >>>
			MetadataConsts.TOKEN_TYPE_OFFSET
		);
	}

	public static containsBalancedBrackets(metadata: number): boolean {
		return (metadata & MetadataConsts.BALANCED_BRACKETS_MASK) !== 0;
	}

	public static getFontStyle(metadata: number): FontStyle {
		return (
			(metadata & MetadataConsts.FONT_STYLE_MASK) >>>
			MetadataConsts.FONT_STYLE_OFFSET
		);
	}

	public static getForeground(metadata: number): ColorId {
		return (
			(metadata & MetadataConsts.FOREGROUND_MASK) >>>
			MetadataConsts.FOREGROUND_OFFSET
		);
	}

	public static getBackground(metadata: number): ColorId {
		return (
			(metadata & MetadataConsts.BACKGROUND_MASK) >>>
			MetadataConsts.BACKGROUND_OFFSET
		);
	}

	public static getClassNameFromMetadata(metadata: number): string {
		const foreground = this.getForeground(metadata);

		let className = "mtk" + foreground;

		const fontStyle = this.getFontStyle(metadata);

		if (fontStyle & FontStyle.Italic) {
			className += " mtki";
		}

		if (fontStyle & FontStyle.Bold) {
			className += " mtkb";
		}

		if (fontStyle & FontStyle.Underline) {
			className += " mtku";
		}

		if (fontStyle & FontStyle.Strikethrough) {
			className += " mtks";
		}

		return className;
	}

	public static getInlineStyleFromMetadata(
		metadata: number,
		colorMap: string[],
	): string {
		const foreground = this.getForeground(metadata);

		const fontStyle = this.getFontStyle(metadata);

		let result = `color: ${colorMap[foreground]};`;

		if (fontStyle & FontStyle.Italic) {
			result += "font-style: italic;";
		}

		if (fontStyle & FontStyle.Bold) {
			result += "font-weight: bold;";
		}

		let textDecoration = "";

		if (fontStyle & FontStyle.Underline) {
			textDecoration += " underline";
		}

		if (fontStyle & FontStyle.Strikethrough) {
			textDecoration += " line-through";
		}

		if (textDecoration) {
			result += `text-decoration:${textDecoration};`;
		}

		return result;
	}

	public static getPresentationFromMetadata(
		metadata: number,
	): ITokenPresentation {
		const foreground = this.getForeground(metadata);

		const fontStyle = this.getFontStyle(metadata);

		return {
			foreground: foreground,
			italic: Boolean(fontStyle & FontStyle.Italic),
			bold: Boolean(fontStyle & FontStyle.Bold),
			underline: Boolean(fontStyle & FontStyle.Underline),
			strikethrough: Boolean(fontStyle & FontStyle.Strikethrough),
		};
	}
}
/**
 */
export interface ITokenPresentation {
	foreground: ColorId;

	italic: boolean;

	bold: boolean;

	underline: boolean;

	strikethrough: boolean;
}
