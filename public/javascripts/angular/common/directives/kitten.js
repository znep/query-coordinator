angular.module('socrataCommon.directives').directive('socKitten', function() {
  return {
    restrict: 'E',
    link: function(scope, element, attrs) {
      var w = attrs.w || 300;
      var h = attrs.h || 200;
      element.append('<img class="soc-kitten" src="http://placekitten.com/g/'+w+'/'+h+'"/>');
    }
  }
});
