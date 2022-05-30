const { declare } = require("@babel/helper-plugin-utils");
const importModule = require("@babel/helper-module-imports");

const AutoTrackPlugin = declare((api, options, dirname) => {
  return {
    visitor: {
      Program: {
        enter(path, state) {
          path.traverse({
            ImportDeclaration(curPath) {
              const requirePath = curPath.get("source").node.value;
              if (requirePath === options.trackPath) {
                // 如果已经引入该path
                const specifierPath = curPath.get("specifiers.0");
                if (specifierPath.isImportDefaultSpecifier()) {
                  //如果是默认导入
                  state.trackerImportId = specifierPath.toString();
                } else if (specifierPath.isImportNamespaceSpecifier()) {
                  //如果是按需导入
                  state.trackerImportId = specifierPath.get("local").toString();
                }
                path.stop(); //结束后续的遍历
              }
            },
          });
          if (!state.trackerImportId) {
            state.trackerImportId = importModule.addDefault(path, "tracker", {
              //用于生成import nameHint from 第二个参数
              nameHint: path.scope.generateUid("tracker"),
            }).name; // tracker 模块的 id
            state.trackerAST = api.template.statement(
              `${state.trackerImportId}()`
            )(); // 埋点代码的 AST，保存在state中的trackerAST中
          }
        },
      },
      "ClassMethod|FunctionExpression|FunctionDeclaration|ArrowFunctionExpression"(
        path,
        state
      ) {
        const bodyPath = path.get("body");
        if (bodyPath.isBlockStatement()) {
          bodyPath.node.body.unshift(state.trackerAST);
        } else {
          const ast = api.template.statement(
            `{${state.trackerImportId}();return PREV_BODY;}`
          )({ PREV_BODY: bodyPath.node });
          bodyPath.replaceWith(ast);
        }
      },
    },
  };
});
module.exports = AutoTrackPlugin;
