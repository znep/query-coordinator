import React from 'react';
import PropTypes from 'prop-types';
import styles from './SourceMessage.scss';

const SourceMessage = ({ hrefExists, schemaExists }) => {
  let message;

  if (hrefExists) {
    message = I18n.show_sources.error_href_exists;
  } else if (schemaExists) {
    message = I18n.show_sources.error_schema_exists;
  } else {
    message = I18n.show_sources.error_unknown;
  }

  return (
    <section className={styles.container} data-cheetah-hook="no-source-ingress-message">
      <span className={styles.message}>{message}</span>
    </section>
  );
};

SourceMessage.propTypes = {
  hrefExists: PropTypes.bool,
  schemaExists: PropTypes.bool
};

export default SourceMessage;
