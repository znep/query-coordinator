angular.module('dataCards.directives').directive('stickyHeader', function(AngularRxExtensions) {
  return {
    restrict: 'A',
    link: function($scope, element, attrs) {
      function addWindowBindings() {
        $(window).resize(onResize);
        $(window).scroll(onScroll);
        element.on('$destroy', function() {
          removeWindowBindings();
        });
      };

      function removeWindowBindings() {
        $(window).off('resize', onResize);
        $(window).off('resize', onScroll);
      };

      function onResize() {
        $scope.$apply(function() {
          pollLayout();
        });
      };

      function onScroll() {
        $scope.$apply(function() {
          pollLayout();
        });
      };

      function pollLayout() {
        var windowScrollTop = $(document).scrollTop();
        var windowHeight = $(window).height();
        var headerPositionTop = element.offset().top;
        var headerHeight = element.height();

        $scope.headerIsStuck = windowScrollTop >= headerPositionTop;
        $scope.availableContentHeight = headerHeight + Math.max(0, headerPositionTop - windowScrollTop);
      };

      var resizeListenKey = attrs.updateOnResize;
      if (!_.isEmpty(resizeListenKey)) {
        $scope.$on('elementResized', function(event, argument) {
          if (argument === resizeListenKey) {
            pollLayout();
          }
        });
      }

      addWindowBindings();
      pollLayout();
    }
  }
});
