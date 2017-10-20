import React from 'react';
import PropTypes from 'prop-types';
import styles from './SourceMessage.scss';

const SourceMessage = ({ hrefExists, schemaExists }) => {
  let message;

  if (hrefExists) {
    message = 'yo you already have an href, so cant do this';
  } else if (schemaExists) {
    message = 'yo there is a schema so cant do this';
  } else {
    message = 'error, go home';
  }

  return (
    <section className={styles.container}>
      <span className={styles.message}>{message}</span>
    </section>
  );
};

SourceMessage.propTypes = {
  hrefExists: PropTypes.bool,
  schemaExists: PropTypes.bool
};

export default SourceMessage;
