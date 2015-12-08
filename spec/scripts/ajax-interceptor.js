/**
 * In a testing environment, there are times when you don't want an AJAX
 * request to be made (due to it being unavailable), but would still like
 * an appropriate response. This interceptor allows all XMLHTTPRequests to be
 * parsed first, and then respond as you see fit.
 *
 * The full sinon API is available in the onCreate callback.
 */
sinon.useFakeXMLHttpRequest().onCreate = function(xhr) {

  // The XHR object is empty until we wait a frame for
  // it to load.
  setTimeout(function() {
    console.log(xhr.url);
    var url = xhr.url;

    if (/\/api\/views\/\w{4}-\w{4}\/grants/.test(url)) {
      xhr.respond(200, {
        'Content-Type': 'application/json'
      }, '[{"userEmail": "test@socrata.com", "type": "viewer"}]');
    } else if (/\/stories\/api\/v1\/stories\/\w{4}-\w{4}\/drafts/.test(url)) {
      console.log('drafts');
      xhr.respond(200, {
        'Content-Type': 'application/json',
        'X-Story-Digest': 'abc'
      }, '[]');
    }
    // Add more string URL tests here.
  });
};
