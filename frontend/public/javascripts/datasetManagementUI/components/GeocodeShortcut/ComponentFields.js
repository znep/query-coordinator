import React from 'react';
import {
  toTextExpr,
  outputColumnSelection,
  getOutputColumnFromMapping,
  columnMatchingAst,
  fieldPropTypes
} from './Fields';
import { stripToTextAst } from 'lib/ast';


const ComponentFields = ({ outputColumns, setMapping, mappings }) => (
  <div>
    {outputColumnSelection('address', outputColumns, setMapping, mappings, ['text'])}
    {outputColumnSelection('city', outputColumns, setMapping, mappings, ['text'])}
    {outputColumnSelection('state', outputColumns, setMapping, mappings, ['text'])}
    {outputColumnSelection('zip', outputColumns, setMapping, mappings, ['text', 'number'])}
  </div>
);

ComponentFields.propTypes = fieldPropTypes;

const composeFromComponents = (mappings) => {
  const address = toTextExpr(getOutputColumnFromMapping(mappings, 'address'));
  const city = toTextExpr(getOutputColumnFromMapping(mappings, 'city'));
  const state = toTextExpr(getOutputColumnFromMapping(mappings, 'state'));
  const zip = toTextExpr(getOutputColumnFromMapping(mappings, 'zip'));

  return `geocode(${address}, ${city}, ${state}, ${zip})`;
};

const decomposeFromComponents = (geocodeFunc, outputColumns) => {
  // Remember, any one of these could be null, because we could be decomposing
  // a funcall like: geocode(`address`, null, null, `zip`)
  const [address, city, state, zip] = geocodeFunc.args;

  return [
    // The ORs here are because we might have wrapped the AST in a to_text call depending on the output column type
    ['address', columnMatchingAst(outputColumns, address)
      || columnMatchingAst(outputColumns, stripToTextAst(address))],
    ['city', columnMatchingAst(outputColumns, city)
      || columnMatchingAst(outputColumns, stripToTextAst(city))],
    ['state', columnMatchingAst(outputColumns, state)
      || columnMatchingAst(outputColumns, stripToTextAst(state))],
    ['zip', columnMatchingAst(outputColumns, zip)
      || columnMatchingAst(outputColumns, stripToTextAst(zip))]
  ];
};

const relevantMappingsForComponents = () => ['address', 'city', 'state', 'zip'];


export {
  ComponentFields,
  composeFromComponents,
  decomposeFromComponents,
  relevantMappingsForComponents
};
