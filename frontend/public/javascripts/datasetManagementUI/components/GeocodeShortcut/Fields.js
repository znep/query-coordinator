import _ from 'lodash';
import React, { PropTypes } from 'react';
import { Dropdown } from 'common/components';
import styles from './GeocodeShortcut.scss';

const SubI18n = I18n.show_output_schema.geocode_shortcut;

function getOutputColumnFromMapping(mappings, addressComponent) {
  const mapping = _.find(mappings, ([ac]) => ac === addressComponent);
  return mapping && mapping.length ? mapping[1] : null;
}

function outputColumnSelection(addressComponent, outputColumns, setMapping, mappings, typeWhitelist) {
  const outputColumn = getOutputColumnFromMapping(mappings, addressComponent);
  const name = SubI18n[addressComponent];
  const props = {
    onSelection: e => setMapping(addressComponent, _.find(outputColumns, oc => oc.field_name === e.value)),
    value: outputColumn && outputColumn.field_name,
    options: outputColumns.filter(oc => _.includes(typeWhitelist, oc.transform.output_soql_type)).map(oc => ({
      title: oc.field_name,
      value: oc.field_name
    }))
  };

  return (
    <div className={styles.columnSelection}>
      <label>
        {name}
      </label>
      <Dropdown {...props} />
    </div>
  );
}

// Find the column in output columns which is has the transform_expr
// that matches the parsed tree (ast)
const columnMatchingAst = (outputColumns, ast) => {
  return _.find(outputColumns, oc => oc && oc.transform && _.isEqual(oc.transform.parsed_expr, ast));
};

const toTextExpr = oc => {
  if (!oc) return null;
  const { transform } = oc;
  if (transform.output_soql_type === 'text') return transform.transform_expr;
  return `to_text(${transform.transform_expr})`;
};

const toNumberExpr = oc => {
  if (!oc) return null;
  const { transform } = oc;
  if (transform.output_soql_type === 'number') return transform.transform_expr;
  return `to_number(${transform.transform_expr})`;
};

const fieldPropTypes = {
  outputColumns: PropTypes.array.isRequired
};

export {
  getOutputColumnFromMapping,
  outputColumnSelection,
  columnMatchingAst,
  toTextExpr,
  toNumberExpr,
  fieldPropTypes
};
