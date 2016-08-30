module.exports = function(fileInfo, api, options) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  root.find(
    j.CallExpression,
    {
      callee: {
        type: 'MemberExpression',
        object: {type: 'Literal'},
        property: {name: 'format'}
      }
    })
    .forEach(p => {
      var templateLiteral;
      var expressions;
      var quasis;
      var keys;
      var stringLiteral = j(p).find(j.Literal).at(0).nodes()[0].value.replace(/`/g, '\\`');
      if (/\{\d\}/.test(stringLiteral)) {
        var indices = stringLiteral.match(/\{\d\}/g).map(c => parseInt(/\{(\d)\}/.exec(c)[1], 10));
        quasis = stringLiteral.split(/\{\d\}/).map((s, i, a) => j.templateElement({
          cooked: s,
          raw: s
        }, (a.length - 1 === i)));
        expressions = j(p).nodes()[0].arguments;
        var orderedExpressions = indices.map(i => expressions[i]);
        templateLiteral = j.templateLiteral(quasis, orderedExpressions);
        j(p).replaceWith(templateLiteral);
      } else if (/\{([^\}]+)\}/.test(stringLiteral)) {
        if (j(p).nodes()[0].arguments[0].type === 'ObjectExpression') {
          var propertyMap = new Map();
          j(p).nodes()[0].arguments[0].properties.forEach(prop => {
            propertyMap.set(prop.key.name, prop.value);
          });
          keys = stringLiteral.match(/\{[^\}]+\}/g).map(s => s.replace(/[\{\}]/g, ''));
          expressions = keys.map(key => propertyMap.get(key));
          quasis = stringLiteral.split(/\{[^\}]+\}/g).map((s, i, a) => j.templateElement({
            cooked: s,
            raw: s
          }, (a.length - 1 === i)));
          templateLiteral = j.templateLiteral(quasis, expressions);
          j(p).replaceWith(templateLiteral);
        } else {
          var callArgument = j(p).nodes()[0].arguments[0].name;
          keys = stringLiteral.match(/\{[^\}]+\}/g).map(s => s.replace(/[\{\}]/g, ''));
          expressions = keys.map(key => {
            var useDotNotation = /^[$A-Z_][0-9A-Z_$]*$/i.test(key);
            return j.memberExpression(
              j.identifier(callArgument),
              useDotNotation ? j.identifier(key) : j.literal(key),
              !useDotNotation
            )
          });
          quasis = stringLiteral.split(/\{[^\}]+\}/g).map((s, i, a) => j.templateElement({
            cooked: s,
            raw: s
          }, (a.length - 1 === i)));
          templateLiteral = j.templateLiteral(quasis, expressions);
          j(p).replaceWith(templateLiteral);
        }
      }
    });
  return root.toSource({quote: 'single'});
};
