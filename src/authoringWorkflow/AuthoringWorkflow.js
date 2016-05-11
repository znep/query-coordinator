import React from 'react';
import { connect } from 'react-redux';

import { setDatasetUid, setDimension, setMeasure } from './actions';

export var AuthoringWorkflow = React.createClass({
  propTypes: {
    vif: React.PropTypes.object,
    datasetMetadata: React.PropTypes.object
  },

  onComplete: function() {
    this.props.onComplete({
      vif: this.props.vif
    });
  },

  onCancel: function() {
    this.props.onCancel();
  },

  render: function() {
    var vif = this.props.vif;
    var datasetMetadata = this.props.datasetMetadata;
    var datasetMetadataInfo;
    var dimensionDropdown;
    var measureDropdown;

    if (datasetMetadata.hasError) {
      datasetMetadataInfo = <div>Problem fetching dataset metadata</div>;
    } else if (datasetMetadata.isLoading) {
      datasetMetadataInfo = <div>Loading dataset metadata</div>;
    }

    if (datasetMetadata.hasData) {
      var dimensionOptions = datasetMetadata.data.columns.map(function(column) {
        return <option value={column.fieldName} key={column.fieldName}>{column.name}</option>;
      });

      dimensionDropdown = <select onChange={this.props.onChangeDimension}>{dimensionOptions}</select>;

      var measureOptions = _.chain(datasetMetadata.data.columns).
        filter({ dataTypeName: 'number' }).
        map(function(column) {
          return <option value={column.fieldName} key={column.fieldName}>{column.name}</option>;
        }).
        value();

      measureDropdown = <select onChange={this.props.onChangeMeasure}>{measureOptions}</select>;
    }

    return (
      <div>
        <div>Enter a dataset four by four:</div>

        <div>
          <input type="text" value={vif.series[0].dataSource.datasetUid} onChange={this.props.onChangeDatasetUid}/>
        </div>

        {datasetMetadataInfo}

        <div>
          Dimension: {dimensionDropdown}
        </div>

        <div>
          Measure: {measureDropdown}
        </div>

        <div className="actions">
          <button className="done" onClick={this.onComplete}>Done</button>
          <button className="cancel" onClick={this.onCancel}>Cancel</button>
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
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AuthoringWorkflow);
