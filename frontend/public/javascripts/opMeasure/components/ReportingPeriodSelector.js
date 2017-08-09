import React, { Component } from 'react';
import { connect } from 'react-redux';

import { SocrataIcon } from 'common/components';
import I18n from 'common/i18n';

export class ReportingPeriodSelector extends Component {
  render() {
    // TODO: Add aria-label to the toggles
    return (
      <div className="reporting-period">
        <div className="reporting-period-wrapper">
          <div className="reporting-period-control-container">
            <div
              className="reporting-period-control-toggle btn-default"
              role="button"
              tabIndex="0">
              {I18n.t('open_performance.measure.reporting_period')}
              <span className="arrow-down-icon">
                <SocrataIcon name="arrow-down" />
              </span>
            </div>
          </div>
          <div className="reporting-period-config-container">
            <div
              className="reporting-period-config-toggle btn-default"
              role="button"
              tabIndex="0">
              <span className="kebab-icon">
                <SocrataIcon name="kebab" />
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect()(ReportingPeriodSelector);
