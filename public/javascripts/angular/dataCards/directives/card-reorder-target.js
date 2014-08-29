(function() {

  'use strict';

  // Directive in charge of orchestrating card reorder.
  // TODO dev note to Chris: Totally a placeholder thing. This is probably not what we want.
  // I added this because CardsViewController (rightfully) doesn't have access to the DOM nodes. We should
  // consider moving all of the card render/layout functionality into here (and rename the directive).
  // This would allow us to get rid of the global ID selectors in CardsViewController as well.
  // We'll chat tomorrow.
  angular.module('dataCards.directives').directive('cardReorderTarget', function(SortedTileLayout) {
    return {
      restrict: 'A',
      link: function($scope, element, attrs) {

        /****************************************
        * Bind card data so we can render cards *
        ****************************************/

        $scope.bindObservable('cardModels', $scope.page.observe('cards'));


        /**************************
        * Card layout calculation *
        **************************/

        // Given a model property name P and an observable sequence of arrays of models having property P,
        // returns an observable sequence of arrays of objects pulling the last value yielded from P next
        // to the model. The elements in the yielded arrays look like:
        // {
        //  <P>: <the last value of P from the model>
        //  model: <the model that yielded the value>
        // }
        function zipLatestArray(obs, property) {
          return obs.flatMapLatest(
            function(values) {
              return Rx.Observable.combineLatest(_.map(values, function(val) {
                return val.observe(property);
              }), function() {
                return _.map(_.zip(values, arguments), function(arr) {
                  var r={ model: arr[0] };
                  r[property] = arr[1];
                  return r;
                });
              });
            }
          );
        };

        // A hash of:
        //  "card size" -> array of rows (which themselves are arrays).
        //
        // For instance:
        // {
        //  "1": [
        //         [ { cardSize: "1", model: <card model> } ]  // There's only one card of size 1, so it sits in its own row.
        //       ],
        //  "2": [
        //         [ { cardSize: "2", model: <card model> },   // There are 5 cards of size 2. Here, they are split up into a
        //           { cardSize: "2", model: <card model> } ], // pair of rows containing resp. 2 and 3 cards.
        //
        //         [ { cardSize: "2", model: <card model> },
        //           { cardSize: "2", model: <card model> },
        //           { cardSize: "2", model: <card model> } ]
        //       ]
        //  }
        var layout = new SortedTileLayout();
        var rowsOfCardsBySize = zipLatestArray($scope.page.observe('cards'), 'cardSize').
          map(function(sizedCards) {
            return layout.doLayout(sizedCards);
          });

        //$scope.cards = $scope.page.observe('cards')


        /**************
        * Card layout *
        **************/

        Rx.Observable.subscribeLatest(
          $('#card-container').observeDimensions(),
          rowsOfCardsBySize,
          Rx.Observable.returnValue(true),
          function (containerDimensions, sortedTileLayoutResult, expanded) {

            if (true) {

              var deriveCardHeight = function(size) {
                switch (size) {
                  case 1:
                    return 250;
                  case 2:
                    return 200;
                  case 3:
                    return 150;
                  default:
                    throw new Error('Unsupported card size.');
                }
              };

              var gutter = 12;

              var cards = _.flatten(_.values(sortedTileLayoutResult));

              var expandedCard = cards[0];

              var unexpandedCards = _.rest(cards);

              var heightOfAllCards = 0;

              var styleText = _.reduce(unexpandedCards, function(accumulatedStyle, card, index) {
                  var cardLeft = 0;
                  var cardTop = heightOfAllCards;
                  var cardWidth = 640;
                  var cardHeight = deriveCardHeight(card.cardSize);
                  heightOfAllCards += gutter + cardHeight;
                  console.log(heightOfAllCards);
                    return accumulatedStyle + '#card-' + card.model.uniqueId
                                            + '{'
                                            + 'left:' + cardLeft + 'px;'
                                            + 'top:' + cardTop + 'px;'
                                            + 'width:' + cardWidth + 'px;'
                                            + 'height:' + cardHeight + 'px;'
                                            + '}';
              }, '#card-1{left:656px;top:0px;height:1000px;width:900px;}');






              /*var cardPositions = [];

              var verticalPadding = 5;
              var horizontalPadding = 5;
              var gutter = 12;

              var firstRow = true;

              // Terminology:
              // Content size (width, height) refers to a size with padding/gutter removed.
              // Otherwise, sizes include padding/gutter.
              // For instance, containerWidth is the full width of the container,
              // but containerContentWidth is contentWidth minus the gutter.

              var containerWidth = containerDimensions.width;
              var containerContentWidth = containerWidth - gutter * 2;

              var heightOfAllCards = 0;

              //var styleText = _.reduce(sortedTileLayoutResult, function(overallStyleAcc, rows, cardSize) {

                var rowCount = 0;
                var currentRowHeight = deriveCardHeight(cardSize);
                var currentRowContentHeight = currentRowHeight - verticalPadding;

                //var styleForRow = _.reduce(rows, function(styleForRowAcc, row) {

                  var paddingForEntireRow = horizontalPadding * (row.length - 1);
                  var usableContentSpaceForRow = containerContentWidth - paddingForEntireRow;
                  var cardWidth = Math.floor(usableContentSpaceForRow / row.length);

                  rowCount += 1;

                  return styleForRowAcc + _.map(row, function(card, cardIndexInRow) {

                    var spaceTakenByOtherCardsPadding = (cardIndexInRow - 1) * horizontalPadding;
                    var cardLeft = gutter + (cardIndexInRow * cardWidth) + spaceTakenByOtherCardsPadding;
                    var cardTop = heightOfAllCards;

                    cardPositions.push([card.model.uniqueId, cardLeft, cardTop]);

                    return '#card-' + card.model.uniqueId
                                    + '{'
                                    + 'left:' + cardLeft + 'px;'
                                    + 'top:' + cardTop + 'px;'
                                    + 'width:' + cardWidth + 'px;'
                                    + 'height:' + currentRowContentHeight + 'px;'
                                    + '}';
                  }).join('');

                }, '');

                heightOfAllCards += rows.length * currentRowHeight + (rowCount * 100);

                return overallStyleAcc + styleForRow;

              }, '');*/


            } else {

              var deriveCardHeight = function(size) {
                switch (size) {
                  case 1:
                    return 300;
                  case 2:
                    return 250;
                  case 3:
                    return 200;
                  default:
                    throw new Error('Unsupported card size.');
                }
              };

              var cardPositions = [];

              var verticalPadding = 5;
              var horizontalPadding = 5;
              var gutter = 12;

              var firstRow = true;

              // Terminology:
              // Content size (width, height) refers to a size with padding/gutter removed.
              // Otherwise, sizes include padding/gutter.
              // For instance, containerWidth is the full width of the container,
              // but containerContentWidth is contentWidth minus the gutter.

              var containerWidth = containerDimensions.width;
              var containerContentWidth = containerWidth - gutter * 2;

              var heightOfAllCards = 0;

              var styleText = _.reduce(sortedTileLayoutResult, function(overallStyleAcc, rows, cardSize) {

                var rowCount = 0;
                var currentRowHeight = deriveCardHeight(parseInt(cardSize), 10);
                var currentRowContentHeight = currentRowHeight - verticalPadding;

                var styleForRow = _.reduce(rows, function(styleForRowAcc, row) {

                  var paddingForEntireRow = horizontalPadding * (row.length - 1);
                  var usableContentSpaceForRow = containerContentWidth - paddingForEntireRow;
                  var cardWidth = Math.floor(usableContentSpaceForRow / row.length);

                  rowCount += 1;

                  return styleForRowAcc + _.map(row, function(card, cardIndexInRow) {

                    var spaceTakenByOtherCardsPadding = (cardIndexInRow - 1) * horizontalPadding;
                    var cardLeft = gutter + (cardIndexInRow * cardWidth) + spaceTakenByOtherCardsPadding;
                    var cardTop = heightOfAllCards;

                    cardPositions.push([card.model.uniqueId, cardLeft, cardTop]);

                    return '#card-' + card.model.uniqueId
                                    + '{'
                                    + 'left:' + cardLeft + 'px;'
                                    + 'top:' + cardTop + 'px;'
                                    + 'width:' + cardWidth + 'px;'
                                    + 'height:' + currentRowContentHeight + 'px;'
                                    + '}';
                  }).join('');

                }, '');

                heightOfAllCards += rows.length * currentRowHeight + (rowCount * 100);

                return overallStyleAcc + styleForRow;

              }, '');

            }

            styleText += '#card-container{height:' + Math.floor(heightOfAllCards) + 'px;}';

            // OMG side-effect, but *what* a side effect, amirite?
            $scope.cardPositions = cardPositions;
            $('#card-layout').text(styleText);
            $scope.$broadcast('layout:redraw');

          });


        /******************************
        * Drag and drop functionality *
        ******************************/

        var draggedModel = null; //TODO probably remove.

        var dragTarget = element; //TODO what we want?

        function findDropTarget(clientX, clientY) {
          var $window = $(window);
          var offset = $('#card-container').offset();
          var containerXOffset = offset.left - $window.scrollLeft(); 
          var containerYOffset = offset.top - $window.scrollTop();
          var cursorX = clientX - containerXOffset;
          var cursorY = clientY - containerYOffset;

          var distances = $scope.cardPositions.map(function(cardPositionData) {
            var distance = Math.sqrt(Math.pow(cursorX - cardPositionData[1], 2) + Math.pow(cursorY - cardPositionData[2], 2));
            return [
              cardPositionData[0], // Card 'uniqueId'
              distance
            ];
          }).sort(function(a, b) {
            return a[1] > b[1];
          });

          var cardToReplace = $scope.cardModels.filter(function(cardModel) {
            return cardModel.uniqueId == distances[0][0];
          })[0];

          return cardToReplace;

        };

        dragTarget.on('dragover', function(e) {

          if (draggedModel) {

            var targetModel = findDropTarget(e.originalEvent.clientX, e.originalEvent.clientY);

            if (targetModel !== draggedModel) {

              var currentCards = $scope.page.getCurrentValue('cards');

              var targetModelIndex = _.indexOf(currentCards, targetModel);

              // Drop the dropped card in front of the card dropped onto.
              var newCards = _.without(currentCards, draggedModel);

              draggedModel.set('cardSize', targetModel.getCurrentValue('cardSize'));
              newCards.splice(targetModelIndex, 0, draggedModel);

              console.log('apply at ' + Date.now());

              $scope.$apply(function() {
                $scope.page.set('cards', newCards);
                $scope.$broadcast('layout:redraw');
              });

            }

          }

        });

        dragTarget.on('drop', function(e) {
          e.preventDefault();
          console.log(e.originalEvent.dataTransfer.getData('text/html'));
        });

        $scope.$on('card: dragStart', function(event, cardModel) {
          if (draggedModel !== null) {
            console.warn('dragStart scope event emitted, but already dragging?');
          }
          draggedModel = cardModel;
        });

        $scope.$on('card: dragEnd', function(event, cardModel) {
          if (cardModel !== draggedModel) {
            console.warn('dragEnd scope event from an unknown card');
          }
          draggedModel = null;
        });

      }
    }
  });

})();

