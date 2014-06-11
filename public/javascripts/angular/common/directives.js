/* Directives */
angular.module('socrataCommon.directives', []);

angular.module('socrataCommon.directives')
.directive('stickyLink', function(){
  return {
    restrict: 'C',
    link: function($scope, element){
      element.on('click', function(){
        $(element).toggleClass('active');
      })
    }
  }
})
.directive('toggleLink', function(){
  return {
    restrict: 'C',
    link: function($scope, element){
      element.on('click', function(){
        $('.toggle-link').removeClass('active');
        $(element).addClass('active');
      })
    }
  }
});