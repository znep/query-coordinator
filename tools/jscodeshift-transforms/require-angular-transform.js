module.exports = function(fileInfo, api, options) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  function hasAngularIdentifier(node) {
    return node.find(j.Identifier, { name: "angular" }).size() > 0;
  }

  function hasAngularRequire(node) {
    return node.find(j.VariableDeclaration).
      filter(p => j(p).find(j.VariableDeclarator, {id: {name: 'angular'}}).size() == 1).size() > 0;
  }

  if (hasAngularIdentifier(root) && !hasAngularRequire(root)) {
    let requireStatement = j.variableDeclaration('const', [
      j.variableDeclarator(j.identifier('angular'), j.callExpression(j.identifier('require'), [j.literal('angular')]))
    ]);
    root.find(j.Program).get("body").get(0).insertBefore(requireStatement);
  }

  return root.toSource({quote: 'single'});
};
