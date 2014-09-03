angular.module('dataCards.directives').directive('stickyHeader', function(AngularRxExtensions) {
  'use strict';

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

      var $content = element.find('.content');
      function resizeHeaderContainer() {
        $scope.headerStyle = {
          height: $content.outerHeight() + 'px'
        };
      }

      // Watch for resize, and remove the "position: relative" tag resize sets.
      $content.resize(resizeHeaderContainer).
        css({ position: '' });
      resizeHeaderContainer();

      function pollLayout() {
        // Clamp scroll to stop odd sizes with OSX out of body scrolling.

        // This calculation added because it's ridiculously faster than jQuery's implementation
        // (4,748,016 ops/second v.s. 243,521 ops/second on my machine at the moment).
        // Note that this is performance-critical code.
        var scrollTop = (window.pageYOffset !== undefined) ?
          window.pageYOffset :
          (document.documentElement || document.body.parentNode || document.body).scrollTop;

        var windowScrollTop = Math.max(scrollTop, 0);
        var headerPositionTop = element.offset().top;
        var headerHeight = element.height();

        var availableContentHeight = headerHeight + Math.max(0, headerPositionTop - windowScrollTop);

        $scope.headerIsStuck = windowScrollTop >= headerPositionTop;

        $scope.$emit('stickyHeaderAvailableContentHeightChanged', availableContentHeight);

      };

      var resizeListenKey = attrs.updateOnResize;
      if (!_.isEmpty(resizeListenKey)) {
        $scope.$on(resizeListenKey, function() {
          pollLayout();
        });
      }

      addWindowBindings();
      pollLayout();
    }
  }
});
