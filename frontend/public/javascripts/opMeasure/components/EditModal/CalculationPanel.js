import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';

import I18n from 'common/i18n';

import { setCalculationType } from '../../actions/editor';

import calculationTypes from './calculationTypes';

// Configuration panel for methods and analysis.
export class CalculationPanel extends Component {
  renderSpecificCalculator() {
    const { calculationType, hasDataSource } = this.props;

    if (hasDataSource) {
      switch (calculationType) {
        case 'count':
          return (<calculationTypes.Count />);
        default:
          throw new Error(`Unknown calculation type: ${calculationType}`);
      }
    } else {
      return (<div className="no-data-source">
        <h2>
          {I18n.t('open_performance.measure.edit_modal.calculation.data_source_needed')}
        </h2>
      </div>);
    }
  }

  render() {
    const { hasDataSource, calculationType } = this.props;
    const isCount = calculationType === 'count';
    const countButtonClassName = classNames({
      'btn': true,
      'btn-default': true,
      'btn-primary': isCount
    });

    return (
      <div>
        <h3>
          {I18n.t('open_performance.measure.edit_modal.calculation.title')}
        </h3>
        <p>
          {I18n.t('open_performance.measure.edit_modal.calculation.subtitle')}
        </p>
        <form onSubmit={(event) => event.preventDefault()}>
          <div className="calculation-type-selector btn-group">
            <button
              className={countButtonClassName}
              disabled={!hasDataSource}
              onClick={() => this.props.onSetCalculationType('count')}>
              {I18n.t('open_performance.calculation_types.count')}
            </button>
          </div>
          {this.renderSpecificCalculator()}
        </form>
      </div>
    );
  }
}

CalculationPanel.propTypes = {
  hasDataSource: PropTypes.bool.isRequired,
  calculationType: PropTypes.string,
  onSetCalculationType: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  return {
    hasDataSource: !!_.get(state, 'editor.measure.metric.dataSource.uid'),
    calculationType: _.get(state, 'editor.measure.metric.type')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onSetCalculationType: setCalculationType
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(CalculationPanel);
