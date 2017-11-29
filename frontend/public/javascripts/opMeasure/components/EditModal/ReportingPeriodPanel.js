import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import I18n from 'common/i18n';

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
    return null; // TODO
  }

  renderReportingPeriodType() {
    return null; // TODO
  }

  render() {
    const { startDate, onChangeStartDate } = this.props;

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

function mapStateToProps(state) {
  return _.pick(state.editor.measure.metric, 'reportingPeriod');
}

function mapDispatchToProps(dispatch) {
  const bindEventValue = (func) => (event) => func(event.currentTarget.value);

  return bindActionCreators({
    onChangeStartDate: bindEventValue(setStartDate)
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ReportingPeriodPanel);
