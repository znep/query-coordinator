import React from 'react';
import classNames from 'classnames/bind';

const Content = (props) => {
  return (
    <section className={ classNames('flannel-content', props.className) }>
      { props.children }
    </section>
  );
};

export default Content;
