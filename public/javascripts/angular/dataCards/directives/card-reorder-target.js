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
        // to the model. Thus, if the input observable yields an array of models [A, B], the elements from
        // the returned sequence look like:
        // [
        //   {
        //     <P>: <the last value of P from model A>
        //     model: <model A>
        //   },
        //   {
        //     <P>: <the last value of P from model B>
        //     model: <model B>
        //   }
        //   ...
        // ]
        // A new array is yielded every time the list of models changes or any model gets a new value
        // for P.
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


        var availableContentHeightSubject = new Rx.Subject();
        availableContentHeightSubject.onNext($(window).height() - ($('#card-container').offset().top - $(window).scrollTop()));

        var availableContentHeightTimeout = null;

        $scope.$on('stickyHeaderAvailableContentHeightChanged', function(e) {
          //clearTimeout(availableContentHeightTimeout);
          //availableContentHeightTimeout = setTimeout(function() {
            availableContentHeightSubject.onNext(1);
          //}, 500);
        });

        /**************
        * Card layout *
        **************/

        var expandedCards = zipLatestArray($scope.page.observe('cards'), 'expanded').map(function(cards) {
          return _.pluck(
              _.where(cards, _.property('expanded')),
              'model');
        });

        Rx.Observable.subscribeLatest(
          $('#card-container').observeDimensions(),
          rowsOfCardsBySize,
          availableContentHeightSubject,
          $scope.observe('headerIsStuck'),
          expandedCards,
          function (containerDimensions, sortedTileLayoutResult, availableContentHeight, headerIsStuck, expandedCards) {

            var scrollTop = (window.pageYOffset !== undefined) ?
              window.pageYOffset :
              (document.documentElement || document.body.parentNode || document.body).scrollTop;

            if (!_.isEmpty(expandedCards)) {

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

              var horizontalPadding = 5;
              var verticalPadding = 5;
              var gutter = 12;

              var containerWidth = containerDimensions.width;
              var containerContentWidth = containerWidth - gutter * 2;

              var expandedColumnWidth = Math.floor(containerContentWidth * 0.65) - horizontalPadding;
              var unexpandedColumnWidth = containerContentWidth - expandedColumnWidth - horizontalPadding;

              var expandedColumnLeft = unexpandedColumnWidth + gutter + horizontalPadding;
              var unexpandedColumnLeft = gutter;

              var expandedColumnTop = 0;

              var cards = _.flatten(_.values(sortedTileLayoutResult));

              var expandedCard = cards[0];

              var unexpandedCards = _.rest(cards);

              var heightOfAllCards = 0;

              styleText = _.reduce(unexpandedCards, function(accumulatedStyle, card, index) {
                  var cardLeft = unexpandedColumnLeft;
                  var cardTop = heightOfAllCards;
                  var cardWidth = unexpandedColumnWidth;
                  var cardHeight = deriveCardHeight(card.cardSize);

                  // Keep track of the accumulated height of all cards so that we
                  // know the top offset of the next card up for layout.
                  heightOfAllCards += cardHeight + verticalPadding;

                  return accumulatedStyle + '#card-' + card.model.uniqueId
                                          + '{'
                                          + 'left:' + cardLeft + 'px;'
                                          + 'top:' + cardTop + 'px;'
                                          + 'width:' + cardWidth + 'px;'
                                          + 'height:' + cardHeight + 'px;'
                                          + '}';
              }, '');

              styleText += '#card-' + expandedCard.model.uniqueId
                         + '{';

              var windowHeight = $(window).height();

              if ($scope.headerIsStuck) {
              //  styleText += 'position:fixed;';
              //  expandedColumnTop = parseInt($scope.headerStyle['height'], 10);
                var expandedColumnHeight = windowHeight - parseInt($scope.headerStyle['height'], 10) - verticalPadding;
              } else {
                var expandedColumnHeight = windowHeight - ($('#card-container').offset().top - scrollTop) - verticalPadding;
              }

              styleText += 'position:fixed;'
                         + 'left:' + expandedColumnLeft + 'px;'
                         + 'bottom:' + verticalPadding + 'px;'
                         + 'width:' + expandedColumnWidth + 'px;'
                         + 'height:' + expandedColumnHeight + 'px;'
                         + '}';

              styleText += '#card-container{'
                         + 'visibility:visible !important;'
                         + 'height:' + heightOfAllCards + 'px;'
                         + '}';

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

              var verticalPadding = 6;
              var horizontalPadding = 6;
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

                var styleForRow = _.reduce(rows, function(styleForRowAcc, row, rowIndex) {

                  var paddingForEntireRow = horizontalPadding * (row.length - 1);
                  var usableContentSpaceForRow = containerContentWidth - paddingForEntireRow;
                  var cardWidth = Math.floor(usableContentSpaceForRow / row.length);

                  rowCount += 1;

                  return styleForRowAcc + _.map(row, function(card, cardIndexInRow) {

                    var spaceTakenByOtherCardsPadding = (cardIndexInRow - 1) * horizontalPadding;
                    var cardLeft = gutter + (cardIndexInRow * cardWidth) + spaceTakenByOtherCardsPadding;
                    var cardTop = heightOfAllCards + rowIndex * currentRowHeight;

                    cardPositions.push(
                      {
                        model: card.model,
                        top: cardTop,
                        left: cardLeft,
                        width: cardWidth,
                        height: currentRowContentHeight
                      });

                    return '#card-' + card.model.uniqueId + ', #card-' + card.model.uniqueId + ' .dragged'
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

            styleText += '#card-container{'
                       + 'visibility:visible !important;'
                       + 'height:' + heightOfAllCards + 'px;'
                       + '}';

            // OMG side-effect, but *what* a side effect, amirite?
            $scope.cardPositions = cardPositions;
            $('#card-layout').text(styleText);
          });


        /******************************
        * Drag and drop functionality *
        ******************************/

        //var draggedModel = null; //TODO probably remove.

        //var dragTarget = element; //TODO what we want?

        // Given a point, the drop target is the card whose Y axis placement overlaps with the mouse Y position,
        // and whose top-left corner is closest to the mouse position.
        // Put another way, it's the closest card to the mouse in the row the mouse is in.
        function findDropTarget(clientX, clientY) {
          var $window = $(window);
          var offset = $('#card-container').offset();
          var containerXOffset = offset.left - $window.scrollLeft(); 
          var containerYOffset = offset.top - $window.scrollTop();
          var cursorX = clientX - containerXOffset;
          var cursorY = clientY - containerYOffset;

          var cardsInMyRow = _.where($scope.cardPositions, function(cardPositionData) {
            return cardPositionData.top <= cursorY && (cardPositionData.top + cardPositionData.height) >= cursorY;
          });
          var closestCard = cardsInMyRow.reduce(function(currentClosest, cardPositionData) {
            var distance = Math.sqrt(Math.pow(cursorX - cardPositionData.left, 2) + Math.pow(cursorY - cardPositionData.top, 2));
            if (currentClosest.distance > distance) {
              return {
                model: cardPositionData.model,
                distance: distance
              };
            } else {
              return currentClosest;
            }
          }, {model: null, distance: Infinity});

          return closestCard.model;

        };


        /****************************************************
        * Manual (non Drag and Drop API-ized) drag and drop *
        ****************************************************/

        $scope.grabbedCard = null;

        //TODO - consider regular delegated browser event.
        //TODO drag threshold.
        element.on('mousedown', '.card-drag-overlay', function(e) {
          if ($scope.editMode && e.button === 0) {
            var scopeOfCard = $(this).scope();
            $scope.$apply(function() {
              $scope.grabbedCard = scopeOfCard.cardModel;
            });
          }
        });
        // This one is necessary to prevent the default HTML5 Drag and Drop behavior.
        // It has a similar effect to event.preventDefault() but allows other types
        // of events to pass through.
        element.on('dragstart', function() { return false; });
        // TODO Y?
        element.on('mousedown', function(e) {
          if ($scope.grabbedCard) {
            e.preventDefault();
          }
        });


        element.on('mousemove', function(e) {

          if ($scope.grabbedCard !== null) {

            // Card is being dragged.

            $('#dragged-card-layout').text(".dragged { left: {0}px !important; top: {1}px !important;}".format(e.clientX, e.clientY));

            var deltaTop = e.originalEvent.clientY;
            var distanceToScrollTop = $(window).scrollTop();

            var deltaBottom = $(window).height() - e.originalEvent.clientY;
            var distanceToScrollBottom = $(document).height() - $(window).scrollTop();

            if (deltaTop <= 75 && distanceToScrollTop > 0) {
              var newYOffset = $(window).scrollTop()
                             - Math.min(
                                 Math.min(5, Math.pow(75 - deltaTop, 3) / 168.75),
                                 distanceToScrollTop);

              $(window).scrollTop(newYOffset);

            } else if (deltaBottom <= 75 && distanceToScrollBottom > 0) {

              // Never allow the window to scroll past the bottom.
              var newYOffset = $(window).scrollTop()
                             + Math.min(
                                 Math.min(5, Math.pow(75 - deltaBottom, 3) / 168.75),
                                 distanceToScrollBottom);

              $(window).scrollTop(newYOffset);

            } else {

              var targetModel = findDropTarget(e.originalEvent.clientX, e.originalEvent.clientY);

              if (targetModel !== null && targetModel !== $scope.grabbedCard) {

                var currentCards = $scope.page.getCurrentValue('cards');

                var targetModelIndex = _.indexOf(currentCards, targetModel);

                // Drop the dropped card in front of the card dropped onto.
                var newCards = _.without(currentCards, $scope.grabbedCard);

                $scope.grabbedCard.set('cardSize', targetModel.getCurrentValue('cardSize'));
                newCards.splice(targetModelIndex, 0, $scope.grabbedCard);

                console.log('apply at ' + Date.now());

                $scope.$apply(function() {
                  $scope.page.set('cards', newCards);
                });

              }

            }

          }
        });

        // This is on the body rather than the individual cards so that dragging
        // the cursor off of a card and then letting go will correctly transition
        // the dragging state to false.
        $('body').on('mouseup', function(e) {
          //TODO detach
          $scope.$apply(function() {
            $scope.grabbedCard = null;
          });
        });

        // Clean up after non-angular event listeners.
        $scope.$on('$destroy', function() {
          $('body').off('mouseup');
        });

      }       // link() { ... }
    }         // return { ... }
  });         // angular.module().directive() { ... }

})();

