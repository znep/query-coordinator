import React from 'react';
import PropTypes from 'prop-types';
import styles from 'components/ApiCallButton/ApiCallButton.scss';

const SaveButtons = ({ saveHrefForm, isDirty }) => (
  <div>
    <button className={styles.baseBtn} onClick={() => saveHrefForm(false)} disabled={!isDirty}>
      {I18n.common.save}
    </button>
    <button className={styles.baseBtn} onClick={() => saveHrefForm(true)} disabled={!isDirty}>
      {I18n.show_sources.save_and_exit}
    </button>
  </div>
);

SaveButtons.propTypes = {
  saveHrefForm: PropTypes.func.isRequired,
  isDirty: PropTypes.bool.isRequired
};

export default SaveButtons;
