(function() {
  'use strict';

  function ScrollbarService() {
    var scrollbarWidth;

    /**
    * Get scroll bar width for the current browser in use.
    */
    function getScrollbarWidth () {
      if (_.isDefined(scrollbarWidth)) {
        return scrollbarWidth;
      }
      var div = document.createElement('div');
      div.innerHTML = '<div style= "width:50px; height:50px; position:absolute; left:-50px; top:-50px; overflow:auto;"><div style="width:1px;height:100px;"></div></div>';
      div = div.firstChild;
      document.body.appendChild(div);
      var width = getElementScrollbarWidth(div);
      document.body.removeChild(div);
      scrollbarWidth = width;
      return width;
    }

    /**
    * Get given element's current scrollbar width (0 if no scrollbar present).
    */
    function getElementScrollbarWidth(element) {
      return element.offsetWidth - element.clientWidth;
    }

    return {
      getScrollbarWidth: getScrollbarWidth,
      getElementScrollbarWidth: getElementScrollbarWidth
    };
  }

  angular.
    module('dataCards.services').
      factory('ScrollbarService', ScrollbarService);
})();
