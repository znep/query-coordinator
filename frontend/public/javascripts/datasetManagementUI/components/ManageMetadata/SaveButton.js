import React, { PropTypes } from 'react';
import styles from 'styles/ManageMetadata/SaveButton.scss';

const SaveButton = ({ onSaveClick, isSaving }) => {
  return (
    <button
      id="save"
      className={isSaving ? styles.updatingBtn : styles.baseBtn}
      onClick={onSaveClick}
      disabled={isSaving}>
      {
        isSaving
          ? <span className={styles.spinner}></span>
          : I18n.common.save
      }
    </button>
  );
};

SaveButton.propTypes = {
  onSaveClick: PropTypes.func,
  isSaving: PropTypes.bool
};

export default SaveButton;
