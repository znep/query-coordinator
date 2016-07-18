import React from 'react';
import classNames from 'classnames/bind';

export function Header (props) {
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

export function Content (props) {
  return (
    <section className="modal-content">
      { props.children }
    </section>
  );
}

export function Footer (props) {
  return (
    <footer className="modal-footer">
      <div className="modal-footer-actions">
        { props.children }
      </div>
    </footer>
  );
}

export function Modal (props) {
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
};

