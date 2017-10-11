import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import I18n from 'common/i18n';
import { Checkbox } from 'common/components';
import { toggleExcludeNullValues } from '../../../actions/editor';

export class Count extends Component {

  // Left-hand pane with count-specific options.
  renderConfigPane() {
    const { onToggleExcludeNullValues, excludeNullValues } = this.props;
    return (
      <div className="metric-config">
        <Checkbox id="exclude-null-values" onChange={onToggleExcludeNullValues} checked={excludeNullValues}>
          {I18n.t('open_performance.measure.edit_modal.calculation.types.count.exclude_nulls')}
        </Checkbox>
      </div>
    );
  }

  renderDefinitionText() {
    return (
      <div className="metric-definition-text">
        <h5>
          {I18n.t('open_performance.measure.edit_modal.calculation.types.count.help_title')}
        </h5>
        {I18n.t('open_performance.measure.edit_modal.calculation.types.count.help_body')}
      </div>
    );
  }

  render() {
    return (
      <div className="metric-container">
        {this.renderConfigPane()}
        {this.renderDefinitionText()}
      </div>
    );
  }
}

Count.propTypes = {
  excludeNullValues: PropTypes.bool.isRequired,
  onToggleExcludeNullValues: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  const excludeNullValues = _.get(state, 'editor.measure.metric.arguments.excludeNullValues', false);

  return {
    excludeNullValues
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onToggleExcludeNullValues: toggleExcludeNullValues
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Count);
