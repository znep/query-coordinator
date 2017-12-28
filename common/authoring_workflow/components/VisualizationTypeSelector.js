import _ from 'lodash';
import classNames from 'classnames';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { factories } from 'common/components';
import { FeatureFlags } from 'common/feature_flags';
import I18n from 'common/i18n';

import { VISUALIZATION_TYPES } from '../constants';
import { setVisualizationType, setColorPalette, setDimension, setMapType } from '../actions';
import {
  getDimension,
  getAnyDimension,
  getSelectedVisualizationType,
  hasCustomColorPalette,
  isRegionMap,
  getPrimaryColor,
  getDimensionGroupingColumnName
} from '../selectors/vifAuthoring';
import {
  getAnyLocationColumn,
  getFirstOccurringGeoLocationColumn,
  getMapType,
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
        updateMapType,
        updateColorPalette,
        updateDimensionGroupingColumnName,
        vifAuthoring,
        metadata
      } = this.props;
      const mapVisualizationTypes = ['map', 'regionMap', 'featureMap'];
      const isMap = _.includes(mapVisualizationTypes, visualizationType);
      const dimension = getAnyDimension(vifAuthoring);

      onSelectVisualizationType(visualizationType);

      if (isMap) {
        const areNewMapsEnabled = FeatureFlags.value('enable_new_maps');

        if (_.isNull(dimension.columnName)) {
          if (areNewMapsEnabled) {
            const columnName = _.get(getFirstOccurringGeoLocationColumn(metadata), 'fieldName', null);

            setDimensionToLocation(columnName);
            updateMapType(getMapType(metadata, { columnName }));
          } else {
            setDimensionToLocation(_.get(getAnyLocationColumn(metadata), 'fieldName', null));
          }
        } else if (areNewMapsEnabled) {
          const columnName = dimension.columnName;
          updateMapType(getMapType(metadata, { columnName }));
        }
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
          <p dangerouslySetInnerHTML={{ __html: I18n.t('shared.visualizations.panes.data.fields.visualization_type.ask_site_admin') }} />
        </div>
      </div>
    ) : null;
  }

  renderVisualizationTypeButton(visualizationType) {
    const areNewMapsEnabled = FeatureFlags.value('enable_new_maps');

    if (!areNewMapsEnabled && _.isEqual(visualizationType, 'map')) {
      return;
    }

    if (areNewMapsEnabled && _.includes(['featureMap', 'regionMap'], visualizationType)) {
      return;
    }

    const { metadata, vifAuthoring } = this.props;
    const recommendedVisualizationTypes = getRecommendedVisualizationTypes(metadata, getAnyDimension(vifAuthoring));
    const isRecommended = _.some(recommendedVisualizationTypes, { type: visualizationType });
    const selectedVisualizationType = getSelectedVisualizationType(vifAuthoring);
    const isSelected = (visualizationType === selectedVisualizationType);
    const visualizationTypeMetadata = _.find(VISUALIZATION_TYPES, { type: visualizationType });
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
      <div {...attributes}>
        <div className="visualization-type-gutter" />
        <div className="btn-group">
          {this.renderVisualizationTypeButton('barChart')}
          {this.renderVisualizationTypeButton('columnChart')}
          {this.renderVisualizationTypeButton('pieChart')}
          {this.renderVisualizationTypeButton('timelineChart')}
          {this.renderVisualizationTypeButton('histogram')}
          {this.renderVisualizationTypeButton('comboChart')}
          {this.renderVisualizationTypeButton('featureMap')}
          {this.renderVisualizationTypeButton('regionMap')}
          {this.renderVisualizationTypeButton('map')}
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
    },

    updateMapType(mapType) {
      dispatch(setMapType(mapType));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(VisualizationTypeSelector);
