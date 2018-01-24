import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

import I18n from 'common/i18n';

export const Header = (props) => {
  const { children, className, showCloseButton, title, onDismiss } = props;

  const headerClasses = classNames({
    'modal-header': true,
    [className]: !!className
  });

  const renderCloseButton = (show) => {
    if (show === false) {
      return null;
    }

    return (
      <button
        type="button"
        className="btn btn-transparent modal-header-dismiss"
        onClick={onDismiss}
        aria-label={I18n.t('shared.components.modal.aria_close')}>
        <span className="socrata-icon-close-2" />
      </button>
    );
  };

  return (
    <header className={headerClasses}>
      {title && <h1 className="h5 modal-header-title">{title}</h1>}
      {children}
      {renderCloseButton(showCloseButton)}
    </header>
  );
};

Header.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  showCloseButton: PropTypes.bool,
  title: PropTypes.string,
  onDismiss: PropTypes.func
};

Header.defaultProps = {
  className: null,
  showCloseButton: true,
  title: null,
  onDismiss: () => {}
};

export default Header;
