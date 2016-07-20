import React from 'react';
import classNames from 'classnames/bind';

/**
 * @param {Object} props
 * @param {String} props.title Modal title
 * @param {Function} props.onClick Callback for close button
 */
export function Header(props) {
  return (
    <header className="modal-header">
      <h1 className="h5 modal-header-title">
        { props.title }
      </h1>
      <button className="btn btn-transparent modal-header-dismiss" onClick={ props.onClose }>
        <span className="icon-close-2" />
      </button>
    </header>
  );
}

export function Content(props) {
  return (
    <section className="modal-content">
      { props.children }
    </section>
  );
}

export function Footer(props) {
  return (
    <footer className="modal-footer">
      <div className="modal-footer-actions">
        { props.children }
      </div>
    </footer>
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
    'modal-full': props.fullScreen
  });

  return (
    <div className={ modalClasses }>
      <div className="modal-container">
        { props.children }
      </div>
    </div>
  );
}

