import _ from 'lodash';
import $ from 'jquery';
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { getDatasetLink, getDatasetName, hasData } from '../selectors/metadata';
import { VisualizationRenderer } from 'common/visualizations';
import I18n from 'common/i18n';

export class TableView extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'renderBasedOn',
      'renderTableView',

    ]);
  }

  componentDidMount() {
    var { metadata } = this.props;

    if (hasData(metadata)) {
      this.renderTableView();
    }
  }

  componentDidUpdate() {
    var { metadata } = this.props;

    if (hasData(metadata)) {
      this.renderTableView();
    }
  }

  renderBasedOn() {
    var { metadata } = this.props;

    return (
      <span className="authoring-based-on">
        <a href={getDatasetLink(metadata)} target="_blank">{getDatasetName(metadata)}</a>
      </span>
    );
  }

  renderTableView() {
    var { vif } = this.props;

    if (this.tableView.querySelector('.socrata-visualization')) {
      this.tableRenderer.update(vif);
    } else {
      this.tableRenderer = new VisualizationRenderer(vif, this.tableView);
    }
  }

  render() {
    var { metadata } = this.props;
    var basedOn = hasData(metadata) ? this.renderBasedOn() : null;

    return (
      <div className="authoring-table-view-container">
        <h6 className="authoring-table-view-title">
          {I18n.t('shared.visualizations.table_view.title')}{basedOn}
        </h6>
        <div className="authoring-table-view" ref={(ref) => this.tableView = ref} />
      </div>
    );
  }
}

TableView.propTypes = {
  metadata: PropTypes.object
};

function mapStateToProps(state) {
  return {
    metadata: state.metadata,
    vif: state.vifAuthoring.vifs.table
  };
}

export default connect(mapStateToProps, {})(TableView);
