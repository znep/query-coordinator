import PropTypes from 'prop-types';
import React from 'react';
import I18n from 'common/i18n';
import SocrataIcon from '../SocrataIcon';

export const FlannelHeader = ({ title, onDismiss }) => {
  const closeButtonAttributes = {
    className: 'btn btn-transparent socrata-flannel-header-dismiss',
    'aria-label': I18n.t('shared.components.flannel.close_popup'),
    onClick: onDismiss
  };

  return (
    <header className="socrata-flannel-header">
      <span className="socrata-flannel-header-title">{title}</span>
      <button {...closeButtonAttributes}>
        <SocrataIcon name="close-2" />
      </button>
    </header>
  );
};

FlannelHeader.propTypes = {
  title: PropTypes.string.isRequired,
  onDismiss: PropTypes.func.isRequired
};

export default FlannelHeader;
