import fetchMock from 'fetch-mock';
import xhrMock from 'xhr-mock';
import * as dsmapiLinks from 'dsmapiLinks';
import * as responses from './responses';

fetchMock.configure({
  sendAsJson: false,
  headers: {'Content-Type': 'application/json'}
});

export const uploadCreate = () => fetchMock.post(dsmapiLinks.uploadCreate, {
  body: JSON.stringify(responses.uploadCreate),
  status: 201,
  statusText: 'Created'
});

export const uploadBytes = () => fetchMock.post(dsmapiLinks.uploadBytes, {
  body: JSON.stringify(responses.uploadBytes),
  status: 200,
  statusText: 'OK'
});

export const uploadShow = () => fetchMock.get(dsmapiLinks.uploadShow, {
  body: JSON.stringify(responses.uploadShow),
  status: 200,
  statusText: 'OK'
});

export const uploadBytesXHR = () => {
  xhrMock.setup();

  xhrMock.get(dsmapiLinks.uploadBytes, (req, res) => res
      .status(200)
      .body(JSON.stringify(responses.uploadBytes)))
};

const mockAPI = () => {
  uploadBytesXHR();
  uploadCreate();
  uploadBytes();
  uploadShow();

  return xhrMock.teardown;
};

export default mockAPI;
