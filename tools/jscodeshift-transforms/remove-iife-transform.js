module.exports = function(fileInfo, api, options) {
  const j = api.jscodeshift;
  const {expression, statement, statements} = j.template;
  const root = j(fileInfo.source);

  const isIIFE = p => j.match(p, {
    type: 'ExpressionStatement',
    expression: {
      type: 'CallExpression',
      callee: {
        type: 'FunctionExpression',
        id: null,
        body: {
          type: 'BlockStatement'
        }
      }
    }
  });

  const hasIIFE = p => (p.find(j.Program).get('body').filter(isIIFE).length === 1);
  const isUseStrict = p => j.match(p, { type: 'ExpressionStatement', expression: {type: 'Literal', value: 'use strict'}});

  if (hasIIFE(root)) {
    var rootIIFE = root.find(j.Program).get('body').filter(isIIFE)[0];
    var rootIIFEcomments = rootIIFE.get('comments').value || [];
    var IIFEbody = rootIIFE.get('expression').get('callee').get('body').get('body').value;
    var withoutUseStrict = IIFEbody.filter(p => !isUseStrict(p));
    withoutUseStrict[0].comments = rootIIFEcomments.concat(withoutUseStrict[0].comments || []);
    j(rootIIFE).replaceWith(withoutUseStrict);
  }

  return root.toSource({ quote: 'single' });
};
