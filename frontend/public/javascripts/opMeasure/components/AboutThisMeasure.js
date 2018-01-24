import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import I18n from 'common/i18n';

import { PeriodTypes } from '../lib/constants';

// Pane containing high-level (mostly prose) description of the measure.
export class AboutThisMeasure extends Component {
  render() {
    const calculationType = _.get(this.props, 'measure.metricConfig.type', '');
    const {
      size: reportingPeriodSize,
      type: reportingPeriodType
    } = _.get(this.props, 'measure.metricConfig.reportingPeriod', {});

    // We only want to display this component when it will contain some info.
    if (!calculationType && !(reportingPeriodSize && reportingPeriodType)) {
      return null;
    }

    let reportingPeriodText = '—';
    if (reportingPeriodType && reportingPeriodSize) {
      if (reportingPeriodType === PeriodTypes.OPEN) {
        reportingPeriodText = I18n.t(
          `open_performance.measure.edit_modal.reporting_period.size.${reportingPeriodSize}_to_date`
        );
      } else if (reportingPeriodType === PeriodTypes.CLOSED) {
        reportingPeriodText = I18n.t(
          `open_performance.measure.edit_modal.reporting_period.size.${reportingPeriodSize}`
        );
      }
    }

    let calculationTypeText = '—';
    if (calculationType) {
      calculationTypeText = I18n.t(
        `open_performance.calculation_types.${calculationType}`
      );
    }

    return (
      <div className="about-measure">
        <h4 className="about-measure-title">
          {I18n.t('open_performance.measure.about_this_measure')}
        </h4>
        <div className="metadata-table-wrapper">
          <div className="metadata-section">
            <dl className="metadata-column">
              <div className="metadata-pair">
                <dt className="metadata-pair-key">
                  {I18n.t('open_performance.measure.reporting_period')}
                </dt>
                <dd className="metadata-pair-value reporting-period-text">
                  {reportingPeriodText}
                </dd>
              </div>
              <div className="metadata-pair">
                <dt className="metadata-pair-key">
                  {I18n.t('open_performance.measure.calculation_type')}
                </dt>
                <dd className="metadata-pair-value calculation-type-text">
                  {calculationTypeText}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    );
  }
}

AboutThisMeasure.propTypes = {
  measure: PropTypes.shape({
    metricConfig: PropTypes.object
  }).isRequired
};

function mapStateToProps(state) {
  return state.view;
}

export default connect(mapStateToProps)(AboutThisMeasure);
