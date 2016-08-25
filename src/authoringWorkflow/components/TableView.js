import $ from 'jquery';
import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../I18n';
import {
  getDatasetLink,
  getDatasetName,
  hasData
} from '../selectors/metadata';
import '../../views/Table';

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
        &nbsp;-&nbsp;
        <a href={getDatasetLink(metadata)} target="_blank">{getDatasetName(metadata)}</a>
      </span>
    );
  },

  renderTableView() {
    var { metadata, vif } = this.props;
    var $tableView = $(this.tableView);
    var alreadyRendered = $tableView.find('.socrata-visualization').length === 1;

    if (alreadyRendered) {

      $tableView[0].dispatchEvent(
        new CustomEvent(
          'SOCRATA_VISUALIZATION_RENDER_VIF',
          {
            detail: this.props.vif,
            bubbles: true
          }
        )
      );
    } else {

      $tableView.socrataTable(vif);
    }
  },

  render() {
    var { metadata } = this.props;
    var basedOn = hasData(metadata) ? this.renderBasedOn() : null;

    return (
      <div className="authoring-table-view-container">
        <h6 className="authoring-table-view-title">
          {translate('table_view.title')}{basedOn}
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
