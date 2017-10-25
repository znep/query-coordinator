import React, { Component } from 'react';
import I18n from 'common/i18n';

export class ApprovalActionButtons extends Component {
  getTranslation(key) {
    const scope = 'shared.asset_browser.result_list_table.approval_action_buttons';
    return I18n.t(key, { scope });
  }

  render() {
    // TODO: implement the functionality for these buttons
    return (
      <div className="approval-action-buttons">
        <button className="btn btn-sm btn-default">{this.getTranslation('approve')}</button>
        <button className="btn btn-sm btn-default">{this.getTranslation('reject')}</button>
      </div>
    );
  }
}

export default ApprovalActionButtons;
