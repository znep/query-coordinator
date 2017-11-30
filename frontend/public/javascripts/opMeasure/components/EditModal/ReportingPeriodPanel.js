import _ from 'lodash';
import moment from 'moment';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import DatePicker from 'react-datepicker';

import I18n from 'common/i18n';
import SocrataIcon from 'common/components/SocrataIcon';

import { setStartDate } from '../../actions/editor';

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

    const datepickerProps = {
      className: 'text-input date-picker-input',
      dateFormatCalendar: 'MMMM YYYY',
      fixedHeight: true,
      selected: moment(startDate),
      onChange: (value) => {
        onChangeStartDate(value.format('YYYY-MM-DD'));
      }
    };

    return (
      <div className="reporting-period-start">
        <SocrataIcon name="date" />
        <DatePicker {...datepickerProps} />
      </div>
    );
  }

  renderReportingPeriodType() {
    return null; // TODO
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

ReportingPeriodPanel.propTypes = {
  startDate: PropTypes.string,
  onChangeStartDate: PropTypes.func.isRequired
};

ReportingPeriodPanel.defaultProps = {
  startDate: moment().startOf('year').format('YYYY-MM-DD')
};

function mapStateToProps(state) {
  return _.get(state.editor.measure, 'metric.reportingPeriod', {});
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onChangeStartDate: setStartDate
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ReportingPeriodPanel);
