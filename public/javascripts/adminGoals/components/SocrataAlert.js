import _ from 'lodash';
import { List } from 'immutable';
import React from 'react';
import classNames from 'classnames/bind';

/**
 * Styled notification alert.
 *
 * @param {Object} props
 * @param {String} props.type Alert type. Supported values are: default, info, success, warning, error
 * @param {String|jsx|array} props.message Alert message
 * @param {Function} props.onDismiss Called when user clicks on it
 */
export default function SocrataAlert(props) {
  let alertProps = {
    onClick: props.onDismiss,
    className: classNames('alert', props.type)
  };
  let jsxMessage;

  if (List.isList(props.message)) {
    const rows = _.map(props.message.toJS(), (row, index) => <p key={ index }>{ row }</p>);
    jsxMessage = <div>{ rows }</div>;
  } else if (_.isObject(props.message)) {
    jsxMessage = props.message;
  } else {
    alertProps.dangerouslySetInnerHTML = {
      __html: props.message
    }
  }

  return <div { ...alertProps }>{ jsxMessage }</div>;
}
