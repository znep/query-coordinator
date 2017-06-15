import $ from 'jquery';
import React from 'react';
import { connect } from 'react-redux';
import { getDatasetLink, getDatasetName, hasData } from '../selectors/metadata';
import { VisualizationRenderer, I18n } from 'common/visualizations';

export var TableView = React.createClass({
  propTypes: {
    metadata: React.PropTypes.object
  },

  componentDidMount() {
    var { metadata } = this.props;

    if (hasData(metadata)) {
      this.renderTableView();
    }
  },

  componentDidUpdate() {
    var { metadata } = this.props;

    if (hasData(metadata)) {
      this.renderTableView();
    }
  },

  renderBasedOn() {
    var { metadata } = this.props;

    return (
      <span className="authoring-based-on">
        <a href={getDatasetLink(metadata)} target="_blank">{getDatasetName(metadata)}</a>
      </span>
    );
  },

  renderTableView() {
    var { vif } = this.props;

    if (this.tableView.querySelector('.socrata-visualization')) {
      this.tableRenderer.update(vif);
    } else {
      this.tableRenderer = new VisualizationRenderer(vif, this.tableView);
    }
  },

  render() {
    var { metadata } = this.props;
    var basedOn = hasData(metadata) ? this.renderBasedOn() : null;

    return (
      <div className="authoring-table-view-container">
        <h6 className="authoring-table-view-title">
          {I18n.translate('table_view.title')}{basedOn}
        </h6>
        <div className="authoring-table-view" ref={(ref) => this.tableView = ref} />
      </div>
    );
  }
});

function mapStateToProps(state) {
  return {
    metadata: state.metadata,
    vif: state.vifAuthoring.vifs.table
  };
}

export default connect(mapStateToProps, {})(TableView);
