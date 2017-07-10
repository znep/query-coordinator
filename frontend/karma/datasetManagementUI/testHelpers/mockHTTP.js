export function mockXHR(status, body) {
  const realXMLHttpRequest = window.XMLHttpRequest;

  // mock XHR (for actual source bytes)
  window.XMLHttpRequest = function() {};
  window.XMLHttpRequest.prototype.open = function(method, url) {
    this.method = method;
    this.url = url;
    this.source = {};
    this.headers = {};
  };
  window.XMLHttpRequest.prototype.send = function(payload) {
    this.source.onprogress({
      loaded: 50,
      total: 100
    });

    this.status = status;
    this.responseText = JSON.stringify(body);

    setTimeout(() => {
      this.onload();
    }, 0);
  };
  window.XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
    this.headers[header] = value;
  };

  return () => {
    window.XMLHttpRequest = realXMLHttpRequest;
  }
}

export function mockFetch(responses, done) {
  const realFetch = window.fetch;
  const calls = {};
  _.forEach(responses, (responsesForUrl, responseUrl) => {
    calls[responseUrl] = {};
    _.forEach(responsesForUrl, (_response, responseMethod) => {
      calls[responseUrl][responseMethod] = 0;
    });
  });

  window.fetch = (url, options) => {
    const method = options.method || 'GET';
    return new Promise((resolve) => {
      if (!_.has(responses, [url, method])) {
        const error = new Error(`test requested unmocked URL/method: ${method} ${url}`);
        if (done) {
          done(error);
          return;
        } else {
          throw error;
        }
      }
      resolve({
        status: responses[url][method]['status'] || 200,
        json: () => (new Promise((resolve) => {
          resolve(responses[url][method]['response']);
          calls[url][method]++;
        }))
      });
    });
  };

  return {
    unmockFetch: () => {
      window.fetch = realFetch;
    },
    calls: calls
  }
}
