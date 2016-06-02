import React from 'react';

require('socrata-visualizations').Table;

import './cardTable.scss';

class CardTable extends React.Component {
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
          PREVIOUS: 'Previous',
          NEXT: 'Next',
          NO_ROWS: 'No {unitOther}',
          ONLY_ROW: 'Showing {unitOne} {firstRowOrdinal} of {datasetRowCount}',
          MANY_ROWS: 'Showing {unitOther} {firstRowOrdinal}-{lastRowOrdinal} out of {datasetRowCount}',
          LATITUDE: 'Latitude',
          LONGITUDE: 'Longitude',
          NO_COLUMN_DESCRIPTION: 'No description provided.'
        },
        order: [{
          ascending: true,
          columnName: this.props.values.orderColumnName
        }]
      },
      datasetUid: this.props.values.datasetUid,
      domain: this.props.values.domain,
      filters: _.get(this, 'state.filters', this.props.values.filters),
      format: {
        type: 'visualization_interchange_format',
        version: 1
      },
      title: this.props.values.columnName,
      type: 'table',
      unit: this.props.values.unit
    };
  }

  componentDidMount() {
    this.setState({ $component: $(this.refs.chartContainer) }, () => {
      this.state.$component.on('SOCRATA_VISUALIZATION_DATA_LOAD_START',
        _.bind(this.props.controlLoadingSpinner, this, true));
      this.state.$component.on('SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE',
        _.bind(this.props.controlLoadingSpinner, this, false));

      this.state.$component.socrataTable(this.getVIF());
    });
  }

  componentWillUnmount() {
    this.state.$component.off('SOCRATA_VISUALIZATION_DATA_LOAD_START SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE');
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

  render() {
    return <div ref="chartContainer" className={ this.props.componentClass }></div>;
  }
}

CardTable.propTypes = {
  filters: React.PropTypes.array.isRequired,
  controlLoadingSpinner: React.PropTypes.func.isRequired
};

export default CardTable;
