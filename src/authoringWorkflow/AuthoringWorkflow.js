import React from 'react';
import { connect } from 'react-redux';

import { setDatasetUid, setDimension, setMeasure, setChartType } from './actions';
import { Visualization } from './Visualization';

export var AuthoringWorkflow = React.createClass({
  getDefaultProps: function() {
    return {
      defaultOptionKey: '__unselectable__',
      chartTypes: [
        {type: 'columnChart', name: 'Column Chart'},
        {type: 'timelineChart', name: 'Timeline Chart'}
      ]
    };
  },

  propTypes: {
    vif: React.PropTypes.object,
    datasetMetadata: React.PropTypes.object,
    defaultOptionKey: React.PropTypes.string,
    chartTypes: React.PropTypes.array
  },

  onComplete: function() {
    this.props.onComplete({
      vif: this.props.vif
    });
  },

  onCancel: function() {
    this.props.onCancel();
  },

  dimensionDropdown: function() {
    var datasetMetadata = this.props.datasetMetadata;
    var defaultOptionKey = this.props.defaultOptionKey;
    var dimensionOptions = [
      <option key={defaultOptionKey} value={defaultOptionKey} disabled>Select a dimension...</option>,
      ...datasetMetadata.data.columns.map(column => {
        return <option value={column.fieldName} key={column.fieldName}>{column.name}</option>;
      })
    ];

    return <select onChange={this.props.onChangeDimension} defaultValue={defaultOptionKey}>{dimensionOptions}</select>;
  },

  measureDropdown: function() {
    var datasetMetadata = this.props.datasetMetadata;
    var defaultOptionKey = this.props.defaultOptionKey;
    var numberColumns = _.filter(datasetMetadata.data.columns, { dataTypeName: 'number' });

    var measureOptions = [
      <option key={defaultOptionKey} value={defaultOptionKey} disabled>Select a measure...</option>,
      ...numberColumns.map(numberColumn => {
        return <option value={numberColumn.fieldName} key={numberColumn.fieldName}>{numberColumn.name}</option>;
      })
    ];

    return <select onChange={this.props.onChangeMeasure} defaultValue={defaultOptionKey}>{measureOptions}</select>;
  },

  chartTypeDropdown: function() {
    var datasetMetadata = this.props.datasetMetadata;
    var defaultOptionKey = this.props.defaultOptionKey;
    var types = this.props.chartTypes;

    var chartTypeOptions = [
      <option key={defaultOptionKey} value={defaultOptionKey} disabled>Select a chart type...</option>,
      ...types.map(chartType => {
        return <option value={chartType.type} key={chartType.type}>{chartType.name}</option>;
      })
    ];

    return <select onChange={this.props.onChangeChartType} defaultValue={defaultOptionKey}>{chartTypeOptions}</select>;
  },

  visualization: function() {
    return <Visualization {...this.props} />;
  },

  render: function() {
    var vif = this.props.vif;
    var datasetMetadata = this.props.datasetMetadata;
    var visualization = this.visualization();
    var datasetMetadataInfo;
    var dimensionDropdown;
    var measureDropdown;
    var chartTypeDropdown;

    if (datasetMetadata.hasError) {
      datasetMetadataInfo = <div>Problem fetching dataset metadata</div>;
    } else if (datasetMetadata.isLoading) {
      datasetMetadataInfo = <div>Loading dataset metadata</div>;
    }

    if (datasetMetadata.hasData) {
      dimensionDropdown = <div>Dimension: {this.dimensionDropdown()}</div>;
      measureDropdown = <div>Measure: {this.measureDropdown()}</div>;
      chartTypeDropdown = <div>Chart Type: {this.chartTypeDropdown()}</div>;
    }


    return (
      <div className="modal modal-full modal-overlay">
        <div className="modal-container">

          <header className="modal-header">
            <h5 className="modal-header-title">Create Visualization</h5>
            <button className="btn btn-transparent modal-header-dismiss" data-modal-dismiss>
              <span className="icon-close-2"></span>
            </button>
          </header>

          <section className="modal-content">
            <form>
              <div>
                <label className="block-label">Enter a dataset four by four:</label>
                <input className="text-input" type="text" value={vif.series[0].dataSource.datasetUid} onChange={this.props.onChangeDatasetUid}/>
              </div>

              {datasetMetadataInfo}

              {dimensionDropdown}
              {measureDropdown}
              {chartTypeDropdown}
            </form>

            {visualization}
          </section>

          <footer className="modal-footer">
            <div className="modal-footer-actions">
              <button className="btn btn-default cancel" onClick={this.onCancel}>Cancel</button>
              <button className="btn btn-primary done" onClick={this.onComplete}>Done</button>
            </div>
          </footer>
        </div>
      </div>
    );
  }
});

function mapStateToProps(state) {
  return {
    vif: state.vif,
    datasetMetadata: state.datasetMetadata
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onChangeDatasetUid: function(event) {
      dispatch(setDatasetUid(event.target.value));
    },

    onChangeDimension: function(event) {
      var dimension = event.target.value;
      dispatch(setDimension(dimension));
    },

    onChangeMeasure: function(event) {
      var measure = event.target.value;
      dispatch(setMeasure(measure));
    },

    onChangeChartType: function(event) {
      var chartType = event.target.value;
      dispatch(setChartType(chartType));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AuthoringWorkflow);
