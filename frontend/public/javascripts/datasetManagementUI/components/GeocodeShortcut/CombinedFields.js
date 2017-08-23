import React from 'react';
import {
  toTextExpr,
  outputColumnSelection,
  getOutputColumnFromMapping,
  columnMatchingAst,
  fieldPropTypes
} from './Fields';
import { traverse, stripToTextAst } from 'lib/ast';

const CombinedFields = ({ outputColumns, setMapping, mappings }) => (
  <div>
    {outputColumnSelection('full_address', outputColumns, setMapping, mappings, ['text'])}
  </div>
);

CombinedFields.propTypes = fieldPropTypes;

const composeFromCombined = (mappings) => {
  const fullAddress = toTextExpr(getOutputColumnFromMapping(mappings, 'full_address'));
  return `geocode(to_location(${fullAddress}))`;
};

const decomposeFromCombined = (locToPoint, outputColumns) => {
  const ast = traverse(locToPoint, false, (node, acc) => {
    if (node && node.type === 'funcall' && node.function_name === 'to_location') {
      // pluck out the arg to `to_location/1` - it is our output column ast
      return node.args[0];
    }
    return acc;
  });
  return [
    // The ORs here are because we might have wrapped the AST in a to_text call
    [
      'full_address',
      columnMatchingAst(outputColumns, ast) || columnMatchingAst(outputColumns, stripToTextAst(ast))
    ]
  ];
};

const relevantMappingsForCombined = () => ['full_address'];

export {
  CombinedFields,
  composeFromCombined,
  decomposeFromCombined,
  relevantMappingsForCombined
};
