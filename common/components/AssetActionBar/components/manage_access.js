import React, { Component } from 'react';

import I18n from 'common/i18n';
import SocrataIcon from 'common/components/SocrataIcon';

class ManageAccessButton extends Component {
  render() {
    return (<div className="manage-access-wrapper">
      <button
        className="btn btn-simple manage-access-button"
        onClick={() => window.socrata.showAccessManager('manage_collaborators')}>
        <SocrataIcon name="add-collaborator" />
        {I18n.t('shared.components.asset_action_bar.manage_access')}
      </button>
    </div>);
  }
}

export default ManageAccessButton;
