import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

/**
 * The EditBar is a component designed to render a basic Edit Bar. It renders a simple black bar
 * with a menu button (with its own click handler, to be used, for instance, to trigger opening a
 * sidebar), an automatically ellipsified title, and an area to render custom elements.
 */
export const EditBar = (props) => {
  const {
    name,
    menuIcon,
    menuLabel,
    onClickMenu,
    onClickName,
    children
  } = props;

  const menuClasses = `btn-menu ${menuIcon || 'socrata-icon-cards'}`;

  let pageName = null;

  if (name) {
    const classes = classNames('page-name', {
      'page-name-clickable': onClickName
    });

    pageName = <span className={classes} onClick={onClickName}>{name}</span>;
  }

  return (
    <nav className="edit-bar">
      <button className={menuClasses} onClick={onClickMenu} aria-label={menuLabel} />
      {pageName}
      {children}
    </nav>
  );
};

EditBar.propTypes = {
  /**
   * The name displayed, bolded, next to the menu button.
   */
  name: PropTypes.string,

  /**
   * The class of the icon to display in the menu button.
   */
  menuIcon: PropTypes.string,

  /**
   * The aria label to use for the menu button.
   */
  menuLabel: PropTypes.string,

  /**
   * The click handler for the menu button.
   */
  onClickMenu: PropTypes.func,

  /**
   * The click handler for the title.  If set, the title will have hover styles applied.
   */
  onClickName: PropTypes.func,

  /**
   * Any children elements you'd like to render. Accessible as a prop or like this:
   * <EditBar>
   *   <OtherComponent />
   * </EditBar>
   */
  children: PropTypes.node
};

export default EditBar;
