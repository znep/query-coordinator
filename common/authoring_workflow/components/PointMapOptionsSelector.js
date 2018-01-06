import _ from 'lodash';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Dropdown } from 'common/components';
import I18n from 'common/i18n';

import { COLUMN_TYPES } from '../constants';
import {
  getPointColorByColumn,
  getPointSizeByColumn,
  getMapType,
  getPointAggregation
} from '../selectors/vifAuthoring';
import { getNumericalAndTextColumns, getNumericalColumns } from '../selectors/metadata';
import { setPointColorByColumn, setPointSizeByColumn } from '../actions';

export class PointMapOptionsSelector extends Component {
  renderPointMapColumnOption = (option) => {
    const columnType = _.find(COLUMN_TYPES, { type: option.type });
    const icon = columnType ? columnType.icon : '';

    return (
      <div className="dataset-column-selector-option">
        <span className={icon}></span> {option.title}
      </div>
    );
  }

  renderPointMapOptionsDropdown = (dropdownId, optionsData, onSelection, defaultValue) => {
    const { vifAuthoring, metadata, translationScope } = this.props;
    const columnOptions = _.map(optionsData, column => ({
      title: column.name,
      value: column.fieldName,
      type: column.renderTypeName,
      render: this.renderPointMapColumnOption
    }));
    const options = [
      {
        title: I18n.t('no_value', { scope: translationScope }),
        value: null
      },
      ...columnOptions
    ];
    const hasPointAggregation = _.includes(['heat_map', 'region_map'], getPointAggregation(vifAuthoring));
    const disabled = (columnOptions.length === 0) || hasPointAggregation;

    return {
      disabled,
      id: dropdownId,
      placeholder: I18n.t('no_value', { scope: translationScope }),
      options,
      onSelection,
      value: defaultValue
    };
  }

  renderPointSizeSelector = () => {
    const {
      vifAuthoring,
      metadata,
      onResizePointsByValueSelection,
      translationScope
    } = this.props;
    const numericalColumnAttributes = this.renderPointMapOptionsDropdown(
      'resize-points-by-value-dropdown',
      getNumericalColumns(metadata),
      onResizePointsByValueSelection,
      getPointSizeByColumn(vifAuthoring)
    );

    return (
      <div className="authoring-field" id="resize-points-by-value-selection">
        <label
          className="block-label"
          htmlFor="base-layer">{I18n.t('resize_points_by_value', { scope: translationScope })}</label>
        <div className="base-layer-dropdown-container">
          <Dropdown {...numericalColumnAttributes} />
        </div>
      </div>
    );
  }

  renderPointColorSelector = () => {
    const {
      vifAuthoring,
      metadata,
      onColorPointsByValueSelection,
      translationScope
    } = this.props;
    const allColumnAttributes = this.renderPointMapOptionsDropdown(
      'color-by-value-dropdown',
      getNumericalAndTextColumns(metadata),
      onColorPointsByValueSelection,
      getPointColorByColumn(vifAuthoring)
    );

    return (
      <div className="authoring-field" id="color-points-by-value-selection">
        <label
          className="block-label"
          htmlFor="base-layer">{I18n.t('color_points_by_value', { scope: translationScope })}</label>
        <div className="base-layer-dropdown-container">
          <Dropdown {...allColumnAttributes} />
        </div>
      </div>
    );
  }

  render() {
    const { vifAuthoring } = this.props;
    const isPointMap = _.isEqual(getMapType(vifAuthoring), 'pointMap');

    return isPointMap ? (
      <div>
        {this.renderPointSizeSelector()}
        {this.renderPointColorSelector()}
      </div>
    ) : null;
  }
}

PointMapOptionsSelector.propTypes = {
  vifAuthoring: PropTypes.object,
  metadata: PropTypes.object,
  onResizePointsByValueSelection: PropTypes.func,
  onColorPointsByValueSelection: PropTypes.func
};

PointMapOptionsSelector.defaultProps = {
  translationScope: 'shared.visualizations.panes.data.fields.point_map_options'
};

function mapStateToProps(state) {
  var { vifAuthoring, metadata } = state;
  return { vifAuthoring, metadata };
}

function mapDispatchToProps(dispatch) {
  return {
    onResizePointsByValueSelection: (option) => {
      dispatch(setPointSizeByColumn(option.value));
    },

    onColorPointsByValueSelection: (option) => {
      dispatch(setPointColorByColumn(option.value));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(PointMapOptionsSelector);
