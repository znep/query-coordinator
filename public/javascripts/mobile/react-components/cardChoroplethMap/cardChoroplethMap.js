import React from 'react';
import _ from 'lodash';

require('socrata-visualizations').ChoroplethMap;

import './cardChoroplethMap.scss';
import './cardChoroplethMapLegend.scss';

class CardChoroplethMap extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      $component: null,
      filters: this.props.filters
    };
  }

  getVIF() {
    return {
      aggregation: {
        field: this.props.values.aggregationField,
        'function': this.props.values.aggregationFunction
      },
      columnName: this.props.values.columnName,
      configuration: {
        mapOptions: {
          tap: false
        },
        baseLayerUrl: 'https://a.tiles.mapbox.com/v3/socrata-apps.3ecc65d4/{z}/{x}/{y}.png',
        baseLayerOpacity: 0.8,
        computedColumnName: this.props.values.computedColumnName,
        defaultExtent: this.props.values.mapExtent,
        legend: {
          type: 'continuous',
          positiveColor: '#007862',
          negativeColor: '#CE6565'
        },
        localization: {
          FLYOUT_SELECTED_NOTICE: 'The page is currently filtered by this value, click to clear it',
          FLYOUT_UNFILTERED_AMOUNT_LABEL: 'Total',
          FLYOUT_FILTERED_AMOUNT_LABEL: 'Filtered',
          NO_VALUE: '(No Value)',
          CLEAR_FILTER_LABEL: 'Clear filter'
        },
        shapefile: {
          columns: {
            name: '__SOCRATA_HUMAN_READABLE_NAME__',
            unfiltered: '__SOCRATA_UNFILTERED_VALUE__',
            filtered: '__SOCRATA_FILTERED_VALUE__',
            selected: '__SOCRATA_FEATURE_SELECTED__'
          },
          primaryKey: '_feature_id',
          uid: this.props.values.geojsonUid
        }
      },
      domain: this.props.values.domain,
      datasetUid: this.props.values.datasetUid,
      filters: _.get(this, 'state.filters', this.props.values.filters),
      type: 'choroplethMap',
      unit: this.props.values.unit
    };
  }

  componentDidMount() {
    this.setState({ $component: $(this.refs.chartContainer) }, () => {
      this.state.$component.on('SOCRATA_VISUALIZATION_DATA_LOAD_START',
        _.bind(this.props.controlLoadingSpinner, this, true));
      this.state.$component.on('SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE',
        _.bind(this.props.controlLoadingSpinner, this, false));

      var vif = this.getVIF();
      vif.unit = { one: '', other: '' };
      this.state.$component.socrataChoroplethMap(vif);

      this.state.$component.on('SOCRATA_VISUALIZATION_CHOROPLETH_MAP_FLYOUT', this.handleFlyout.bind(this));
    });
  }

  componentWillUnmount() {
    this.state.$component.off('SOCRATA_VISUALIZATION_DATA_LOAD_START SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE ' +
      'SOCRATA_VISUALIZATION_CHOROPLETH_MAP_FLYOUT');
  }

  componentDidUpdate() {
    if (!_.eq(this.props.filters, this.state.filters)) {
      this.setState({
        filters: this.props.filters
      }, () => {
        var changeEvent = jQuery.Event('SOCRATA_VISUALIZATION_RENDER_VIF'); // eslint-disable-line
        changeEvent.originalEvent = {
          detail: this.getVIF()
        };

        this.state.$component.trigger(changeEvent);
      });
    }
  }

  handleFlyout(event) {
    var payload = event.originalEvent.detail;

    if (_.isNull(payload)) {
      this.clearFlyout();
    } else {
      this.renderFlyout(payload);
    }
  }

  clearFlyout() {
    this.state.$component.find('.choropleth-container').toggleClass('with-flyout-open', false);
    this.props.controlMobileFlyout(null);
  }

  renderFlyout(payload) {
    this.state.$component.find('.choropleth-container').toggleClass('with-flyout-open', true);
    var arrowMarginLeft = parseFloat(payload.flyoutOffset.left) - 16.5;

    this.props.controlMobileFlyout({
      title: payload.title == 'undefined' ? '(No Value)' : payload.title,
      filteredValue: payload.filtered === '(No Value)' ? 0 : payload.filtered,
      unFilteredValue: payload.unfiltered === '(No Value)' ? 0 : payload.unfiltered,
      arrowPosition: arrowMarginLeft,
      unit: this.getVIF().unit
    });
  }

  render() {
    return <div ref="chartContainer" className={ this.props.componentClass }></div>;
  }
}

CardChoroplethMap.propTypes = {
  filters: React.PropTypes.array.isRequired,
  controlMobileFlyout: React.PropTypes.func.isRequired,
  controlLoadingSpinner: React.PropTypes.func.isRequired
};

export default CardChoroplethMap;
