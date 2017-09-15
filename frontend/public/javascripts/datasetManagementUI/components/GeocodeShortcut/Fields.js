import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Dropdown } from 'common/components';
import styles from './GeocodeShortcut.scss';
import TextInput from 'components/TextInput/TextInput';

const SubI18n = I18n.show_output_schema.geocode_shortcut;
const ENTER_CONSTANT = 'enter-constant';

function getOutputColumnFromMapping(mappings, addressComponent) {
  const mapping = _.find(mappings, ([ac]) => ac === addressComponent);
  return mapping && mapping.length ? mapping[1] : null;
}

function outputColumnSelection(
  addressComponent,
  outputColumns,
  setMapping,
  mappings,
  typeWhitelist,
  allowConstant
) {
  const outputColumn = getOutputColumnFromMapping(mappings, addressComponent);
  const name = SubI18n[addressComponent];

  const optionRenderer = ({ title, className }) => ( // eslint-disable-line
    <span className={`picklist-title ${className}`}>
      {title}
    </span>
  );

  const empty = {
    title: SubI18n.none,
    value: null,
    className: styles.emptyOption,
    render: optionRenderer
  };

  const constant = {
    title: SubI18n.constant,
    value: ENTER_CONSTANT,
    className: styles.constantOption,
    render: optionRenderer
  };

  const options = outputColumns
    .filter(oc => _.includes(typeWhitelist, oc.transform.output_soql_type))
    .map(oc => ({
      title: oc.field_name,
      value: oc.field_name,
      render: optionRenderer
    })).concat([empty]);

  if (allowConstant) {
    options.push(constant);
  }


  const props = {
    onSelection: ({ value }) => {
      if (value === ENTER_CONSTANT) {
        setMapping(addressComponent, '');
      } else if (value) {
        setMapping(addressComponent, _.find(outputColumns, oc => oc.field_name === value));
      } else {
        setMapping(addressComponent, null);
      }
    },
    value: _.isString(outputColumn) ? ENTER_CONSTANT : (outputColumn && outputColumn.field_name),
    options
  };

  let constantView;
  if (_.isString(outputColumn)) {
    const onUpdateConstant = (e) => {
      setMapping(addressComponent, e.target.value);
    };

    constantView = (<TextInput
      name={`constant-${addressComponent}`}
      placeholder={SubI18n.constant}
      handleChange={onUpdateConstant}
      inErrorState={false}
      value={outputColumn} />);
  }

  return (
    <div className={styles.columnSelection}>
      <label>
        {name}
      </label>
      <Dropdown {...props} />
      {constantView}
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
  if (_.isString(oc)) return JSON.stringify(oc); // JSON is a valid SoQL string literal
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

const stringLiteral = arg => {
  if (arg && arg.type === 'string_literal') {
    return arg.value;
  }
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
  fieldPropTypes,
  stringLiteral
};
