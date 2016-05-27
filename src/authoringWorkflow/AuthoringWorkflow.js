import React from 'react';
import { connect } from 'react-redux';

import { datasetMetadataPredicates } from './reducers/datasetMetadata';
import { setDatasetUid, setDimension, setMeasure, setChartType } from './actions';

import { CustomizationTabs } from './CustomizationTabs';
import { CustomizationTabPanes } from './CustomizationTabPanes';
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

  getInitialState: function() {
    return {
      currentTabSelection: '#authoring-data'
    };
  },

  propTypes: {
    vif: React.PropTypes.object,
    datasetMetadata: React.PropTypes.object,
    defaultOptionKey: React.PropTypes.string,
    chartTypes: React.PropTypes.array
  },

  componentDidMount: function() {
    var datasetUid = _.get(this.props.vif, 'series[0].dataSource.datasetUid');
    var hasDatasetUid = _.isString(datasetUid);

    if (hasDatasetUid) {
      this.props.changeDatasetUid(datasetUid);
    }
  },

  onComplete: function() {
    this.props.onComplete({
      vif: this.props.vif
    });
  },

  onCancel: function() {
    this.props.onCancel();
  },

  onTabNavigation: function(event) {
    var href = event.target.getAttribute('href');

    if (href) {
      event.preventDefault();
      this.setState({currentTabSelection: href});
    }
  },

  tabs: function() {
    var datasetMetadataInfo;
    var dimensionDropdown;
    var measureDropdown;
    var chartTypeDropdown;

    var vif = this.props.vif;
    var datasetMetadata = this.props.datasetMetadata;
    var datasetUid = _.get(this.props, 'vif.series[0].datasetSource.datasetUid', '');

    if (datasetMetadataPredicates.hasError(datasetMetadata)) {
      datasetMetadataInfo = <div>Problem fetching dataset metadata</div>;
    } else if (datasetMetadataPredicates.isLoading(datasetMetadata)) {
      datasetMetadataInfo = <div>Loading dataset metadata</div>;
    }

    if (datasetMetadataPredicates.hasData(datasetMetadata)) {
      dimensionDropdown = <div>Dimension: {this.dimensionDropdown()}</div>;
      measureDropdown = <div>Measure: {this.measureDropdown()}</div>;
      chartTypeDropdown = <div>Chart Type: {this.chartTypeDropdown()}</div>;
    }

    return [
      {
        id: 'authoring-data',
        title: 'Data',
        content: (
          <form>
            <label className="block-label">Enter a dataset four by four:</label>
            <input className="text-input" type="text" defaultValue={datasetUid} onChange={this.props.onChangeDatasetUid} />

            {datasetMetadataInfo}

            {dimensionDropdown}
            {measureDropdown}
            {chartTypeDropdown}
          </form>
        )
      },

      {
        id: 'authoring-title-and-description',
        title: 'Title & Description',
        content: (
          <form>
            <label className="block-label">Title:</label>
            <input className="text-input" type="text" />
            <label className="block-label">Description:</label>
            <textarea className="text-input text-area"></textarea>
          </form>
        )
      },

      {
        id: 'authoring-colors-and-style',
        title: 'Colors & Style',
        content: (
          <form>
            <p>Colors and Style</p>
          </form>
        )
      },

      {
        id: 'authoring-axis-and-scale',
        title: 'Axis & Scale',
        content: (
          <form>
            <p>Axis and scale</p>
          </form>
        )
      },

      {
        id: 'authoring-labels',
        title: 'Labels',
        content: (
          <form>
            <p>Labels</p>
          </form>
        )
      },

      {
        id: 'authoring-flyouts',
        title: 'Flyouts',
        content: (
          <form>
            <p>Flyouts</p>
          </form>
        )
      }
    ];
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
    var visualization = this.visualization();
    var tabs = this.tabs();

    return (
      <div className="modal modal-full modal-overlay" onKeyUp={this.onKeyUp}>
        <div className="modal-container">

          <header className="modal-header">
            <h5 className="modal-header-title">Create Visualization</h5>
            <button className="btn btn-transparent modal-header-dismiss" onClick={this.onCancel}>
              <span className="icon-close-2"></span>
            </button>
          </header>

          <section className="modal-content">
            <CustomizationTabs tabs={tabs} currentTabSelection={this.state.currentTabSelection} onTabNavigation={this.onTabNavigation} />

            <div className="authoring-controls">
              <CustomizationTabPanes tabs={tabs} currentTabSelection={this.state.currentTabSelection} />
              {visualization}
            </div>
          </section>

          <footer className="modal-footer">
            <div className="modal-footer-actions">
              <button className="btn btn-default cancel" onClick={this.onCancel}>Cancel</button>
              <button className="btn btn-primary done" onClick={this.onComplete}>Insert</button>
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
  function changeDatasetUid(datasetUid) {
    dispatch(setDatasetUid(datasetUid));
  }

  var dispatchers = {
    changeDatasetUid: changeDatasetUid,
    onChangeDatasetUid: function(event) {
      changeDatasetUid(event.target.value);
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

  return dispatchers;
}

export default connect(mapStateToProps, mapDispatchToProps)(AuthoringWorkflow);
