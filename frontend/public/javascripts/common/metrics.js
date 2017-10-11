import { checkStatus, defaultHeaders } from 'common/http';

export const sendAnalytics = (viewId) => {
  const url = `/api/views/${viewId}.json?method=opening`;
  const fetchOptions = {
    method: 'POST',
    headers: defaultHeaders,
    credentials: 'same-origin'
  };

  return fetch(url, fetchOptions).
    then(checkStatus).
    catch(error => console.log(error));
};

