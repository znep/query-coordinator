import _ from 'lodash';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import I18n from 'common/i18n';

import { getPointAggregation, getMapType } from '../selectors/vifAuthoring';
import * as actions from '../actions';

export class PointMapAggregationSelector extends Component {
  renderPointAggregationRadioButton = (pointAggregation) => {
    const { vifAuthoring, onPointMapAggregationChange } = this.props;
    const selectedPointAggregation = getPointAggregation(vifAuthoring);
    const id = `${pointAggregation}_point_aggregation`;
    const inputAttributes = {
      checked: selectedPointAggregation === pointAggregation,
      id,
      name: 'point-aggregation-options',
      type: 'radio',
      onChange: () => { onPointMapAggregationChange(pointAggregation); }
    };
    const className = `${pointAggregation}-point-aggregation-container`;

    return (
      <div className={className}>
        <input {...inputAttributes} />
        <label htmlFor={id}>
          <span className="fake-radiobutton" />
          <div className="translation-within-label">
            {I18n.t(pointAggregation, {
              scope: 'shared.visualizations.panes.data.fields.point_aggregation_options'
            })}
          </div>
        </label>
      </div>
    );
  }

  renderPointAggregationOptions = () => {
    return (
      <div className="radiobutton" id="point-aggregation-options">
        {this.renderPointAggregationRadioButton('none')}
        {this.renderPointAggregationRadioButton('heat_map')}
      </div>
    );
  }

  render() {
    const { vifAuthoring } = this.props;
    const isPointMap = getMapType(vifAuthoring) === 'pointMap';

    return isPointMap ? this.renderPointAggregationOptions() : null;
  }
}

PointMapAggregationSelector.propTypes = {
  vifAuthoring: PropTypes.object,
  metadata: PropTypes.object
};

function mapStateToProps(state) {
  return _.pick(state, ['vifAuthoring', 'metadata']);
}

function mapDispatchToProps(dispatch) {
  return {
    onPointMapAggregationChange: (pointAggregation) => {
      dispatch(actions.setPointAggregation(pointAggregation));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(PointMapAggregationSelector);
