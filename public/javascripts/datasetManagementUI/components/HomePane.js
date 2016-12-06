import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { openDataModal } from '../actions/manageData';
import { openMetadataModal } from '../actions/manageMetadata';

export function HomePane({ onClickManageMetadata, onClickManageData }) {
  return (
    <div id="home-pane">
      <section className="management-ui-section">
        <h2>{I18n.home_pane.metadata} <span className="small">{I18n.home_pane.required}</span></h2>
        <div className="alert default manage-section-box">
          {I18n.home_pane.metadata_blurb}
          <button
            id="manage-metadata"
            className="btn btn-default btn-sm"
            onClick={onClickManageMetadata}>
              {I18n.home_pane.metadata_manage_button}
          </button>
        </div>
      </section>
      <section className="management-ui-section">
        <h2>{I18n.home_pane.data}</h2>
        <div className="alert default manage-section-box">
          {I18n.home_pane.data_blurb}
          <button id="manage-data" className="btn btn-default btn-sm" onClick={onClickManageData}>
            {I18n.home_pane.data_manage_button}
          </button>
        </div>
      </section>
    </div>
  );
}

HomePane.propTypes = {
  onClickManageMetadata: PropTypes.func.isRequired,
  onClickManageData: PropTypes.func.isRequired
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onClickManageMetadata: openMetadataModal,
    onClickManageData: openDataModal
  }, dispatch);
}

export default connect(_.stubObject, mapDispatchToProps)(HomePane);
