import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classNames from 'classnames';

export default class RowDetail extends Component {
  static propTypes = {
    details: PropTypes.shape({
      // Column name
      title: PropTypes.string,

      // Icon of data type
      icon: PropTypes.object,

      // Long text description
      description: PropTypes.string,

      // Text justification option
      rightJustify: PropTypes.bool
    })
  }

  render() {
    const props = this.props;

    return (
      <div className={classNames('detail-view', { 'right-justified': props.rightJustify })}>
        <span>{props.details.title}</span>
        <span>{props.details.icon}</span>
      </div>
      );
  }
}
