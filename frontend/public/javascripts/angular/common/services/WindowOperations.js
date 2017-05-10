module.exports = function($window) {
  return {
    setTitle: function(title) {
      $window.document.title = title;
    },
    navigateTo: function(url) {
      $window.document.location.href = url;
    }
  };
};
