import React from 'react';
import {
  toNumberExpr,
  outputColumnSelection,
  getOutputColumnFromMapping,
  columnMatchingAst,
  fieldPropTypes
} from './Fields';
import { stripToNumberAst } from 'lib/ast';

const LatLngFields = ({ outputColumns, setMapping, mappings }) => {
  return (
    <div>
      {outputColumnSelection('latitude', outputColumns, setMapping, mappings, ['text', 'number'])}
      {outputColumnSelection('longitude', outputColumns, setMapping, mappings, ['text', 'number'])}
    </div>
  );
};

LatLngFields.propTypes = fieldPropTypes;

const composeFromLatLng = (mappings, isObe) => {
  const lat = toNumberExpr(getOutputColumnFromMapping(mappings, 'latitude'));
  const lng = toNumberExpr(getOutputColumnFromMapping(mappings, 'longitude'));

  const point = `make_point(${lat}, ${lng})`;
  if (isObe) {
    return `make_location(${point})`;
  }
  return point;
};

// given a make_point AST, and the output columns, return a mapping
const decomposeFromLatLng = (makePointFunc, outputColumns) => {
  // Each one of these args is not a necessarily column ref! It may be a `to_number` function call
  // which encloses a column ref - but either colRef could be null
  const [latArg, lngArg] = makePointFunc.args;

  // The ORs here are because we might have wrapped the AST in a to_number call
  const latitude =
    columnMatchingAst(outputColumns, latArg) || columnMatchingAst(outputColumns, stripToNumberAst(latArg));
  const longitude =
    columnMatchingAst(outputColumns, lngArg) || columnMatchingAst(outputColumns, stripToNumberAst(lngArg));

  return [['latitude', latitude], ['longitude', longitude]];
};

const relevantMappingsForLatLng = () => ['latitude', 'longitude'];

export { LatLngFields, composeFromLatLng, decomposeFromLatLng, relevantMappingsForLatLng };
