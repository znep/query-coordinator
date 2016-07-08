import _ from 'lodash';
import React from 'react';

require('socrata-visualizations').ColumnChart;

import './cardColumnChart.scss';

const NAME_INDEX = 0;
const UNFILTERED_INDEX = 1;
const FILTERED_INDEX = 2;
const SELECTED_INDEX = 3;

class CardColumnChart extends React.Component {
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
      labelUnit: 'rows',
      showAllLabels: false,
      showFiltered: true,
      columnName: this.props.values.columnName,
      domain: this.props.values.domain,
      datasetUid: this.props.values.datasetUid,
      configuration: {
        isMobile: true,
        localization: {
          'NO_VALUE': 'No value',
          'FLYOUT_UNFILTERED_AMOUNT_LABEL': 'Total',
          'FLYOUT_FILTERED_AMOUNT_LABEL': 'Filtered',
          'FLYOUT_SELECTED_NOTICE': 'This column is selected'
        }
      },
      filters: _.get(this, 'state.filters', this.props.values.filters),
      type: 'columnChart',
      unit: this.props.values.unit
    };
  }

  componentDidMount() {
    this.setState({ $component: $(this.refs.chartContainer) }, () => {
      this.state.$component.on('SOCRATA_VISUALIZATION_DATA_LOAD_START',
        _.bind(this.props.controlLoadingSpinner, this, true));
      this.state.$component.on('SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE',
        _.bind(this.props.controlLoadingSpinner, this, false));

      this.state.$component.socrataColumnChart(this.getVIF());

      this.state.$component.on('click', '.bar-group, .labels .label .contents span', this.selectDatum.bind(this));

      var chartWidth = this.state.$component.find('.bar-group').length * 50;
      this.state.$component.addClass('responsive');
      this.state.$component.find('.chart-scroll').width(chartWidth);
    });
  }

  componentWillUnmount() {
    this.state.$component.off('SOCRATA_VISUALIZATION_DATA_LOAD_START SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE ');
    this.state.$component.off('click', '.bar-group, .labels .label .contents span');
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

  selectDatum(event) {
    this.state.$component.find('.bar-group').removeClass('selected');
    this.state.$component.selectedData = {
      name: d3.select(event.currentTarget).datum()[NAME_INDEX],
      unfilteredValue: d3.select(event.currentTarget).datum()[UNFILTERED_INDEX],
      filteredValue: d3.select(event.currentTarget).datum()[FILTERED_INDEX],
      selected: d3.select(event.currentTarget).datum()[SELECTED_INDEX]
    };

    this.renderFlyout(event);
  }

  renderFlyout(event) {
    var barName = event.currentTarget.getAttribute('data-bar-name');
    var unFilteredValue = this.state.$component.selectedData.unfilteredValue;
    var filteredValue = this.state.$component.selectedData.filteredValue;

    var selectedBar = this.state.$component.find('.bar-group[data-bar-name="{0}"]'.format(barName)).
      addClass('selected');

    if (filteredValue != unFilteredValue) {
      if (parseInt(filteredValue) >= 1000000) {
        filteredValue = (filteredValue / 1000000).toFixed(1) + 'M';
      } else if (parseInt(filteredValue) >= 1000) {
        filteredValue = (filteredValue / 1000).toFixed(1) + 'K';
      }
    } else {
      filteredValue = false;
    }

    if (parseInt(unFilteredValue) >= 1000000) {
      unFilteredValue = (unFilteredValue / 1000000).toFixed(1) + 'M';
    } else if (parseInt(unFilteredValue) >= 1000) {
      unFilteredValue = (unFilteredValue / 1000).toFixed(1) + 'K';
    }

    var arrowMarginLeft = selectedBar.offset().left  - 8;

    this.props.controlMobileFlyout({
      title: barName == 'undefined' ? '(No Value)' : barName,
      filteredValue: filteredValue,
      unFilteredValue: unFilteredValue,
      arrowPosition: arrowMarginLeft,
      unit: this.getVIF().unit
    });
  }

  render() {
    return <div ref="chartContainer" className={ this.props.componentClass }></div>;
  }
}

CardColumnChart.propTypes = {
  filters: React.PropTypes.array.isRequired,
  controlMobileFlyout: React.PropTypes.func.isRequired,
  controlLoadingSpinner: React.PropTypes.func.isRequired
};

export default CardColumnChart;
