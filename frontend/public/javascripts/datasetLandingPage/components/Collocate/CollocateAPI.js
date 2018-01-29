import { fetchJsonWithDefaultHeaders } from 'common/http';

function postCollocate(source, dest, explain) {
  const url = `/api/collocate?explain=${explain}`;
  const body = JSON.stringify(
    { collocations: [[`_${source}`, `_${dest}`]] }
  );

  const fetchOptions = {
    method: 'POST',
    credentials: 'same-origin',
    body: body
  };

  return fetchJsonWithDefaultHeaders(url, fetchOptions);
}

// Return a bool indicating if the explain successfully executed
export function validateCollocate(source, dest) {
  return postCollocate(source, dest, true).
    then(() => true).
    catch(() => false);
}

// eslint-disable-next-line no-unused-vars
export function executeCollocate(source, dest, columnMapping) {
  // TODO: Implement
  // Should fire the collocation off as not dry run and call out to some ambiguous core
  // endpoint to store the column mappings. Depends on derived view to decide implementation
}
