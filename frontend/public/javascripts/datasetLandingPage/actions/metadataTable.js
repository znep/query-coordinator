import 'whatwg-fetch';
import { checkStatus } from 'common/http';

export function createDSMAPIRevision(fourfour) {
  return () => {
    return fetch(`/api/publishing/v1/revision/${fourfour}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': window.serverConfig.csrfToken
      },
      body: JSON.stringify({
        type: 'replace'
      })
    })
      .then(checkStatus)
      .then(resp => resp.json())
      .then(({ resource }) => {
        window.location.href = `/d/${fourfour}/revisions/${resource.revision_seq}`;
      })
      .catch(err => {
        if (err.response.status === 401) {
          window.location.href = '/login';
        }
      });
  };
}
