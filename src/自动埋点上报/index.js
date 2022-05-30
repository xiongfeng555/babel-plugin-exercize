const { transformFromAstSync } = require("@babel/core");
const fs = require("fs");
const AutoTracjPlugin = require("./plugins/auto-track-plugin");
const parser = require("@babel/parser");
const path = require("path");

const sourceCode = fs.readFileSync(path.join(__dirname, "./sourceCode.js"), {
  encoding: "utf-8",
});
const ast = parser.parse(sourceCode, {
  sourceType: "unambiguous",
});
const { code } = transformFromAstSync(ast, sourceCode, {
  plugins: [
    [
      AutoTracjPlugin,
      {
        trackPath: "tacker",
      },
    ],
  ],
});
console.log(code);
