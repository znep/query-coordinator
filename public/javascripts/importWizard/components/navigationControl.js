import React, { PropTypes } from 'react';

function nextButton(finishLink, onNext) {
  if (_.isUndefined(finishLink)) {
    const nextButtonStatus =
      onNext
        ? ''
        : ' disabled';

    return (
      <a
        className={'button nextButton' + nextButtonStatus}
        onClick={onNext}>
        {I18n.screens.wizard.next}
      </a>
    );
  } else {
    return (
      <a
        className="button nextButton default"
        href={finishLink}>
        {I18n.screens.wizard.finish}
      </a>
    );
  }
}

function prevButton(onPrev) {
  const prevButtonStatus =
    _.isUndefined(onPrev)
      ? ' disabled'
      : '';

  return (
    <a
      className={'button prevButton' + prevButtonStatus}
      onClick={onPrev}>
      {I18n.screens.wizard.previous}
    </a>
  );
}

function saveButton(onSave) {
  const saveButtonStatus =
    _.isUndefined(onSave)
      ? ' disabled'
      : '';

  return (
    <a
      className={'button saveButton' + saveButtonStatus}
      onClick={onSave}>
      {I18n.screens.wizard.save}
    </a>
  );
}

function cancelButton(cancelLink) {
  const cancelButtonStatus =
    _.isUndefined(cancelLink)
      ? ' disabled'
      : '';

  return (
    <a
      className={'button cancelButton' + cancelButtonStatus}
      href={cancelLink}>
      {I18n.screens.wizard.cancel}
    </a>
  );
}


function view({finishLink, onNext, onPrev, onSave, cancelLink}) {
  return (
    <div className="wizardButtons clearfix">
      {cancelButton(cancelLink)}
      {saveButton(onSave)}
      <div className="button navButtons">
        {prevButton(onPrev)}
        {nextButton(finishLink, onNext)}
      </div>
    </div>
  );
}

view.propTypes = {
  finishLink: PropTypes.string,
  onNext: PropTypes.func,
  onSave: PropTypes.func,
  onPrev: PropTypes.func,
  cancelLink: PropTypes.string
};

export default view;
