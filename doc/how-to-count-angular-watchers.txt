// Execute this in the console for a count of active $watchers.

(function () {
  var root = $(document.getElementsByTagName('body'));
  var watchers = 0;

  var f = function (element) {
    if (element.data().hasOwnProperty('$scope')) {
      watchers += (element.data().$scope.$$watchers || []).length;
    }

    angular.forEach(element.children(), function (childElement) {
      f($(childElement));
    });
  };

  f(root);

  return watchers;
})();