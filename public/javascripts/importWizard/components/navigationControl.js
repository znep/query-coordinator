import React, { PropTypes } from 'react';
import classNames from 'classnames';
import _ from 'lodash';

function nextButton(finishLink, onNext, nextText, nextIsDefault) {
  if (!finishLink) {
    return (
      <a
        className={classNames(
          'button', 'nextButton', { 'disabled': !onNext, 'default': nextIsDefault })}
        onClick={onNext}>
        {_.defaultTo(nextText, I18n.screens.wizard.next)}
      </a>
    );
  } else {
    return (
      <a
        className="button nextButton default"
        href={finishLink}>
        {I18n.core.dialogs.done}
      </a>
    );
  }
}

function prevButton(onPrev) {
  return (
    <a
      className={classNames('button', 'prevButton', { 'disabled': !onPrev })}
      onClick={onPrev}>
      {I18n.screens.wizard.previous}
    </a>
  );
}

function saveButton(onSave) {
  return (
    <a
      className={classNames('button', 'saveButton', { 'disabled': !onSave })}
      onClick={onSave}>
      {I18n.screens.wizard.save}
    </a>
  );
}

function cancelButton(cancelLink) {
  return (
    <a
      className={classNames('button', 'cancelButton', { 'disabled': !cancelLink })}
      href={cancelLink}>
      {I18n.screens.wizard.cancel}
    </a>
  );
}


function view({finishLink, onNext, nextText, nextIsDefault, onPrev, onSave, cancelLink}) {
  return (
    <div className="wizardButtons clearfix">
      {cancelButton(cancelLink)}
      {saveButton(onSave)}
      <div className="button navButtons">
        {prevButton(onPrev)}
        {nextButton(finishLink, onNext, nextText, nextIsDefault)}
      </div>
    </div>
  );
}

view.propTypes = {
  finishLink: PropTypes.string,
  onNext: PropTypes.func,
  nextText: PropTypes.string,
  nextIsDefault: PropTypes.bool,
  onSave: PropTypes.func,
  onPrev: PropTypes.func,
  cancelLink: PropTypes.string
};

export default view;
