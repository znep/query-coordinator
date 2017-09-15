import _ from 'lodash';
import I18n from 'common/i18n';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Dropdown } from 'common/components';
import { getPrecision } from '../selectors/vifAuthoring';
import { setPrecision } from '../actions';
import { TIMELINE_PRECISION } from '../constants';

export class TimelinePrecisionSelector extends Component {

  render() {
    const { onSelectTimelinePrecision, timelinePrecision, vifAuthoring } = this.props;
    const defaultPrecision = getPrecision(vifAuthoring) || null;

    const options = _.map(timelinePrecision, (option) => {
      option.render = this.renderTimelinePrecisionOption;
      return option;
    });

    const attributes = {
      id: 'timeline-precision-selection',
      onSelection: onSelectTimelinePrecision,
      options,
      value: defaultPrecision
    };

    return (
      <div className="authoring-field">
        <label className="block-label" htmlFor="timeline-precision">
          {I18n.t('shared.visualizations.panes.data.fields.timeline_precision.title')}
        </label>
        <div id="timeline-precision" className="authoring-field">
          <Dropdown {...attributes} />
        </div>
      </div>
    );
  }
}

TimelinePrecisionSelector.defaultProps = {
  timelinePrecision: _.cloneDeep(TIMELINE_PRECISION)
};

TimelinePrecisionSelector.propTypes = {
  vifAuthoring: PropTypes.object
};

const mapStateToProps = state => {
  return _.pick(state, ['vifAuthoring']);
};

const mapDispatchToProps = dispatch => ({
  onSelectTimelinePrecision: (timelinePrecision) => {
    dispatch(setPrecision(timelinePrecision.value));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(TimelinePrecisionSelector);
