import React, { PropTypes } from 'react';

import { hasApiError } from '../apiCallUtils';

/** sometimes you want to pass in an error message w/ HTML in it (e.g. a link)
 * but we don't want to dangerouslySetInnerHTML here, because sometimes error messages
 * accidentally have HTML in them (e.g. nginx returning an HTML 502 page from an API
 * that usually returns JSON); this puts the onus on the caller to escape any HTML
 * that might be in their error message.
 */
export function FlashMessage({ flashType, children }) {
  return (
    <div className={'flash-alert ' + flashType}>
      {children}
    </div>
  );
}

FlashMessage.propTypes = {
  flashType: PropTypes.oneOf(['info', 'success', 'warning', 'error']).isRequired,
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.element)
  ]).isRequired
};

// saveDescription is the phrase we'll use to describe what we tried to saveState
// i.e. We were unable to save your {0} due to a network error.
// TODO: I18n it...
export function ApiErrorFlashMessage({ apiCalls, saveDescription }) {
  const filteredCalls = _.filter(apiCalls, hasApiError);
  const messages = _.uniq(_.map(filteredCalls, (call) => {
    return getErrorMessage(call.error, saveDescription);
  }));

  if (_.isEmpty(messages)) {
    return null;
  } else if (messages.length === 1) {
    return (
      <FlashMessage flashType="error">
        {messages[0]}
      </FlashMessage>
    );
  } else {
    return (
      <FlashMessage flashType="error">
        <ul>{messages.map((message) => <li>{message}</li>)}</ul>
      </FlashMessage>
    );
  }
}

ApiErrorFlashMessage.propTypes = {
  apiCalls: PropTypes.arrayOf(PropTypes.object).isRequired,
  saveDescription: PropTypes.string.isRequired
};

function getFormattedErrorMessage(error, hadMessage, saveDescription) {
  switch (error) {
    case 'Failed to fetch':
      return I18n.screens.import_pane.errors.network_error.format(saveDescription);
    case 'Bad Gateway':
      return I18n.screens.import_pane.errors.http_error.format(error, saveDescription);
    default:
      if (hadMessage) {
        return error;
      } else {
        return I18n.screens.import_pane.unknown_error;
      }
  }
}

function getErrorMessage(error, saveDescription) {
  if (error.message) {
    return getFormattedErrorMessage(error.message, true, saveDescription);
  } else {
    return getFormattedErrorMessage(error, false, saveDescription);
  }
}
