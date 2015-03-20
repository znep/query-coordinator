angular.module('socrataCommon.services').factory('WindowOperations', function() {
  return {
    setTitle: function(title) {
      document.title = title;
    },
    navigateTo: function(url) {
      document.location.href = url;
    }
  }
});
