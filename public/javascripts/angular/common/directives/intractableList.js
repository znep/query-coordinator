angular.module('socrataCommon.directives').directive('intractableList', function ($document, AngularRxExtensions) {
  var DEFAULT_MAX_RESULTS = 10,
      VIEWPORT_BOTTOM_PADDING = 10,
      COUNT_MESSAGES_CONTAINER_HEIGHT = 20;
  return {
    restrict: 'E',
    templateUrl: '/angular_templates/common/intractableList.html',
    scope: {
      listData: '=',
      resultTipsyContent: '=',
      emptySelection: '=',
      search: '=',
      showCountMessage: '=?',
      showType: '=?',
      subTotalKey: '=?',
      listenToKeyboard: '=',
      hideEmptySelection: '=',
      totalAmount: '='
    },
    link: function (scope,element,attrs) {
      AngularRxExtensions.install(scope);
      var firstEntryIndex = 0;
      scope.pageNumber = 0;
      scope.maxResults = (attrs.maxResults || DEFAULT_MAX_RESULTS);
      scope.setActive = function (index) {
        if(!_.isUndefined(index)) {
          scope.activeEntryIndex = index;
        }
      };

      var listElem = element.find('.animated-list');

      // Select match say it to fancy Search.
      scope.selectMatch = function (index) {
        scope.$emit('intractableList:selectedItem', scope.listData[index + scope.pageNumber * scope.maxResults]);
      };

      scope.$watchCollection('[emptySelection, hideEmptySelection]', function (newVals) {
        var emptySelection = newVals[0], hideEmptySelection = newVals[1];
        if (_.isUndefined(emptySelection) || hideEmptySelection) {
          firstEntryIndex = 0;
          scope.activeEntryIndex = 0;
        } else {
          firstEntryIndex = -1;
          scope.activeEntryIndex = -1;
        }
      });

      scope.$on('intractableList:resetActiveIndex',function(){
        scope.activeEntryIndex = firstEntryIndex;
      });

      scope.$on('intractableList:selectCurrentItem',function(){
        scope.selectMatch(scope.activeEntryIndex);
      });

      //bind keyboard events: arrows up(38) / down(40), enter(13) and tab(9), esc(27)
      Rx.Observable.fromEvent($document, 'keydown').takeUntil(scope.observeDestroy(element)).
        subscribe(function(evt){
          scope.safeApply(function() {
            if (evt.which === 38){
              gotoPreviousItem();
            } else if (evt.which === 40){
              gotoNextItem();
            } else if (evt.which === 13 || evt.which === 9) {
              scope.selectMatch(scope.activeEntryIndex);
            }
          });
        }
      );

      var lastItemIndex = function(){
        var listItemCount = scope.maxResults;
        if((scope.pageNumber * scope.maxResults + scope.maxResults) > scope.listData.length){
          listItemCount =  scope.listData.length % scope.maxResults;
        }
        return Math.min(scope.listData.length, listItemCount) - 1;
      };
      var gotoNextItem = function(){
        var isLastItem = (scope.activeEntryIndex == lastItemIndex());
        if(!isLastItem){
          scope.setActive(scope.activeEntryIndex + 1);
        }else if(scope.canPage('next')){
          scope.changePage('next');
          scope.setActive(0);
        }
      };
      var gotoPreviousItem = function(){
        var isFirstItem = (scope.activeEntryIndex == firstEntryIndex);

        if(!isFirstItem){
          scope.setActive(scope.activeEntryIndex - 1);
        }else if(scope.canPage('previous')){
          scope.changePage('previous');
          scope.setActive(lastItemIndex());
        }
      };

      scope.$watch('listData',function(newVal){
         scope.pageNumber=0;
         setActiveIndex();
      });

      scope.$watch('pageNumber',function(newVal){
        scope.listStartIndex =  (newVal * scope.maxResults) + 1;
        scope.listEndIndex = scope.maxResults;
        setActiveIndex();
        if (scope.listData.length > 0) {
          if (((newVal + 1) * scope.maxResults) > scope.listData.length) {
            scope.listEndIndex = scope.listData.length;
          } else {
            scope.listEndIndex = (newVal + 1) * scope.maxResults;
          }
        }
      });

      var setActiveIndex = function(){
        if(scope.activeEntryIndex >= scope.listData.length % scope.maxResults && ((scope.pageNumber + 1) * scope.maxResults) > scope.listData.length) {
          scope.activeEntryIndex = Math.max(0, scope.listData.length % scope.maxResults - 1);
        }
      };

      scope.changePage = function (transition) {
        if (!scope.canPage(transition)) {
          return;
        }
        listElem.addClass('paging');
        if (transition === 'next') {
          scope.pageNumber += 1;
          listElem.addClass('next');
        } else if (transition === 'previous') {
          scope.pageNumber -= 1;
          listElem.addClass('previous');
        }
      };

      scope.canPage = function (direction) {
        var totalPages = Math.ceil(scope.listData.length / scope.maxResults) - 1;
        if (direction == 'next' && scope.pageNumber < totalPages) {
          return true;
        } else if (direction == 'previous' && scope.pageNumber > 0) {
          return true;
        }
        return false;
      };

      scope.$on('condenseListIfRequired', function(e){
        condenseListIfRequired();
      });

      var condenseListIfRequired = function(){
        var availableVPHeight = $document.height() - VIEWPORT_BOTTOM_PADDING;
        if(scope.showCountMessage){
          availableVPHeight = availableVPHeight - COUNT_MESSAGES_CONTAINER_HEIGHT;
        }
        var searchResultsContainer = element.find('.animated-list');
        var searchResultsContainerBottom = searchResultsContainer.height() + searchResultsContainer.offset().top;

        var nonEmptyResultItems = searchResultsContainer.find('.search-result');
        var emptyResultItems = element.find('.empty-selection');
        if(searchResultsContainerBottom > availableVPHeight){
          var searchResultItemHeight = nonEmptyResultItems.each(function(index, elem){
            var elemBottom = $(elem).offset().top + $(elem).height();
            if(elemBottom > availableVPHeight ){
              scope.maxResults = index - emptyResultItems.length; //-1 for the empty result items "any category".
              return false;
            }
          });
        }else{
          var searchResultHeight = nonEmptyResultItems.last().height();
          var extraSpaceCount = Math.floor((availableVPHeight - searchResultsContainerBottom)/searchResultHeight);
          scope.maxResults = Math.min(DEFAULT_MAX_RESULTS, scope.maxResults + extraSpaceCount);
        }
      }
    }
  }
});
