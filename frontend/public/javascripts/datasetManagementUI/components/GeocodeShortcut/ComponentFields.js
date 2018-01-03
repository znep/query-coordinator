import React from 'react';
import {
  toTextExpr,
  outputColumnSelection,
  getOutputColumnFromMapping,
  columnMatchingAst,
  fieldPropTypes,
  stringLiteral
} from './Fields';
import { stripToTextAst, stripToNumberAst } from 'lib/ast';


const ComponentFields = ({ outputColumns, setMapping, mappings }) => (
  <div>
    {outputColumnSelection('address', outputColumns, setMapping, mappings, ['text'], true)}
    {outputColumnSelection('city', outputColumns, setMapping, mappings, ['text'], true)}
    {outputColumnSelection('state', outputColumns, setMapping, mappings, ['text'], true)}
    {outputColumnSelection('zip', outputColumns, setMapping, mappings, ['text', 'number'], true)}
  </div>
);

ComponentFields.propTypes = fieldPropTypes;

const composeFromComponents = (mappings, isObe) => {
  const address = toTextExpr(getOutputColumnFromMapping(mappings, 'address'));
  const city = toTextExpr(getOutputColumnFromMapping(mappings, 'city'));
  const state = toTextExpr(getOutputColumnFromMapping(mappings, 'state'));
  const zip = toTextExpr(getOutputColumnFromMapping(mappings, 'zip'));

  const point = `geocode(${address}, ${city}, ${state}, ${zip})`;
  if (isObe) {
    return `make_location(
      ${address},
      ${city},
      ${state},
      ${zip},
      ${point}
    )`;
  }
  return point;
};

const decomposeFromComponents = (geocodeFunc, outputColumns) => {
  // Remember, any one of these could be null, because we could be decomposing
  // a funcall like: geocode(`address`, null, null, `zip`)
  const [address, city, state, zip] = geocodeFunc.args;

  return [
    // The ORs here are because we might have wrapped the AST in a to_text call depending on the output column type
    ['address', columnMatchingAst(outputColumns, address)
      || columnMatchingAst(outputColumns, stripToTextAst(address))
      || stringLiteral(address)],
    ['city', columnMatchingAst(outputColumns, city)
      || columnMatchingAst(outputColumns, stripToTextAst(city))
      || stringLiteral(city)],
    ['state', columnMatchingAst(outputColumns, state)
      || columnMatchingAst(outputColumns, stripToTextAst(state))
      || stringLiteral(state)],
    ['zip', columnMatchingAst(outputColumns, zip)
      || columnMatchingAst(outputColumns, stripToTextAst(zip))
      || columnMatchingAst(outputColumns, stripToNumberAst(zip))
      || stringLiteral(zip)]
  ];
};

const relevantMappingsForComponents = () => ['address', 'city', 'state', 'zip'];


export {
  ComponentFields,
  composeFromComponents,
  decomposeFromComponents,
  relevantMappingsForComponents
};
