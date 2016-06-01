/* global socrataConfig */
import React from 'react';
import _ from 'lodash';

require('socrata-visualizations').FeatureMap;
var FlyoutRenderer = require('socrata-visualizations').views.FlyoutRenderer;
var RowInspector = require('socrata-visualizations').views.RowInspector;

import './cardFeatureMap.scss';
import './cardFeatureMapRowInspector.scss';

class CardFeatureMap extends React.Component {
  constructor(props) {
    super(props);

    let domainBasedTileServerList;
    if (!_.isEmpty(socrataConfig.tileserverHosts)) {
      domainBasedTileServerList = _.map(socrataConfig.tileserverHosts, (serverUrl) => {
        return serverUrl.match(/https?:\/\//) ? serverUrl : window.location.protocol + '//' + serverUrl;
      });
    } else {
      let tileServerTemplate = ['tileserver1.api.us', 'tileserver2.api.us', 'tileserver3.api.us', 'tileserver4.api.us'];
      let topDomain = _.get(window.location.host.match(/[^.]*\.[^.]{2,3}(?:\.[^.]{2,3})?$/), '[0]');
      domainBasedTileServerList = _.map(tileServerTemplate, (server) => {
        return '{0}//{1}.{2}'.format(window.location.protocol, server, topDomain);
      });
    }

    this.state = {
      $component: null,
      filters: this.props.filters,
      flyoutRenderer: new FlyoutRenderer(),
      domainBasedTileServerList: domainBasedTileServerList
    };
  }

  getVIF() {
    return {
      aggregation: {
        'field': this.props.values.aggregationField,
        'function': this.props.values.aggregationFunction
      },
      columnName: this.props.values.columnName,
      domain: this.props.values.domain,
      datasetUid: this.props.values.datasetUid,
      configuration: {
        datasetMetadata: false,

        hover: true,
        isMobile: true,
        panAndZoom: true,
        locateUser: true,
        mapOptions: {
          tap: true,
          dragging: true,
          tapTolerance: 15,
          trackResize: true,
          maxZoom: 300,
          zoomControl: false
        },
        localization: {
          FLYOUT_FILTER_NOTICE: 'There are too many points at this location',
          FLYOUT_FILTER_OR_ZOOM_NOTICE: 'Zoom in to see details',
          FLYOUT_DENSE_DATA_NOTICE: 'Numerous',
          FLYOUT_CLICK_TO_INSPECT_NOTICE: 'Click to see details',
          FLYOUT_CLICK_TO_LOCATE_USER_TITLE: 'Click to show your position on the map',
          FLYOUT_CLICK_TO_LOCATE_USER_NOTICE: 'You may have to give your browser permission to share your current location',
          FLYOUT_LOCATING_USER_TITLE: 'Your position is being determined',
          FLYOUT_LOCATE_USER_ERROR_TITLE: 'There was an error determining your location',
          FLYOUT_LOCATE_USER_ERROR_NOTICE: 'Click to try again',
          FLYOUT_PAN_ZOOM_DISABLED_WARNING_TITLE: 'Panning and zooming has been disabled',
          ROW_INSPECTOR_ROW_DATA_QUERY_FAILED: 'Detailed information about these points cannot be loaded at this time',
          USER_CURRENT_POSITION: 'Your current location (estimated)'
        },
        // Base layer
        baseLayerUrl: 'https://a.tiles.mapbox.com/v3/socrata-apps.3ecc65d4/{z}/{x}/{y}.png',
        baseLayerOpacity: 0.5,
        tileserverHosts: this.state.domainBasedTileServerList,
        useOriginHost: false
      },
      filters: _.get(this, 'state.filters', this.props.values.filters),
      type: 'featureMap',
      unit: this.props.values.unit
    };
  }

  componentDidMount() {
    this.setState({ $component: $(this.refs.chartContainer) }, () => {
      this.state.$component.on('SOCRATA_VISUALIZATION_FEATURE_MAP_RENDER_START',
        _.bind(this.props.controlLoadingSpinner, this, true));
      this.state.$component.on('SOCRATA_VISUALIZATION_FEATURE_MAP_RENDER_COMPLETE',
        _.bind(this.props.controlLoadingSpinner, this, false));

      this.state.$component.socrataFeatureMap(this.getVIF());

      RowInspector.setup({ isMobile: true }, this.state.$component);

      this.state.$component.on('SOCRATA_VISUALIZATION_ROW_INSPECTOR_UPDATE', this.handleRowInspectorUpdate.bind(this));
      this.state.$component.on('SOCRATA_VISUALIZATION_ROW_INSPECTOR_HIDDEN', this.handleRowInspectorUpdate.bind(this));
      this.state.$component.on('SOCRATA_VISUALIZATION_FEATURE_MAP_FLYOUT', this.handleFlyout.bind(this));
    });
  }

  componentWillUnmount() {
    this.state.$component.off('SOCRATA_VISUALIZATION_FEATURE_MAP_RENDER_START ' +
      'SOCRATA_VISUALIZATION_FEATURE_MAP_RENDER_COMPLETE SOCRATA_VISUALIZATION_ROW_INSPECTOR_UPDATE ' +
      'SOCRATA_VISUALIZATION_ROW_INSPECTOR_HIDDEN SOCRATA_VISUALIZATION_FEATURE_MAP_FLYOUT');
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

    // Render/hide a flyout
    if (payload !== null) {
      this.state.flyoutRenderer.render(payload);

      $(window).one('touchmove', () => {
        this.state.flyoutRenderer.clear();
      });
    } else {
      this.state.flyoutRenderer.clear();
    }
  }

  handleRowInspectorUpdate(event, jQueryPayload) {
    var self = this;

    if (event.type === 'SOCRATA_VISUALIZATION_ROW_INSPECTOR_HIDDEN') {
      _toggleExpanded(false);
      _toggleSemiExpanded(false);
      return;
    }

    // These events are CustomEvents. jQuery < 3.0 does not understand that
    // event.detail should be passed as an argument to the handler.
    var payload = jQueryPayload || _.get(event, 'originalEvent.detail');
    var contentLength = _.get(payload,'data[0]', 0).length;

    if (contentLength > 0) {
      _toggleSemiExpanded(true);

      if (contentLength > 6) {
        self.state.$component.find('.sticky-border.show-more').toggleClass('hidden', false);
        self.state.$component.find('.show-more-button').toggleClass('active', false);
        self.state.$component.find('a.show-more-button').on('click', _showMoreButtonOnClick);
      }

    } else {
      self.state.$component.trigger('SOCRATA_VISUALIZATION_ROW_INSPECTOR_HIDE');
      self.state.$component.find('.sticky-border.show-more').toggleClass('hidden', true);
      self.state.$component.find('a.show-more-button').off('click', _showMoreButtonOnClick);
    }

    function _showMoreButtonOnClick() {
      if (self.state.$component.find('.show-more-button').hasClass('active')) {
        _toggleExpanded(false);
        _toggleSemiExpanded(true);
      } else {
        _toggleSemiExpanded(false);
        _toggleExpanded(true);
      }
    }

    function _toggleSemiExpanded(status) {
      self.state.$component.find('.tool-panel-inner-container').scrollTop(0);
      self.state.$component.parent().toggleClass('semi-expanded', status);
      self.state.$component.find('#socrata-row-inspector').toggleClass('semi-expanded', status);
    }

    function _toggleExpanded(status) {
      if (status) {
        $('html, body').scrollTop($('.component-container.map-container').offset().top - 50);
      }

      self.state.$component.parent().toggleClass('expanded', status);
      self.state.$component.find('#socrata-row-inspector').toggleClass('expanded', status);

      self.state.$component.find('.show-more-button').toggleClass('active', status);
      self.state.$component.find('.tool-panel-inner-container').toggleClass('scroll', status);
    }
  }

  render() {
    return <div ref="chartContainer" className={ this.props.componentClass }></div>;
  }
}

CardFeatureMap.propTypes = {
  filters: React.PropTypes.array.isRequired
};

export default CardFeatureMap;
