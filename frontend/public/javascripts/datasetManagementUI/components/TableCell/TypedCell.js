import PropTypes from 'prop-types';
import React, { Component } from 'react';
import _ from 'lodash';
import styles from './TableCell.scss';

const formatMapping = {
  'align.left': styles.formatAlignLeft,
  'align.right': styles.formatAlignRight,
  'align.center': styles.formatAlignCenter
};

class TypedCell extends Component {
  lookupClasses() {
    return _.compact(
      _.map(this.props.format, (value, key) => {
        return formatMapping[`${key}.${value}`];
      })
    );
  }

  render() {
    const classNames = this.lookupClasses();

    if (this.props.isDropping) {
      classNames.push(styles.dropping);
    }

    return <div className={classNames.join(' ')}>{this.props.value}</div>;
  }
}

TypedCell.propTypes = {
  value: PropTypes.string,
  format: PropTypes.object,
  isDropping: PropTypes.bool
};

export default TypedCell;
