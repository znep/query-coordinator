var pageLoadId = randomNChars(16);

function randomNChars(n) {
  var text = '';
  var possible = 'abcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < n; i++ ) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

module.exports = function requestIdProvider() {
  return {
    generate: function() {
      return pageLoadId + randomNChars(16);
    }
  };
};