import _ from 'lodash';
import cssModules from 'react-css-modules';
import moment from 'moment';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import I18n from 'common/i18n';
import DateRangePicker from 'common/components/DateRangePicker';

import {
  AGGREGATION_TYPES,
  DATE_COLUMN_TYPES,
  LOCATION_COLUMN_TYPES,
  NUMBER_COLUMN_TYPES,
  STRING_COLUMN_TYPES
} from 'common/components/CreateAlertModal/constants';

import DatasetColumnValueTypeahead from '../DatasetColumnValueTypeahead';
import GeocoderTypeahead from '../GeocoderTypeahead';
import RadiusSlider from '../RadiusSlider';
import styles from '../components.module.scss';
import SoqlSliceBuilderPropType from './SoqlSliceBuilderPropType';


/**
 Renders value input field(s) based on the selected column type. If the selected column is
 date column => render a dateRangePicker
 geometry column => renders a geocoder and a radius slider
 text column => renders a DatasetColumnValueTypeahead
 otherwise => renders a simple textbox
 For exact column types, check (LOCATION_COLUMN_TYPES/DATE_COLUMN_TYPES/...) in common/components/CreateAlertModal/constants.js
*/
class SoqlSliceBuilderValueField extends Component {

  onDatePickerChange = (dateRange) => {
    const { onValueChange } = this.props;
    onValueChange('start_date', dateRange.start);
    onValueChange('end_date', dateRange.end);
  };

  onLocationValueChange = (geocodeResult) => {
    const { onValueChange, slice } = this.props;
    const coordinates = _.get(geocodeResult, 'geometry.coordinates', []);

    // location columns lat, lng values
    onValueChange('lng', coordinates[0]);
    onValueChange('lat', coordinates[1]);
    onValueChange('location', _.get(geocodeResult, 'value'));

    // adding default value for radius slider
    onValueChange('radius', _.get(slice, 'radius', 1));
  };

  translationScope = 'shared.components.create_alert_modal.custom_alert';

  renderLocationValueInput() {
    const { mapboxAccessToken, onValueChange, slice } = this.props;
    let radiusInputField;
    let geocoderInputField;

    if (!_.isEmpty(slice.operator)) {
      geocoderInputField = (
        <GeocoderTypeahead
          mapboxAccessToken={mapboxAccessToken}
          onSelect={this.onLocationValueChange}
          value={slice.location} />
      );
    }
    if (!_.isEmpty(slice.location)) {
      radiusInputField = (
        <RadiusSlider
          // sometimes (eg: editmode ) radius value may be string & slider accepts only number
          value={Number(slice.radius)}
          onChange={(value) => onValueChange('radius', value)} />
      );
    }

    return (
      <div styleName="field-selector">
        {geocoderInputField}
        {radiusInputField}
      </div>
    );
  }

  renderTextValueInput() {
    const { haveNbeView, onValueChange, selectedColumn, slice, viewId } = this.props;

    if (!_.isEmpty(slice.operator)) {
      return (
        <div styleName="field-selector" className="column-value-field">
          <DatasetColumnValueTypeahead
            column={selectedColumn.value}
            haveNbeView={haveNbeView}
            value={slice.value}
            viewId={viewId}
            onSelect={(option) => { onValueChange('value', option.value); }} />
        </div>
      );
    }
  }

  renderDateValueInput() {
    const { slice } = this.props;
    const today = moment().format('YYYY-MM-DD');
    const startDate = _.get(slice, 'start_date', today);
    const endDate = _.get(slice, 'end_date', today);
    const dateRangeOptions = {
      datePickerOverrides: {
        popperModifiers: {
          preventOverflow: {
            boundariesElement: 'viewport',
            enabled: true,
            escapeWithReference: false
          }
        },
        popperPlacement: 'left-start'
      },
      onChange: this.onDatePickerChange,
      value: { start: startDate, end: endDate }
    };

    if (!_.isEmpty(slice.operator)) {
      return (
        <div className="range-filter-container date-range" styleName="field-selector">
          <DateRangePicker {...dateRangeOptions} />
        </div>
      );
    }
  }

  renderOtherValueInput() {
    const { onValueChange, selectedColumn } = this.props;
    const { aggregation, function_operator, operator, value } = this.props.slice;
    const columnType = _.get(selectedColumn, 'column_type');
    const otherInputTypes = _.concat(NUMBER_COLUMN_TYPES, ['row_identifier']);
    const showAggregationInput = _.includes(AGGREGATION_TYPES, aggregation);
    const placeHolder = I18n.t('placeholder.value', { scope: this.translationScope });
    const showValueInput = (showAggregationInput && !_.isEmpty(function_operator)) ||
      (!_.isEmpty(operator) && !showAggregationInput);

    if (showValueInput && _.includes(otherInputTypes, columnType)) {
      return (
        <div styleName="field-selector" className="value-field">
          <input
            styleName="value-input"
            type="text"
            placeholder={placeHolder}
            value={value}
            onChange={(event) => onValueChange('value', event.target.value)} />
        </div>
      );
    }
  }

  render() {
    const { selectedColumn } = this.props;
    const columnType = _.get(selectedColumn, 'column_type');
    let valueInputField;

    if (_.includes(STRING_COLUMN_TYPES, columnType)) {
      valueInputField = this.renderTextValueInput();
    } else if (_.includes(DATE_COLUMN_TYPES, columnType)) {
      valueInputField = this.renderDateValueInput();
    } else if (_.includes(LOCATION_COLUMN_TYPES, columnType)) {
      valueInputField = this.renderLocationValueInput();
    } else {
      valueInputField = this.renderOtherValueInput();
    }

    return valueInputField;
  }
}

SoqlSliceBuilderValueField.propTypes = {
  haveNbeView: PropTypes.bool,
  mapboxAccessToken: PropTypes.string,
  selectedColumn: PropTypes.object,
  slice: SoqlSliceBuilderPropType.isRequired,
  viewId: PropTypes.string,
  onValueChange: PropTypes.func.isRequired
};

export default cssModules(SoqlSliceBuilderValueField, styles, { allowMultiple: true });
