import React from 'react';
import classNames from 'classnames/bind';

const Header = props => {
  return (
    <header className={ classNames('flannel-header', props.className) }>
      <h1 className="flannel-header-title h5">{ props.title }</h1>
      <button className="btn btn-transparent flannel-header-dismiss" onClick={ props.closeFlannel }>
        <span className="icon-close-2" />
      </button>
    </header>
  );
};

export default Header;
