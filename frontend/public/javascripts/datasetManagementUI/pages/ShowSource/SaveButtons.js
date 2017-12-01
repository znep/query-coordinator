import React from 'react';
import PropTypes from 'prop-types';
import styles from 'components/ApiCallButton/ApiCallButton.scss';

const SaveButtons = ({ saveHrefForm, isDirty }) => (
  <div>
    <label
      htmlFor="submit-href-form"
      className={`${styles.baseBtn} ${isDirty ? '' : styles.disabled}`}
      onClick={isDirty ? () => saveHrefForm(false) : e => e.preventDefault()}
      disabled={!isDirty}>
      {I18n.common.save}
    </label>
    <label
      htmlFor="submit-href-form"
      className={`${styles.baseBtn} ${isDirty ? '' : styles.disabled}`}
      onClick={isDirty ? () => saveHrefForm(true) : e => e.preventDefault()}>
      {I18n.show_sources.save_and_exit}
    </label>
  </div>
);

SaveButtons.propTypes = {
  saveHrefForm: PropTypes.func.isRequired,
  isDirty: PropTypes.bool.isRequired
};

export default SaveButtons;
