import React from 'react';
import classNames from 'classnames/bind';

/**
 * @param {Object} props
 * @param {String} props.title Modal title
 * @param {Function} props.onClick Callback for close button
 */
export function Header(props) {
  const closeButton = <button type="button" className="btn btn-transparent modal-header-dismiss" onClick={ props.onClose } aria-label="Close quick edit form">
      <span className="icon-close-2" />
    </button>;
  return (
    <div className={ `modal-header ${props.className || ''}` }>
      <h1 className="h5 modal-header-title">
        { props.title }
      </h1>
      { props.children }
      { props.onClose ? closeButton : null }
    </div>
  );
}

export function Content(props) {
  return (
    <section className={ `modal-content ${props.className || ''}` } children={ props.children } />
  );
}

export function Footer(props) {
  return (
    <div className={ `modal-footer ${props.className || ''}` }>
      <div className="modal-footer-actions" children={ props.children } />
    </div>
  );
}

/**
 * Render to open, remove to hide.
 *
 * @param {Object} props
 * @param {Boolean} props.overlay Shows dark background (default: true)
 * @param {Boolean} props.fullScreen Modal covers the all screen
 */
export function Modal(props) {
  const modalClasses = classNames({
    modal: true,
    'modal-overlay': props.overlay !== false,
    'modal-full': props.fullScreen,
    [props.className]: true
  });

  return (
    <div className={ modalClasses } role="dialog">
      <div className="modal-container" children={ props.children } />
    </div>
  );
}
