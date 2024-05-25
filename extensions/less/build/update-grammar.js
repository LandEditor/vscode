var updateGrammar = require("vscode-grammar-updater");

function adaptLess(grammar) {
	grammar.name = "Less";
	grammar.scopeName = "source.css.less";
}

async function updateGrammars() {
	await updateGrammar.update(
		"radium-v/Better-Less",
		"Syntaxes/Better%20Less.tmLanguage",
		"./syntaxes/less.tmLanguage.json",
		adaptLess,
		"master",
	);
}

updateGrammars();
