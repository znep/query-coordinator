import React, { Component } from 'react';
import PropTypes from 'prop-types';

import I18n from 'common/i18n';
import SocrataIcon from 'common/components/SocrataIcon';

class ManageAccessButton extends React.Component {
  onClick = () => {
    // Assume we want to refresh on save if we're not on the grid view.
    // This is mainly because elsewhere has disparate components displaying
    // the state of the permissions of the dataset, and the only real way to update
    // these is to refresh the page.
    // On the grid view, however, the access manager is the *only* way to view
    // the permissions of the dataset.
    // We may want something more robust in the future, but this works for now.
    const refreshOnSave = !window.location.href.endsWith('/data');
    window.socrata.showAccessManager(refreshOnSave);
  }

  render() {
    return (<div className="manage-access-wrapper">
      <button
        className="btn btn-simple manage-access-button"
        onClick={this.onClick}>
        <SocrataIcon name="add-collaborator" />
        {I18n.t('shared.components.asset_action_bar.manage_access')}
      </button>
    </div>);
  }
}

export default ManageAccessButton;
