import _ from 'lodash';
import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import I18n from 'common/i18n';

import { launchEditModal } from '../actions/editor';
import { ModeStates } from '../lib/constants';

// Pane containing high-level (mostly prose) description of the measure.
export class SummaryPane extends Component {
  renderOverview() {
    const { description } = this.props.measure;

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
          <p>{description || '(No description provided)'}</p>
        </div>
      </div>
    );
  }

  renderMethodsAndAnalysis() {
    const { measure, mode, onClickEdit } = this.props;

    let editButton = null;
    if (mode === ModeStates.EDIT) {
      editButton = (
        <div className="btn-group">
          <button className="btn btn-alternate-2 btn-sm btn-edit" onClick={onClickEdit}>
            {I18n.t('open_performance.edit')}
          </button>
        </div>
      );
    }

    return (
      <div className="summary-pane-description">
        {editButton}

        <h4>Methods and Analysis</h4>

        <h5>Methods</h5>
        <p>{measure.metadata.methods}</p>

        <h5>Analysis</h5>
        <p>{measure.metadata.analysis}</p>
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
       {this.renderMethodsAndAnalysis()}
      </div>
    );
  }
}

SummaryPane.propTypes = {
  activePane: PropTypes.string,
  measure: PropTypes.object,
  mode: PropTypes.oneOf(_.values(ModeStates)),
  onClickEdit: PropTypes.func
};

function mapStateToProps(state) {
  return state.view;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onClickEdit: launchEditModal
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SummaryPane);
