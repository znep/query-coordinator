export function mockXHR(status, body) {
  const realXMLHttpRequest = window.XMLHttpRequest;

  // mock XHR (for actual upload bytes)
  window.XMLHttpRequest = function() {};
  window.XMLHttpRequest.prototype.open = function(method, url) {
    this.method = method;
    this.url = url;
    this.upload = {};
    this.headers = {};
  };
  window.XMLHttpRequest.prototype.send = function(payload) {
    this.upload.onprogress({
      loaded: 50,
      total: 100
    });

    this.status = status;
    this.responseText = JSON.stringify(body);

    this.onload();
  };
  window.XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
    this.headers[header] = value;
  };

  return () => {
    window.XMLHttpRequest = realXMLHttpRequest;
  }
}

export function mockFetch(responses) {
  const realFetch = window.fetch;

  window.fetch = (url, options) => {
    return new Promise((resolve) => {
      resolve({
        status: 200,
        json: () => (new Promise((resolve) => {
          resolve(responses[url][options.method || 'GET']);
        }))
      });
    });
  };

  return () => {
    window.fetch = realFetch;
  }
}