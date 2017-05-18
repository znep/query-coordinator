import React, { PropTypes } from 'react';
import { translate } from 'common/I18n';
import SocrataIcon from '../SocrataIcon';

export const FlannelHeader = ({ title, onDismiss }) => {
  const closeButtonAttributes = {
    className: 'btn btn-transparent socrata-flannel-header-dismiss',
    'aria-label': translate('flannel.close_popup'),
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
