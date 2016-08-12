import React from 'react';
import classNames from 'classnames/bind';

/**
 * Styled notification alert.
 *
 * @param {Object} props
 * @param {String} props.type Alert type. Supported values are: default, info, success, warning, error
 * @param {String} props.message Alert message
 * @param {Function} props.onDismiss Called when user clicks on it
 */
export default function SocrataAlert(props) {
  let alertProps = {
    onClick: props.onDismiss,
    className: classNames('alert', props.type),
    dangerouslySetInnerHTML: {
      __html: props.message
    }
  };

  return <div { ...alertProps } />;
}