import React, { PropTypes } from 'react';
import classNames from 'classnames';

import { translate as t } from '../../common/I18n';

export const Header = (props) => {
  const { children, className, title, onDismiss } = props;

  const headerClasses = classNames({
    'modal-header': true,
    [className]: !!className
  });

  return (
    <header className={headerClasses}>
      <h1 className="h5 modal-header-title">
        {title}
      </h1>
      {children}
      <button
        type="button"
        className="btn btn-transparent modal-header-dismiss"
        onClick={onDismiss}
        aria-label={t('modal.aria_close')}>
        <span className="socrata-icon-close-2" />
      </button>
    </header>
  );
};

Header.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  title: PropTypes.string,
  onDismiss: PropTypes.func.isRequired
};

export default Header;
