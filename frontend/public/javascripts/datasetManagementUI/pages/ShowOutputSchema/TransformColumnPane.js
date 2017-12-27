import PropTypes from 'prop-types';
import React from 'react';
import TransformColumn from 'containers/TransformColumnContainer';
import classNames from 'classnames';
import styles from './ShowOutputSchema.module.scss';

const TransformColumnPane = (props) => {
  return (
    <div className={classNames(styles.contentWrap, styles.optionsWrap)}>
      <TransformColumn params={props.params} location={props.location} />
    </div>
  );
};

TransformColumnPane.propTypes = {
  params: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired
};

export default TransformColumnPane;
