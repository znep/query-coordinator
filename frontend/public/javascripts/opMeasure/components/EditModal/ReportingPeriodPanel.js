import _ from 'lodash';
import moment from 'moment';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import I18n from 'common/i18n';
import { DatePicker } from 'common/components/DatePicker';

import {
  setStartDate,
  setPeriodType,
  setPeriodSize
} from '../../actions/editor';

import {
  PeriodTypes,
  PeriodSizes
} from '../../lib/constants';

import ReportingPeriodSize from './ReportingPeriodSize';

function t(subkey) {
  return I18n.t(`open_performance.measure.edit_modal.reporting_period.${subkey}`);
}

// Configuration panel for the reporting period start date, type, and size.
export class ReportingPeriodPanel extends Component {
  renderCollectionFrequency() {
    return null; // TODO
  }

  renderStartDate() {
    const { startDate, onChangeStartDate } = this.props;
    return (
      <DatePicker
        date={startDate}
        onChangeDate={onChangeStartDate} />
    );
  }

  renderPeriodTypeOption(params) {
    const { type, options, label, body, checked, onChange, placeholder } = params;
    const inputAttributes = {
      id: `period-type-${type}`,
      type: 'radio',
      name: 'period-type-radio',
      onChange,
      checked
    };

    const sizeAttributes = {
      collapsible: !checked,
      options,
      placeholder,
      onOptionSelected: (option) => this.props.onChangePeriodSize(option.value)
    };

    return (
      <div className="period-type-option-container">
        <div className="left-col">
          <input {...inputAttributes} />
        </div>
        <div className="right-col">
          <label htmlFor={inputAttributes.id}>
            <span className="fake-radiobutton" />
            <h6>{label}</h6>
          </label>
          <div>
            {body}
            <ReportingPeriodSize {...sizeAttributes} />
          </div>
        </div>
      </div>
    );
  }

  renderReportingPeriodType() {
    const { onChangePeriodType, type, size } = this.props;
    const { OPEN, CLOSED } = PeriodTypes;

    const closedOption = this.renderPeriodTypeOption({
      type: CLOSED,
      label: t('closed_label'),
      body: t('closed_body'),
      checked: type === CLOSED,
      onChange: () => onChangePeriodType(CLOSED),
      options: PeriodSizes.map(sizeValue => ({ value: sizeValue, title: t(`size.${sizeValue}`) })),
      placeholder: size ? t(`size.${size}`) : t('select_size')
    });

    const openOption = this.renderPeriodTypeOption({
      type: OPEN,
      label: t('open_label'),
      body: t('open_body'),
      checked: type === OPEN,
      onChange: () => onChangePeriodType(OPEN),
      options: PeriodSizes.map(sizeValue => ({ value: sizeValue, title: t(`size.${sizeValue}_to_date`) })),
      placeholder: size ? t(`size.${size}_to_date`) : t('select_size')
    });

    return (
      <div className="period-types">
        {closedOption}
        {openOption}
      </div>
    );
  }

  render() {
    return (
      <div>
        <h3 className="reporting-period-panel-title">{t('title')}</h3>
        {this.renderCollectionFrequency()}
        <form onSubmit={(event) => event.preventDefault()}>
          <div className="configuration-field">
            <h5>{t('start_date_label')}</h5>
            {this.renderStartDate()}
          </div>

          <div className="configuration-field">
            <h5>{t('type_label')}</h5>
            {this.renderReportingPeriodType()}
          </div>
        </form>
      </div>
    );
  }
}

// TODO: Consider if we should make ALL properties required and then force
//       ourselves to setup default state in the reducer.
ReportingPeriodPanel.propTypes = {
  startDate: PropTypes.string,
  type: PropTypes.oneOf(_.values(PeriodTypes)),
  size: PropTypes.oneOf(PeriodSizes),
  onChangeStartDate: PropTypes.func.isRequired,
  onChangePeriodType: PropTypes.func.isRequired,
  onChangePeriodSize: PropTypes.func.isRequired
};

// TODO: All default props should be defined in the reducer, instead of inside components.
//       I do support default values if the field is not connected to redux, but in
//       this case, the startDate should be set in redux before this component is created.
ReportingPeriodPanel.defaultProps = {
  startDate: moment().startOf('year').format('YYYY-MM-DD')
};

function mapStateToProps(state) {
  const reportingPeriod = _.get(state, 'editor.measure.metricConfig.reportingPeriod', {});

  return reportingPeriod;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onChangeStartDate: setStartDate,
    onChangePeriodType: setPeriodType,
    onChangePeriodSize: setPeriodSize
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ReportingPeriodPanel);
