module.exports = function(fileInfo, api, options) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  function hasRxIdentifier(node) {
    return node.find(j.Identifier, { name: "Rx" }).size() > 0;
  }

  if (hasRxIdentifier(root)) {
    var provider = root.find(j.CallExpression, {
      callee: {
        type: 'MemberExpression',
        object: {
          type: 'CallExpression',
          callee: {
            type:'MemberExpression',
            object: { name: 'angular' },
            property: { name: 'module' }}}}});
    var args = (provider.size() > 0) && provider.get('arguments').value;
    if (args && args.length > 1) {
      var providerDefinition = args[1];
      var providerFunction;
      if (j.match(providerDefinition, {type: 'Identifier'})) {
        providerFunction = root.find(j.FunctionDeclaration, { id: {name: providerDefinition.name }}).get().value;
      } else if(j.match(providerDefinition, {type: 'FunctionExpression'})) {
        providerFunction = providerDefinition;
      }
      if (providerFunction && !providerFunction.params.some(p => j.match(p, {name: 'rx'}))) {
        providerFunction.params.push(j.identifier('rx'));
        var variable = j.variableDeclaration('const', [
          j.variableDeclarator(j.identifier('Rx'), j.identifier('rx'))
        ]);
        j(providerFunction).get('body').get('body').insertAt(0, variable);
      }
    }
  }

  return root.toSource({quote: 'single'});
};
