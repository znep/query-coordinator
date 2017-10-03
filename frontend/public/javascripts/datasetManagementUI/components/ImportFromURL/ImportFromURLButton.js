import PropTypes from 'prop-types';
import React from 'react';
import styles from './ImportFromURL.scss';

const ImportFromURLButton = ({ params, showCreateURLModal }) => (
  <a
    className={styles.urlButton}
    onClick={() => showCreateURLModal({ params })}>
    {I18n.manage_uploads.new_url_source}
  </a>
);

ImportFromURLButton.propTypes = {
  params: PropTypes.object.isRequired,
  showCreateURLModal: PropTypes.func.isRequired
};

export default ImportFromURLButton;
