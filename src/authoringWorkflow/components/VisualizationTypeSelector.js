import _ from 'lodash';
import classNames from 'classnames';
import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import Styleguide from 'socrata-styleguide';

import { translate } from '../../I18n';
import { VISUALIZATION_TYPES } from '../constants';
import { setVisualizationType } from '../actions';
import { getAnyDimension, getSelectedVisualizationType } from '../selectors/vifAuthoring';
import {
  hasData,
  getRecommendedVisualizationTypes
} from '../selectors/metadata';

export var VisualizationTypeSelector = React.createClass({
  propTypes: {
    vifAuthoring: PropTypes.object,
    metadata: PropTypes.object,
    onSelectVisualizationType: PropTypes.func
  },

  getDefaultProps() {
    return {
      visualizationTypes: VISUALIZATION_TYPES
    }
  },

  componentDidUpdate() {
    if (this.selector) {
      Styleguide.attachTo(this.selector);
    }
  },

  onClickVisualizationType(visualizationType) {
    return () => this.props.onSelectVisualizationType(visualizationType);
  },

  renderVisualizationTypeFlyout(visualizationType, isRecommended) {
    var recommendedLabel = isRecommended ? (
      <div className="visualization-type-recommended-label">
        <span className="visualization-type-recommended-indicator" />
        <span>{translate('panes.data.fields.visualization_type.recommended')}</span>
      </div>
    ) : null;

    var recommendedInfo = isRecommended ? (
      <p className="visualization-type-info">
        {translate('panes.data.fields.visualization_type.recommended_based_on')}
      </p>
    ) : null;

    var flyoutAttributes = {
      id: `${visualizationType.type}-flyout`,
      className: classNames('visualization-type-flyout flyout flyout-hidden', {
        recommended: isRecommended
      })
    };

    return (
      <div {...flyoutAttributes}>
        <section className="flyout-content">
          <h3 className="flyout-header">
            <div className="visualization-type-title">{visualizationType.title}</div>
            {recommendedLabel}
          </h3>
          {recommendedInfo}
        </section>
      </div>
    );
  },

  renderVisualizationTypeButton(visualizationType) {
    var { metadata, vifAuthoring } = this.props;

    var recommendedVisualizationTypes = getRecommendedVisualizationTypes(metadata, getAnyDimension(vifAuthoring));
    var isRecommended = _.some(recommendedVisualizationTypes, {type: visualizationType});
    var isSelected = visualizationType === getSelectedVisualizationType(vifAuthoring);

    var visualizationTypeMetadata = _.find(VISUALIZATION_TYPES, {type: visualizationType});
    var flyout = this.renderVisualizationTypeFlyout(visualizationTypeMetadata, isRecommended);

    var buttonAttributes = {
      className: classNames('btn btn-default btn-lg', {
        active: isSelected,
        recommended: isRecommended
      }),
      onClick: this.onClickVisualizationType(visualizationType),
      'data-flyout': `${visualizationType}-flyout`
    };

    return (
      <button {...buttonAttributes}>
        <span className={visualizationTypeMetadata.icon}></span>
        {flyout}
      </button>
    );
  },

  renderVisualizationTypeSelector() {
    var attributes = {
      id: 'visualization-type-selection',
      className: 'visualization-type-container',
      ref: (ref) => this.selector = ref
    };

    return (
      <div  {...attributes}>
        <div className="btn-group">
          {this.renderVisualizationTypeButton('columnChart')}
          {this.renderVisualizationTypeButton('timelineChart')}
          {this.renderVisualizationTypeButton('histogram')}
          {this.renderVisualizationTypeButton('featureMap')}
          {this.renderVisualizationTypeButton('regionMap')}
        </div>
      </div>
    );
  },

  render() {
    var { metadata } = this.props;

    return hasData(metadata) ?
      this.renderVisualizationTypeSelector() :
      null;
  }
});

function mapStateToProps(state) {
  var { vifAuthoring, metadata } = state;
  return { vifAuthoring, metadata };
}

function mapDispatchToProps(dispatch) {
  return {
    onSelectVisualizationType(visualizationType) {
      dispatch(setVisualizationType(visualizationType));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(VisualizationTypeSelector);
