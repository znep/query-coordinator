module.exports = function(fileInfo, api, options) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  root.find(j.Property, {key: {type: 'Identifier', name: 'templateUrl'}, value: {type: 'Literal'}})
    .forEach((p, i) => {
      var id = `templateUrl${i > 0 ? i : ''}`;
      var templatePath = j(p).find(j.Literal).get('value').value.replace(/^\//, '');
      if (/\.html$/.test(templatePath)) {
        var templateRequire = j.variableDeclaration('var', [
          j.variableDeclarator(j.identifier(id), j.callExpression(j.identifier('require'), [j.literal(templatePath)]))
        ]);
        root.find(j.Statement).at(0).insertBefore(templateRequire);
        j(p).find(j.Literal).replaceWith(
          j.identifier(id)
        );
      }
    });

  return root.toSource({ quote: 'single' });
};
