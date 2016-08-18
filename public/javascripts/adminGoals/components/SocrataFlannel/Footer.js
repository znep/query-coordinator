import React from 'react';
import classNames from 'classnames/bind';

const Header = props => {
  return (
    <footer className={ classNames('flannel-actions', props.className) }>
      { props.children }
    </footer>
  );
};

export default Header;
