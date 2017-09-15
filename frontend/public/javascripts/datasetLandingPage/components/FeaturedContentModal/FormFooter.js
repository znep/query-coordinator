import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

class FormFooter extends Component {
  renderSaveButton() {
    const {
      canSave,
      displaySaveButton,
      isSaved,
      isSaving,
      onClickSave,
      saveText,
      savedText
    } = this.props;

    if (!displaySaveButton) { return null; }

    const saveButtonClassName = classNames({
      'btn': true,
      'btn-sm': true,
      'btn-success': isSaved,
      'btn-primary': !isSaved,
      'btn-busy': isSaving,
      'save-button': true
    });

    let saveButtonContents;

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
  }

  render() {
    const {
      cancelText,
      onClickCancel
    } = this.props;

    return (
      <footer className="modal-footer">
        <div className="modal-footer-actions">
          <button
            key="cancel"
            className="btn btn-default btn-sm cancel-button"
            onClick={onClickCancel}>
            {cancelText}
          </button>

          {this.renderSaveButton()}
        </div>
      </footer>
    );
  }
}

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
