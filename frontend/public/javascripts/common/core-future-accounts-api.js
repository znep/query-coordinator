import { checkStatus, fetchJson, defaultHeaders } from 'common/http';
import _ from 'lodash';

function FutureAccountsCreationError(errors, fileName, lineNumber) {
  const instance = new Error(fileName, lineNumber);
  instance.errors = errors;
  Object.setPrototypeOf(instance, Object.getPrototypeOf(this));
  return instance;
}

FutureAccountsCreationError.prototype = Object.create(Error.prototype, {
  constructor: {
    value: Error,
    enumerable: false,
    writable: true,
    configurable: true
  }
});

const getFutureUsers = () => {
  const fetchOptions = {
    credentials: 'same-origin',
    headers: defaultHeaders
  };
  const apiPath = '/api/future_accounts';
  return fetchJson(apiPath, fetchOptions);
};

const postFutureUsers = (emails, roleId) => {
  const apiPath = '/api/future_accounts?method=createMultiple';
  const body = `addresses=${emails}&roleId=${roleId}`;
  const fetchOptions = {
    body,
    credentials: 'same-origin',
    headers: _.merge({}, defaultHeaders, { 'Content-Type': 'application/x-www-form-urlencoded' }),
    method: 'POST'
  };
  return fetchJson(apiPath, fetchOptions).then(response => {
    if (_.get(response, 'errors')) {
      throw new FutureAccountsCreationError(response.errors);
    } else {
      return _.get(response, 'created', []);
    }
  });
};

const removeFutureUser = (id) => {
  const apiPath = `/api/future_accounts?method=delete&id=${id}`;
  const fetchOptions = {
    credentials: 'same-origin',
    headers: defaultHeaders,
    method: 'DELETE'
  };

  return fetch(apiPath, fetchOptions).then(checkStatus);
};

const resendFutureUserEmail = (email) => {
  const apiPath = `/api/future_accounts?method=resendEmail&email=${email}`;
  const fetchOptions = {
    credentials: 'same-origin',
    headers: defaultHeaders,
    method: 'POST'
  };

  return fetchJson(apiPath, fetchOptions);
};

export default {
  getFutureUsers,
  postFutureUsers,
  removeFutureUser,
  resendFutureUserEmail,
  FutureAccountsCreationError
};
