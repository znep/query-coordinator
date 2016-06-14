import classNames from 'classnames';
import React, { PropTypes } from 'react';

var FormFooter = function(props) {
  var {
    cancelText,
    canSave,
    displaySaveButton,
    isSaved,
    isSaving,
    onClickCancel,
    onClickSave,
    saveText,
    savedText
  } = props;

  var renderSaveButton = function() {
    if (!displaySaveButton) { return null; }

    var saveButtonClassName = classNames({
      'btn': true,
      'btn-sm': true,
      'btn-success': isSaved,
      'btn-primary': !isSaved,
      'btn-busy': isSaving,
      'save-button': true
    });

    var saveButtonContents;

    if (isSaving) {
      saveButtonContents = (
        <div aria-label={I18n.saving} className="spinner-default spinner-btn-primary" />
      );
    } else if (isSaved) {
      saveButtonContents = savedText;
    } else {
      saveButtonContents = saveText;
    }

    return (
      <button
        key="save"
        className={saveButtonClassName}
        disabled={isSaving || !canSave}
        onClick={onClickSave}>
        {saveButtonContents}
      </button>
    );
  };

  return (
    <footer className="modal-footer">
      <div className="modal-footer-actions">
        <button
          key="cancel"
          className="btn btn-default btn-sm cancel-button"
          onClick={onClickCancel}>
          {cancelText}
        </button>

        {renderSaveButton()}
      </div>
    </footer>
  );
};

FormFooter.propTypes = {
  cancelText: PropTypes.string,
  canSave: PropTypes.bool,
  displaySaveButton: PropTypes.bool,
  isSaved: PropTypes.bool,
  isSaving: PropTypes.bool,
  onClickCancel: PropTypes.func,
  onClickSave: PropTypes.func,
  saveText: PropTypes.string,
  savedText: PropTypes.string
};

export default FormFooter;
