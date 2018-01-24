import _ from 'lodash';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Dropdown } from 'common/components';
import I18n from 'common/i18n';

import { COLUMN_TYPES } from '../constants';
import { getLineColorByColumn, getLineWeightByColumn, getMapType } from '../selectors/vifAuthoring';
import { getDisplayableColumns, getNumericalColumns } from '../selectors/metadata';
import { setLineColorByColumn, setLineWeightByColumn } from '../actions';

export class LineMapOptionsSelector extends Component {
  renderLineMapColumnOption = (option) => {
    const columnType = _.find(COLUMN_TYPES, { type: option.type });
    const icon = columnType ? columnType.icon : '';

    return (
      <div className="dataset-column-selector-option">
        <span className={icon}></span> {option.title}
      </div>
    );
  }

  renderLineMapOptionsDropdown = (dropdownId, optionsData, onSelection, defaultValue) => {
    const { vifAuthoring, metadata, translationScope } = this.props;
    const columnOptions = _.map(optionsData, column => ({
      title: column.name,
      value: column.fieldName,
      type: column.renderTypeName,
      render: this.renderLineMapColumnOption
    }));
    const options = [
      {
        title: I18n.t('no_value', { scope: translationScope }),
        value: null
      },
      ...columnOptions
    ];
    const hasOnlyDefaultValue = options.length <= 1;

    return {
      disabled: hasOnlyDefaultValue,
      id: dropdownId,
      placeholder: I18n.t('no_value', { scope: translationScope }),
      options,
      onSelection,
      value: defaultValue
    };
  }

  renderLineWeightSelector = () => {
    const {
      vifAuthoring,
      metadata,
      onWeighLinesByValueSelection,
      translationScope
    } = this.props;
    const numericalColumnAttributes = this.renderLineMapOptionsDropdown(
      'line-weight-by-value-dropdown',
      getNumericalColumns(metadata),
      onWeighLinesByValueSelection,
      getLineWeightByColumn(vifAuthoring)
    );

    return (
      <div className="authoring-field" id="weigh-lines-by-value-selection">
        <label
          className="block-label"
          htmlFor="base-layer">{I18n.t('line_weight_by_value', { scope: translationScope })}</label>
        <div className="base-layer-dropdown-container">
          <Dropdown {...numericalColumnAttributes} />
        </div>
      </div>
    );
  }

  renderLineColorSelector = () => {
    const {
      vifAuthoring,
      metadata,
      onColorLinesByValueSelection,
      translationScope
    } = this.props;
    const allColumnAttributes = this.renderLineMapOptionsDropdown(
      'line-color-by-value-dropdown',
      getDisplayableColumns(metadata),
      onColorLinesByValueSelection,
      getLineColorByColumn(vifAuthoring)
    );

    return (
      <div className="authoring-field" id="color-lines-by-value-selection">
        <label
          className="block-label"
          htmlFor="base-layer">{I18n.t('line_color_by_value', { scope: translationScope })}</label>
        <div className="base-layer-dropdown-container">
          <Dropdown {...allColumnAttributes} />
        </div>
      </div>
    );
  }

  render() {
    const { vifAuthoring } = this.props;
    const isLineMap = _.isEqual(getMapType(vifAuthoring), 'lineMap');

    return isLineMap ? (
      <div>
        {this.renderLineWeightSelector()}
        {this.renderLineColorSelector()}
      </div>
    ) : null;
  }
}

LineMapOptionsSelector.propTypes = {
  vifAuthoring: PropTypes.object,
  metadata: PropTypes.object,
  onWeighLinesByValueSelection: PropTypes.func,
  onColorLinesByValueSelection: PropTypes.func
};

LineMapOptionsSelector.defaultProps = {
  translationScope: 'shared.visualizations.panes.data.fields.line_map_options'
};

function mapStateToProps(state) {
  var { vifAuthoring, metadata } = state;
  return { vifAuthoring, metadata };
}

function mapDispatchToProps(dispatch) {
  return {
    onWeighLinesByValueSelection: (option) => {
      dispatch(setLineWeightByColumn(option.value));
    },

    onColorLinesByValueSelection: (option) => {
      dispatch(setLineColorByColumn(option.value));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(LineMapOptionsSelector);
