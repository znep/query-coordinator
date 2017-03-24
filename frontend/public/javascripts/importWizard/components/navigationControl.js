import React, { PropTypes } from 'react';
import classNames from 'classnames';
import _ from 'lodash';
import { SHOW_RESPONSE_MS } from '../server';

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

function saveButton(onSave, saveStatus) {
  const disabledStatuses = ['error', 'success', 'no-changes', 'busy'];

  const disabledState = _.isUndefined(onSave) || _.includes(disabledStatuses, saveStatus);

  switch (saveStatus) {
    case 'busy':
      return (
        <a className={classNames('button', 'saveButton', `btn-${saveStatus}`, {'disabled': disabledState})}>
          <span className="spinner-default spinner-dark"></span>
        </a>
      );
    case 'no-changes':
      return (
        <a
          className={classNames('button', 'saveButton', `btn-${saveStatus}`, {'disabled': disabledState})}
          onClick={onSave}
          title={I18n.screens.wizard.no_changes_to_be_saved}>
          {I18n.screens.wizard.save}
        </a>
      );
    case 'error':
    case 'success':
    case 'ready':
    default:
      return (
        <a
          className={classNames('button', 'saveButton', `btn-${saveStatus}`, {'disabled': disabledState})}
          onClick={onSave}>
          {I18n.screens.wizard.save}
        </a>
      );
  }
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

function view({finishLink, onNext, nextText, nextIsDefault, onPrev, onSave, cancelLink, saveStatus}) {
  return (
    <div className="wizardButtons clearfix">
      {cancelButton(cancelLink)}
      {saveButton(onSave, saveStatus)}
      <div className="button navButtons">
        {prevButton(onPrev)}
        {nextButton(finishLink, onNext, nextText, nextIsDefault)}
      </div>
    </div>
  );
}

// default isDataChanged to true b/c most pages can't tell
export function saveButtonStatus(saveApiStatus, resultTimestamp, isDataChanged = true) {
  const showResultsOnButton = resultTimestamp > (Date.now() - SHOW_RESPONSE_MS + 200);

  if (!showResultsOnButton) {
    return isDataChanged ? 'ready' : 'no-changes';
  }

  switch (saveApiStatus) {
    case 'InProgress':
      return 'busy';
    case 'Error':
      return 'error';
    case 'Success':
      return 'success';
    case 'NotStarted':
      return isDataChanged ? 'ready' : 'no-changes';
    default:
      console.log(`You need to add code to handle your status: ${status}`);
      return 'ready';
  }
}

view.propTypes = {
  finishLink: PropTypes.string,
  onNext: PropTypes.func,
  nextText: PropTypes.string,
  nextIsDefault: PropTypes.bool,
  onSave: PropTypes.func,
  onPrev: PropTypes.func,
  cancelLink: PropTypes.string,
  saveStatus: PropTypes.string
};

export default view;
