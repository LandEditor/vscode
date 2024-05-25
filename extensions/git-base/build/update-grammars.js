var updateGrammar = require("vscode-grammar-updater");

updateGrammar.update(
	"walles/git-commit-message-plus",
	"syntaxes/git-commit.tmLanguage.json",
	"./syntaxes/git-commit.tmLanguage.json",
	undefined,
	"main",
);
updateGrammar.update(
	"textmate/git.tmbundle",
	"Syntaxes/Git%20Rebase%20Message.tmLanguage",
	"./syntaxes/git-rebase.tmLanguage.json",
);
