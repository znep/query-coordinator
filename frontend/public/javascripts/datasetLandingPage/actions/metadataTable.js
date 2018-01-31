import 'whatwg-fetch';
import { checkStatus } from 'common/http';

const sharedConfig = {
  method: 'POST',
  credentials: 'same-origin',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-CSRF-Token': window.serverConfig.csrfToken
  }
};

// createDsmapiRevision :: String -> Promise Err JSON
function createDsmapiRevision(fourfour) {
  return fetch(`/api/publishing/v1/revision/${fourfour}`, {
    ...sharedConfig,
    body: JSON.stringify({
      type: 'replace'
    })
  })
    .then(checkStatus)
    .then(resp => resp.json())
    .then(({ resource }) => resource);
}

// createDsmapiViewSource :: String -> Int -> Promise Err JSON
function createDsmapiViewSource(fourfour, revisionSeq) {
  return fetch(`/api/publishing/v1/revision/${fourfour}/${revisionSeq}/source`, {
    ...sharedConfig,
    body: JSON.stringify({
      source_type: {
        type: 'view'
      }
    })
  })
    .then(checkStatus)
    .then(resp => resp.json());
}

// createDsmapiEdit :: String -> (() -> undefined)
export function createDsmapiEdit(fourfour) {
  return async () => {
    try {
      const { revision_seq } = await createDsmapiRevision(fourfour); // eslint-disable-line camelcase
      await createDsmapiViewSource(fourfour, revision_seq);
      window.location.href = `/d/${fourfour}/revisions/${revision_seq}`; // eslint-disable-line camelcase
    } catch (err) {
      // TODO: add some feedback for user if either call fails. Want to wait til
      // we know if this is going to be called in admin bar or someplace else.
      if (err.response.status === 401) {
        window.location.href = '/login';
      }
    }
  };
}
