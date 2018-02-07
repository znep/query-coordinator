import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Dropdown } from 'common/components';
import I18n from 'common/i18n';

import { setBoundaryColorByColumn } from '../actions';
import { COLUMN_TYPES } from '../constants';
import { getNonGeoLocationColumns } from '../selectors/metadata';
import { getBoundaryColorByColumn, getMapType } from '../selectors/vifAuthoring';

const scope = 'shared.visualizations.panes.data.fields.boundary_map_options';

export class BoundaryMapOptionsSelector extends Component {
  getColorByColumnAttributes = () => {
    const { metadata, onSelectBoundaryColorByColumn, vifAuthoring } = this.props;
    const columnOptions = _.map(getNonGeoLocationColumns(metadata), column => ({
      title: column.name,
      value: column.fieldName,
      type: column.renderTypeName,
      render: this.renderColumnOption
    }));
    const options = [
      { title: I18n.t('no_value', { scope }), value: null },
      ...columnOptions
    ];

    return {
      disabled: columnOptions.length === 0,
      id: 'color-boundaries-by-column-dropdown',
      options,
      placeholder: I18n.t('no_value', { scope }),
      value: getBoundaryColorByColumn(vifAuthoring),
      onSelection: onSelectBoundaryColorByColumn
    };
  }

  renderColumnOption = (option) => {
    const columnType = _.find(COLUMN_TYPES, { type: option.type });
    const icon = columnType ? columnType.icon : '';

    return (
      <div className="dataset-column-selector-option">
        <span className={icon}></span> {option.title}
      </div>
    );
  }

  renderBoundaryColorByColumnDropdown = () => {
    return (
      <div className="authoring-field" id="color-boundaries-by-column-selection">
        <label
          className="block-label"
          htmlFor="color-boundaries-by-column-dropdown">
          {I18n.t('boundary_color_by_value', { scope })}
        </label>

        <div className="color-boundaries-by-column-dropdown-container">
          <Dropdown {...this.getColorByColumnAttributes()} />
        </div>
      </div>
    );
  }

  render() {
    const { vifAuthoring } = this.props;
    const isBoundaryMap = getMapType(vifAuthoring) === 'boundaryMap';

    return isBoundaryMap ? this.renderBoundaryColorByColumnDropdown() : null;
  }
}

BoundaryMapOptionsSelector.propTypes = {
  vifAuthoring: PropTypes.object,
  metadata: PropTypes.object,
  onSelectBoundaryColorByColumn: PropTypes.func
};

function mapStateToProps(state) {
  return _.pick(state, ['vifAuthoring', 'metadata']);
}

function mapDispatchToProps(dispatch) {
  return {
    onSelectBoundaryColorByColumn: (option) => {
      dispatch(setBoundaryColorByColumn(option.value));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(BoundaryMapOptionsSelector);
