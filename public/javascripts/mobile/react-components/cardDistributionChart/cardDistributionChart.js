import React from 'react';
import _ from 'lodash';

require('socrata-visualizations').DistributionChart;

import './cardDistributionChart.scss';

class CardDistributionChart extends React.Component {
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
      domain: this.props.values.domain,
      datasetUid: this.props.values.datasetUid,
      configuration: {
        isMobile: true
      },
      filters: _.get(this, 'state.filters', this.props.values.filters),
      type: 'distributionChart',
      unit: this.props.values.unit
    };
  }

  componentDidMount() {
    this.setState({ $component: $(this.refs.chartContainer) }, () => {
      this.state.$component.on('SOCRATA_VISUALIZATION_DATA_LOAD_START',
        _.bind(this.props.controlLoadingSpinner, this, true));
      this.state.$component.on('SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE',
        _.bind(this.props.controlLoadingSpinner, this, false));

      this.state.$component.socrataDistributionChart(this.getVIF());

      this.state.$component.on('SOCRATA_VISUALIZATION_DISTRIBUTION_CHART_FLYOUT', this.handleFlyout.bind(this));
    });
  }

  componentWillUnmount() {
    this.state.$component.off('SOCRATA_VISUALIZATION_DATA_LOAD_START SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE ' +
      'SOCRATA_VISUALIZATION_DISTRIBUTION_CHART_FLYOUT');
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
    this.props.controlMobileFlyout(null);
  }

  renderFlyout(payload) {
    var arrowMarginLeft = parseFloat(payload.x) - 16.5;
    var title = '{0} - {1}'.format(payload.start, payload.end);

    this.props.controlMobileFlyout({
      title: title,
      filteredValue: payload.filtered != payload.unfiltered ? payload.filtered : false,
      unFilteredValue: payload.unfiltered,
      arrowPosition: arrowMarginLeft,
      unit: this.getVIF().unit
    });
  }

  render() {
    return <div ref="chartContainer" className={ this.props.componentClass }></div>;
  }
}

CardDistributionChart.propTypes = {
  filters: React.PropTypes.array.isRequired,
  controlMobileFlyout: React.PropTypes.func.isRequired,
  controlLoadingSpinner: React.PropTypes.func.isRequired
};

export default CardDistributionChart;
