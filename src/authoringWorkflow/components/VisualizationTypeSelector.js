import _ from 'lodash';
import classNames from 'classnames';
import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import Styleguide from 'socrata-components';

import { translate } from '../../I18n';
import { VISUALIZATION_TYPES } from '../constants';
import { setVisualizationType } from '../actions';
import {
  getAnyDimension,
  getSelectedVisualizationType,
  isRegionMap
} from '../selectors/vifAuthoring';

import {
  getRecommendedVisualizationTypes,
  hasData,
  hasRegions
} from '../selectors/metadata';

export const VisualizationTypeSelector = React.createClass({
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
    const recommendedLabel = isRecommended ? (
      <div className="visualization-type-recommended-label">
        <span className="visualization-type-recommended-indicator" />
        <span>{translate('panes.data.fields.visualization_type.recommended')}</span>
      </div>
    ) : null;

    const recommendedInfo = isRecommended ? (
      <p className="visualization-type-info">
        {translate('panes.data.fields.visualization_type.recommended_based_on')}
      </p>
    ) : null;

    const flyoutAttributes = {
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

  renderEmptyRegionAlert() {
    const { metadata, vifAuthoring } = this.props;
    const alertAttributes = {
      id: 'empty-region-selection-alert',
      className: 'empty-region-selection-alert alert warning'
    };

    return !hasRegions(metadata) && isRegionMap(vifAuthoring) ? (
      <div {...alertAttributes}>
        <div>
          <span className="icon-warning" />
        </div>
        <div>
          <p>{translate('panes.data.fields.visualization_type.no_boundaries')}</p>
          <p dangerouslySetInnerHTML={{__html: translate('panes.data.fields.visualization_type.ask_site_admin')}} />
        </div>
      </div>
    ) : null;
  },

  renderVisualizationTypeButton(visualizationType) {
    const { metadata, vifAuthoring } = this.props;

    const recommendedVisualizationTypes = getRecommendedVisualizationTypes(metadata, getAnyDimension(vifAuthoring));
    const isRecommended = _.some(recommendedVisualizationTypes, {type: visualizationType});
    const isSelected = visualizationType === getSelectedVisualizationType(vifAuthoring);

    const visualizationTypeMetadata = _.find(VISUALIZATION_TYPES, {type: visualizationType});
    const flyout = this.renderVisualizationTypeFlyout(visualizationTypeMetadata, isRecommended);

    const buttonAttributes = {
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
    const attributes = {
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
        {this.renderEmptyRegionAlert()}
      </div>
    );
  },

  render() {
    const { metadata } = this.props;

    return hasData(metadata) ?
      this.renderVisualizationTypeSelector() :
      null;
  }
});

function mapStateToProps(state) {
  const { vifAuthoring, metadata } = state;
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
