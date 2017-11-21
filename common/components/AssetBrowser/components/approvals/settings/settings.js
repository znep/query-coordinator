import React, { Component } from 'react';
import PropTypes from 'prop-types';
import I18n from 'common/i18n';

import Approvers from './approvers';
import AutoApproval from './auto_approval';
import Introduction from './introduction';
import Reapproval from './reapproval';

const translationScope = 'approvals.settings';

const Settings = (props) => {
  return (
    <div className="settings">
      <div className="settingsContainer">
        <Introduction translationScope={translationScope} />

        <div className="automatically-approve">
          <AutoApproval translationScope={translationScope} type="official" />
          <AutoApproval translationScope={translationScope} type="community" />
        </div>
        <Reapproval {...props} translationScope={translationScope} />
        <Approvers translationScope={translationScope} />
        <div className="actions">
          <button className="btn btn-sm">{I18n.t('cancel', { scope: translationScope })}</button>
          <button className="btn btn-sm btn-primary btn-dark">{I18n.t('save', { scope: translationScope })}</button>
        </div>
      </div>
    </div>
  );
};

Settings.propTypes = {
  onReapprovalClick: PropTypes.func.isRequired,
  reapprovalPolicy: PropTypes.oneOf(['manual', 'auto']).isRequired
};

export default Settings;
