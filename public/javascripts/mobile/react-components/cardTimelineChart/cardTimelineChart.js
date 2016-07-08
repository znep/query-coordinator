import _ from 'lodash';
import React from 'react';

require('socrata-visualizations').TimelineChart;

import './cardTimelineChart.scss';

class CardTimelineChart extends React.Component {
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
        isMobile: true,
        localization: {
          no_value: 'No value',
          flyout_unfiltered_amount_label: 'Total',
          flyout_filtered_amount_label: 'Filtered',
          flyout_selected_notice: 'This column is selected'
        }
      },
      datasetUid: this.props.values.datasetUid,
      domain: this.props.values.domain,
      filters: _.get(this, 'state.filters', this.props.values.filters),
      format: {
        type: 'visualization_interchange_format',
        version: 1
      },
      title: this.props.values.columnName,
      type: 'timelineChart',
      unit: this.props.values.unit
    };
  }

  componentDidMount() {
    this.setState({ $component: $(this.refs.chartContainer) }, () => {
      this.state.$component.on('SOCRATA_VISUALIZATION_DATA_LOAD_START',
        _.bind(this.props.controlLoadingSpinner, this, true));
      this.state.$component.on('SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE',
        _.bind(this.props.controlLoadingSpinner, this, false));

      this.state.$component.socrataTimelineChart(this.getVIF());

      this.state.$component.on('SOCRATA_VISUALIZATION_TIMELINE_FLYOUT', this.handleFlyout.bind(this));
      this.state.$component.on('SOCRATA_VISUALIZATION_TIMELINE_CHART_CLEAR', this.clearFlyout.bind(this));
    });
  }

  componentWillUnmount() {
    this.state.$component.off('SOCRATA_VISUALIZATION_DATA_LOAD_START SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE ' +
      'SOCRATA_VISUALIZATION_TIMELINE_FLYOUT SOCRATA_VISUALIZATION_TIMELINE_CHART_CLEAR');
  }

  componentDidUpdate() {
    if (!_.isEqual(this.props.filters, this.state.filters)) {
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

    // Render mobile flyout
    if (payload !== null) {
      this.renderFlyout(payload);
    } else {
      this.clearFlyout();
    }
  }

  clearFlyout() {
    this.props.controlMobileFlyout(null);
    this.props.controlMobileFlyoutDot(null);
  }

  renderFlyout(payload) {
    var flyoutPosition = payload.flyoutPosition;
    var flyoutBounds = payload.element.getBoundingClientRect();
    var highlightedBarWidth = this.state.$component.find('.timeline-chart-highlight-container').width();
    var arrowMarginLeft = parseFloat((flyoutBounds.left - 12) + (highlightedBarWidth / 2)) - 16.5;

    var filteredValue = payload.filteredValue ? payload.filteredValue.split(' ')[0] : false;
    var unFilteredValue = payload.unfilteredValue.split(' ')[0];

    var dotContent;
    if (!payload.isIntervalFlyout) {
      var dotLeft = (flyoutBounds.left - 15) + (highlightedBarWidth / 2);
      var dotTop = flyoutPosition.vertical +
        this.state.$component.parent().find('.intro-text').height() +
        parseInt($('.timeline-chart-upper-container').css('border-width')) + 5;

      dotContent = {
        left: dotLeft,
        top: dotTop
      };
    }

    this.props.controlMobileFlyout({
      title: payload.title,
      filteredValue: filteredValue,
      unFilteredValue: unFilteredValue,
      arrowPosition: arrowMarginLeft,
      unit: this.getVIF().unit
    });

    this.props.controlMobileFlyoutDot(dotContent);
  }

  render() {
    return <div ref="chartContainer" className={ this.props.componentClass }></div>;
  }
}

CardTimelineChart.propTypes = {
  filters: React.PropTypes.array.isRequired,
  controlMobileFlyout: React.PropTypes.func.isRequired,
  controlMobileFlyoutDot: React.PropTypes.func.isRequired,
  controlLoadingSpinner: React.PropTypes.func.isRequired
};

export default CardTimelineChart;
