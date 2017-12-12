import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classNames from 'classnames';
import I18n from 'common/i18n';
import SocrataIcon from 'common/components/SocrataIcon';

class ManageAccessButton extends React.Component {
  render() {
    const text = I18n.t('shared.components.asset_action_bar.manage_access');

    return (
      <button className="btn btn-alternate manage-access-button">
        <SocrataIcon name="add-collaborator" />
        {text}
      </button>
    );
  }
}

export default ManageAccessButton;
