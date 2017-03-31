import React, { PropTypes } from 'react';
import _ from 'lodash';
import styles from 'styles/ManageMetadata/SaveButton.scss';

const SaveButton = ({ isDirty, onSaveClick }) => {
  const isFormDirty = isDirty && isDirty.form;
  const handler = isFormDirty ? onSaveClick : _.noop;

  return (
    <button id="save" className={styles.baseBtn} onClick={handler} disabled={!isFormDirty}>
      {I18n.common.save}
    </button>
  );
};

SaveButton.propTypes = {
  isDirty: PropTypes.shape({
    form: PropTypes.bool
  }),
  onSaveClick: PropTypes.func
};

export default SaveButton;
