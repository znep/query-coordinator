import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import I18n from 'common/i18n';
import { Dropdown, SocrataIcon } from 'common/components';
import { getIconForDataType } from 'common/icons';

import { isColumnUsableWithMeasureArgument } from '../../measureCalculator';

// A dropdown list of columns, automatically filtered for relevance to the a given measure
// argument (i.e., only date columns are displayed for Recent Value's dateColumn argument).
export default class ColumnDropdown extends Component {
  render() {
    const {
      columnFieldName,
      displayableFilterableColumns,
      id,
      labelledBy,
      measure,
      measureArgument,
      onSelectColumn
    } = this.props;

    const columns = _.filter(displayableFilterableColumns, (column) => {
      return this.props.isColumnUsableWithMeasureArgument(column, measure, measureArgument);
    });

    const dropdownOptions = {
      placeholder: I18n.t('open_performance.measure.edit_modal.calculation.choose_column'),
      onSelection: (option) => {
        onSelectColumn(option.value);
      },
      options: _.map(columns, (column) => ({
        title: column.name,
        value: column.fieldName,
        icon: <SocrataIcon name={getIconForDataType(column.dataTypeName)} />
      })),
      value: columnFieldName,
      id,
      showOptionsBelowHandle: true,
      labelledBy
    };

    return (
      <div className="column-dropdown">
        <Dropdown {...dropdownOptions} />
      </div>
    );
  }
}

ColumnDropdown.defaultProps = {
  isColumnUsableWithMeasureArgument // Imported above.
};

ColumnDropdown.propTypes = {
  // Just a DOM ID.
  id: PropTypes.string,

  // See:
  // https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_aria-labelledby_attribute
  labelledBy: PropTypes.string,

  // In order to determine which columns to display,
  // we need to know where we want to put this column
  // in the measure arguments. Some sane values for this
  // include: valueColumn dateColumn numeratorColumn denominatorColumn
  measureArgument: PropTypes.string.isRequired,

  // Currently selected column field name. Note this is a controlled
  // component - it's up to the consumer to provide updated values
  // for this prop.
  columnFieldName: PropTypes.string,

  // The list of columns we will look through. Any columns
  // relevant to the given measure and measureArgument will
  // be presented to the user.
  displayableFilterableColumns: PropTypes.arrayOf(PropTypes.shape({
    renderTypeName: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    fieldName: PropTypes.string.isRequired
  })),

  // Measure we're choosing columns for.
  measure: PropTypes.object.isRequired,

  // Called back with the column fieldName when the user makes a selection.
  onSelectColumn: PropTypes.func.isRequired,

  // The default column suitability check can be overridden here. We expect the following signature:
  // (column, measure, measureArgument) => boolean
  //
  // column, measure, and measureArgument all come from the props (displayableFilterableColumns, measure, and
  // measureArgument, respectively).
  isColumnUsableWithMeasureArgument: PropTypes.func
};
