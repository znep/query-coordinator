import _ from 'lodash';
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

export class SummaryPane extends Component {
  renderOverview() {
    return (
      <div className="metadata-table-wrapper">
        <div className="metadata-section">
          <dl className="metadata-row">
            <div className="metadata-pair">
              <dt className="metadata-pair-key">
                Updated
              </dt>
              <dd className="metadata-pair-value">
                June 2, 2017
              </dd>
            </div>
            <div className="metadata-pair">
              <dt className="metadata-pair-key">
                Collection Frequency
              </dt>
              <dd className="metadata-pair-value">
                Weekly
              </dd>
            </div>
            <div className="metadata-pair">
              <dt className="metadata-pair-key">
                Reporting Period
              </dt>
              <dd className="metadata-pair-value">
                Year-to-date
              </dd>
            </div>
            <div className="metadata-pair">
              <dt className="metadata-pair-key">
                Calculation Type
              </dt>
              <dd className="metadata-pair-value">
                Rate
              </dd>
            </div>
          </dl>
          <hr />
          <p>
            Part 1 property crimes are calculated weekly and are a standard FBI index crime.
            The city has been collecting this data since 2003.
          </p>
        </div>
      </div>
    );
  }

  renderDescription() {
    return (
      <div className="summary-pane-description">
        <h4>Methods and Analysis</h4>

        <h5>Methods</h5>
        <p>The Federal Bureau of Investigations (FBI) identifies seven "Part I Index Crimes"
        based on their seriousness and frequency of occurrence. Three categories for property
        crimes include: burglary, theft, and auto theft. The Austin Police Department (APD)
        reports crime counts to the FBI, whose Uniform Crime Reporting (UCR) program provides
        consistent crime reporting across the country.</p>

        <h5>Analysis</h5>
        <p>The FY 2015-16 result is a slight decrease from the previous fiscal year. Austin&apos;s
        property crime rate in calendar year 2015 (the most recent official results) was 37.71,
        6% lower than the rate of 40.11 for large US cities.* In FY 2015-16, Austin ranked 17th
        as the safest city in property crime rates out of large US cities (population 5,000,000
        and greater).</p>
      </div>
    );
  }

  render() {
    const { activePane } = this.props;
    if (activePane !== 'summary') {
      return null;
    }

    return (
      <div className="pane" data-pane="summary">
       {this.renderOverview()}
       {this.renderDescription()}
      </div>
    );
  }
}

SummaryPane.propTypes = {
  activePane: PropTypes.string.isRequired
};

function mapStateToProps(state) {
  return _.pick(state, 'activePane');
}

export default connect(mapStateToProps)(SummaryPane);
