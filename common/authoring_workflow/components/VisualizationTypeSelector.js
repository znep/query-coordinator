import _ from 'lodash';
import classNames from 'classnames';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { factories } from 'common/components';
import I18n from 'common/i18n';

import { VISUALIZATION_TYPES } from '../constants';
import { setVisualizationType, setColorPalette, setDimension } from '../actions';
import {
  getAnyDimension,
  getSelectedVisualizationType,
  hasCustomColorPalette,
  isRegionMap,
  getPrimaryColor,
  getDimensionGroupingColumnName
} from '../selectors/vifAuthoring';
import {
  getAnyLocationColumn,
  getRecommendedVisualizationTypes,
  hasData,
  hasRegions
} from '../selectors/metadata';

export class VisualizationTypeSelector extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'onClickVisualizationType',
      'renderVisualizationTypeFlyout',
      'renderEmptyRegionAlert',
      'renderVisualizationTypeButton',
      'renderVisualizationTypeSelector'
    ]);
  }

  componentDidUpdate() {
    if (this.selector) {
      new factories.FlyoutFactory(this.selector);
    }
  }

  onClickVisualizationType(visualizationType) {
    return () => {
      const {
        onSelectVisualizationType,
        setDimensionToLocation,
        updateColorPalette,
        updateDimensionGroupingColumnName,
        vifAuthoring,
        metadata
      } = this.props;

      const dimension = getAnyDimension(vifAuthoring);
      const isMap = visualizationType === 'regionMap' || visualizationType === 'featureMap';

      onSelectVisualizationType(visualizationType);

      if (isMap && _.isNull(dimension.columnName)) {
        setDimensionToLocation(_.get(getAnyLocationColumn(metadata), 'fieldName', null));
      }
    };
  }

  renderVisualizationTypeFlyout(visualizationType, isRecommended) {
    const recommendedLabel = (
      <div className="visualization-type-recommended-label">
        <span className="visualization-type-recommended-indicator" />
        <span>{I18n.t('shared.visualizations.panes.data.fields.visualization_type.recommended')}</span>
      </div>
    );

    const recommendedInfo = (
      <p className="visualization-type-info">
        {I18n.t('shared.visualizations.panes.data.fields.visualization_type.recommended_based_on')}
      </p>
    );

    const flyoutAttributes = {
      id: `${visualizationType.type}-flyout`,
      className: classNames('visualization-type-flyout flyout flyout-hidden', {
        // Controls the visibility of recommended labels and info.
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
  }

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
          <p>{I18n.t('shared.visualizations.panes.data.fields.visualization_type.no_boundaries')}</p>
          <p dangerouslySetInnerHTML={{__html: I18n.t('shared.visualizations.panes.data.fields.visualization_type.ask_site_admin')}} />
        </div>
      </div>
    ) : null;
  }

  renderVisualizationTypeButton(visualizationType) {
    const { metadata, vifAuthoring } = this.props;
    const recommendedVisualizationTypes = getRecommendedVisualizationTypes(metadata, getAnyDimension(vifAuthoring));
    const isRecommended = _.some(recommendedVisualizationTypes, {type: visualizationType});
    const selectedVisualizationType = getSelectedVisualizationType(vifAuthoring)
    const isSelected = (visualizationType === selectedVisualizationType);
    const visualizationTypeMetadata = _.find(VISUALIZATION_TYPES, {type: visualizationType});
    const flyout = this.renderVisualizationTypeFlyout(visualizationTypeMetadata, isRecommended);

    const buttonAttributes = {
      type: 'button',
      className: classNames('btn btn-default btn-lg', {
        active: isSelected,
        recommended: isRecommended
      }),
      onClick: this.onClickVisualizationType(visualizationType),
      'data-flyout': `${visualizationType}-flyout`
    };

    return (
      <button {...buttonAttributes} aria-label={visualizationTypeMetadata.title}>
        <span className={visualizationTypeMetadata.icon} />
        {flyout}
      </button>
    );
  }

  renderVisualizationTypeSelector() {
    const attributes = {
      id: 'visualization-type-selection',
      className: 'visualization-type-container',
      ref: (ref) => this.selector = ref
    };

    return (
      <div  {...attributes}>
        <div className="visualization-type-gutter" />
        <div className="btn-group">
          {this.renderVisualizationTypeButton('barChart')}
          {this.renderVisualizationTypeButton('columnChart')}
          {this.renderVisualizationTypeButton('pieChart')}
          {this.renderVisualizationTypeButton('timelineChart')}
          {this.renderVisualizationTypeButton('histogram')}
          {this.renderVisualizationTypeButton('featureMap')}
          {this.renderVisualizationTypeButton('regionMap')}
        </div>
        <div className="visualization-type-gutter" />
      </div>
    );
  }

  render() {
    const { metadata } = this.props;

    if (hasData(metadata)) {
      return (
        <div>
          {this.renderVisualizationTypeSelector()}
          {this.renderEmptyRegionAlert()}
        </div>
      );
    } else {
      return null;
    }
  }
}

VisualizationTypeSelector.propTypes = {
  vifAuthoring: PropTypes.object,
  metadata: PropTypes.object,
  onSelectVisualizationType: PropTypes.func
};

VisualizationTypeSelector.defaultProps = {
  visualizationTypes: VISUALIZATION_TYPES
};

function mapStateToProps(state) {
  const { vifAuthoring, metadata } = state;
  return { vifAuthoring, metadata };
}

function mapDispatchToProps(dispatch) {
  return {
    onSelectVisualizationType(visualizationType) {
      dispatch(setVisualizationType(visualizationType));
    },
    updateColorPalette(colorPalette) {
      dispatch(setColorPalette(colorPalette));
    },
    setDimensionToLocation(dimension) {
      dispatch(setDimension(dimension));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(VisualizationTypeSelector);
