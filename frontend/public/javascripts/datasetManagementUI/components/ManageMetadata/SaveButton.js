import React, { PropTypes } from 'react';
import _ from 'lodash';
import styles from 'styles/ManageMetadata/SaveButton.scss';

const SaveButton = ({ isDirty, onSaveClick, isSaving }) => {
  const handler = isDirty ? onSaveClick : _.noop;

  return (
    <button
      id="save"
      className={isSaving ? styles.updatingBtn : styles.baseBtn}
      onClick={handler}
      disabled={!isDirty || isSaving}>
      {
        isSaving
          ? <span className={styles.spinner}></span>
          : I18n.common.save
      }
    </button>
  );
};

SaveButton.propTypes = {
  isDirty: PropTypes.bool,
  onSaveClick: PropTypes.func,
  isSaving: PropTypes.bool
};

export default SaveButton;
