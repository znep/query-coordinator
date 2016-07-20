import React from 'react';
import classNames from 'classnames/bind';

export default function SCAlert(props) {
  let alertProps = {
    onClick: props.onDismiss,
    className: classNames('alert', props.type),
    dangerouslySetInnerHTML: {
      __html: props.message
    }
  };

  return <div { ...alertProps } />;
}
