import _ from 'lodash';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Dropdown } from 'common/components';
import I18n from 'common/i18n';

import { COLUMN_TYPES } from '../constants';
import { getBoundaryColorByColumn, getMapType } from '../selectors/vifAuthoring';
import { getNumericalAndTextColumns } from '../selectors/metadata';
import { setBoundaryColorByColumn } from '../actions';

export class BoundaryMapOptionsSelector extends Component {
  getNumericalAndTextColumnAttributes = () => {
    const {
      metadata,
      onSelectBoundaryColorByColumn,
      vifAuthoring
    } = this.props;
    const columnOptions = _.map(getNumericalAndTextColumns(metadata), column => ({
      title: column.name,
      value: column.fieldName,
      type: column.renderTypeName,
      render: this.renderColumnOption
    }));
    const options = [
      {
        title: I18n.t('no_value', { scope: this.scope }),
        value: null
      },
      ...columnOptions
    ];

    return {
      disabled: columnOptions.length === 0,
      id: 'color-boundaries-by-column-dropdown',
      placeholder: I18n.t('no_value', { scope: this.scope }),
      options,
      onSelection: onSelectBoundaryColorByColumn,
      value: getBoundaryColorByColumn(vifAuthoring)
    };
  }

  scope = 'shared.visualizations.panes.data.fields.boundary_map_options';

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
    const numericalAndTextColumnAttributes = this.getNumericalAndTextColumnAttributes();

    return (
      <div className="authoring-field" id="color-boundaries-by-column-selection">
        <label
          className="block-label"
          htmlFor="color-boundaries-by-column-dropdown">
          {I18n.t('boundary_color_by_value', { scope: this.scope })}
        </label>

        <div className="color-boundaries-by-column-dropdown-container">
          <Dropdown {...numericalAndTextColumnAttributes} />
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
