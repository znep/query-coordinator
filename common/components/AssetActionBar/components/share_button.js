import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classNames from 'classnames';
import I18n from 'common/i18n';
import SocrataIcon from 'common/components/SocrataIcon';

class ShareButton extends React.Component {
  render() {
    const shareText = I18n.t('shared.components.asset_action_bar.share');

    return (
      <button className="btn btn-primary btn-dark share-button">
        <SocrataIcon name="add" />
        {shareText}
      </button>
    );
  }
}

export default ShareButton;
