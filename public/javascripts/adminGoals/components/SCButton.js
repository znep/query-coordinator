import React from 'react';
import classNames from 'classnames/bind';
import helpers from '../helpers/helpers';

export default class SCButton extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const props = this.props;
    const isPrimary = props.primary == true;
    const isAlternate = props.alternate == true;
    const isAlternate2 = props.alternate2 == true;
    const isSimple = props.simple == true;
    const isInverse = props.inverse == true;
    const isSmall = props.small == true;
    const isExtraSmall = props.extraSmall == true;
    const isInProgress = props.inProgress == true;
    const isDefault = helpers.noneOf([isPrimary, isAlternate, isAlternate2, isSimple, isInverse]);

    const classes = {
      btn: true,
      'btn-default': isDefault,
      'btn-primary': isPrimary,
      'btn-alternate': isAlternate,
      'btn-alternate-2': isAlternate2,
      'btn-simple': isSimple,
      'btn-inverse': isInverse,
      'btn-sm': isSmall,
      'btn-xs': isExtraSmall,
      'btn-busy': false // isInProgress
    };

    const spinner = isInProgress ? <span className="spinner-default spinner-btn-primary"/> : null;

    return (
      <button className={classNames(classes)} disabled={props.disabled} onClick={ isInProgress ? null : this.props.onClick }>
        { isInProgress ? spinner : this.props.children }
      </button>
    );
  }
}
