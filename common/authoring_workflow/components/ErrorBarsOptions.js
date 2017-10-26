import _ from 'lodash';
import { connect } from 'react-redux';
import { ColorPicker, Dropdown } from 'common/components';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import I18n from 'common/i18n';

import {
  setErrorBarsBarColor,
  setErrorBarsLowerBoundColumnName,
  setErrorBarsUpperBoundColumnName
} from '../actions';

import {
  COLORS
} from '../constants';

import {
  getValidMeasures,
  hasData
} from '../selectors/metadata';

import {
  getErrorBarsColor,
  getErrorBarsLowerBoundColumnName,
  getErrorBarsUpperBoundColumnName
} from '../selectors/vifAuthoring';

export class ErrorBarsOptions extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'renderErrorBarsSelector',
      'renderErrorBarsDropdown'
    ]);
  }

  render() {
    const { metadata } = this.props;
    return hasData(metadata) ? this.renderErrorBarsSelector() : null;
  }

  renderErrorBarsSelector() {
    const {
      onChangeErrorBarsBarColor,
      onSelectErrorBarsLowerBoundColumn,
      onSelectErrorBarsUpperBoundColumn,
      vifAuthoring
    } = this.props;

    const lowerBoundColumnName = getErrorBarsLowerBoundColumnName(vifAuthoring);
    const upperBoundColumnName = getErrorBarsUpperBoundColumnName(vifAuthoring);

    const lowerBoundDropdown = this.renderErrorBarsDropdown(
      'error-bars-lower-bound-column-selection',
      lowerBoundColumnName,
      onSelectErrorBarsLowerBoundColumn);

    const upperBoundDropdown = this.renderErrorBarsDropdown(
      'error-bars-upper-bound-column-selection',
      upperBoundColumnName,
      onSelectErrorBarsUpperBoundColumn);

    const color = getErrorBarsColor(vifAuthoring);

    const colorPickerAttributes = {
      id: 'error-bars-bar-color-picker',
      handleColorChange: onChangeErrorBarsBarColor,
      palette: COLORS,
      value: color
    };

    return (
      <div>
        <div className="authoring-field">
          <label className="block-label" htmlFor="error-bar-lower-bound">
            {I18n.t('shared.visualizations.panes.data.fields.error_bars.lower_bound_column')}
          </label>
          <div id="error-bar-lower-bound" className="authoring-field">
            {lowerBoundDropdown}
          </div>
        </div>
        <div className="authoring-field">
          <label className="block-label" htmlFor="error-bar-upper-bound">
            {I18n.t('shared.visualizations.panes.data.fields.error_bars.upper_bound_column')}
          </label>
          <div id="error-bar-upper-bound" className="authoring-field">
            {upperBoundDropdown}
          </div>
        </div>
        <div className="authoring-field">
          <label className="block-label" htmlFor="error-bars-bar-color-picker">
             {I18n.t('shared.visualizations.panes.data.fields.error_bars.bar_color')}
          </label>
          <ColorPicker {...colorPickerAttributes} />
        </div>
      </div>
    );
  }

  renderErrorBarsDropdown(id, value, onSelection) {
    const { metadata } = this.props;
    const measures = getValidMeasures(metadata);

    const attributes = {
      disabled: (measures.length == 0),
      id,
      onSelection,
      options: [
        { title: I18n.t('shared.visualizations.panes.data.fields.error_bars.none_selected'), value: null },
        ...measures.map(measure => ({
          title: measure.name,
          value: measure.fieldName
        }))
      ],
      placeholder: I18n.translate('shared.visualizations.panes.data.fields.error_bars.select_column'),
      value
    };

    return (
      <Dropdown {...attributes} />
    );
  }
}

ErrorBarsOptions.propTypes = {
  vifAuthoring: PropTypes.object
};

function mapStateToProps(state) {
  const { vifAuthoring, metadata } = state;
  return { vifAuthoring, metadata };
}

function mapDispatchToProps(dispatch) {
  return {
    onChangeErrorBarsBarColor: (color) => {
      dispatch(setErrorBarsBarColor(color));
    },
    onSelectErrorBarsLowerBoundColumn: (selected) => {
      dispatch(setErrorBarsLowerBoundColumnName(selected.value));
    },
    onSelectErrorBarsUpperBoundColumn: (selected) => {
      dispatch(setErrorBarsUpperBoundColumnName(selected.value));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ErrorBarsOptions);
