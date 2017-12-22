import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

import I18n from 'common/i18n';
import { SocrataIcon } from 'common/components';

import AboutThisMeasure from './AboutThisMeasure';
import SavedMeasureResultCard from './SavedMeasureResultCard';

// Pane containing the primary visual representations of the metric (value of
// most recent reporting period + timeline), as well as prose information about
// the methodological underpinnings of the measure.
export class SummaryPane extends Component {
  renderScrollPane() {
    const { measure, coreView } = this.props;
    const { shortName } = measure.metadata || {};
    const { name } = coreView;

    return (
      <div className="scroll-pane">
        <h5 className="scroll-pane-title">{shortName || name}</h5>

        <div className="scroll-pane-content">
          <div id="latest-metric">
            <SavedMeasureResultCard measure={this.props.measure} maxLength={6} />

            <div className="scroll-pane-placeholder">
              <SocrataIcon name="number" />
              <div className="scroll-pane-placeholder-text">
                {I18n.t('open_performance.no_dataset')}
              </div>
            </div>
          </div>

          <div id="metric-visualization">
            {/* TODO: timeline visualization here */}

            <div className="scroll-pane-placeholder">
              <SocrataIcon name="line-chart" />
              <div className="scroll-pane-placeholder-text">
                {I18n.t('open_performance.no_visualization')}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderMethodsAndAnalysis() {
    const metadata = _.get(this.props.measure, 'metadata', {});

    const isUnconfigured = !metadata.methods && !metadata.analysis;

    const containerClasses = classNames('methods-and-analysis', {
      unconfigured: isUnconfigured
    });

    return (
      <div className={containerClasses}>
        <h4>{I18n.t('open_performance.measure.methods_and_analysis.combined')}</h4>

        {
          _.map(['methods', 'analysis'], (sectionName) => {
            const sectionContents = metadata[sectionName];
            if (!sectionContents) {
              return null;
            }

            return [
              <h5 key={`${sectionName}-header`}>
                {I18n.t(`open_performance.measure.methods_and_analysis.${sectionName}`)}
              </h5>,
              <p key={`${sectionName}-contents`}>
                {sectionContents}
              </p>
            ];
          })
        }

        {
          isUnconfigured &&
            <p>{I18n.t('open_performance.measure.methods_and_analysis.placeholder')}</p>
        }
      </div>
    );
  }

          // {this.renderLatestMetric()}

  render() {
    return (
      <div className="pane" data-pane="summary">
        <div className="summary-pane-upper">
          {this.renderScrollPane()}
        </div>

        <div className="summary-pane-lower">
          <AboutThisMeasure />
          {this.renderMethodsAndAnalysis()}
        </div>
      </div>
    );
  }
}

SummaryPane.propTypes = {
  coreView: PropTypes.shape({
    name: PropTypes.string,
  }).isRequired,
  measure: PropTypes.shape({
    shortName: PropTypes.string,
    metadata: PropTypes.shape({
      analysis: PropTypes.string,
      methods: PropTypes.string
    })
  }).isRequired
};

function mapStateToProps(state) {
  return state.view;
}

export default connect(mapStateToProps)(SummaryPane);
