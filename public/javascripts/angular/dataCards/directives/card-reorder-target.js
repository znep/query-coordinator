(function() {

  'use strict';

  // Directive in charge of orchestrating card reorder.
  // TODO dev note to Chris: Totally a placeholder thing. This is probably not what we want.
  // I added this because CardsViewController (rightfully) doesn't have access to the DOM nodes. We should
  // consider moving all of the card render/layout functionality into here (and rename the directive).
  // This would allow us to get rid of the global ID selectors in CardsViewController as well.
  // We'll chat tomorrow.
  angular.module('dataCards.directives').directive('cardReorderTarget', function(UIController, SortedTileLayout) {
    return {
      restrict: 'A',
      link: function($scope, element, attrs) {

        /***********************
        * Cache some selectors *
        ***********************/

        var jqueryWindow = $(window);
        var cardContainer = $('#card-container');
        var cardsMetadata = $('.cards-metadata');
        var cardsMetadataOffsetTop = cardsMetadata.offset().top;

        /***********************
        * Set up data pipeline *
        ***********************/

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

        var expandedCards = zipLatestArray($scope.page.observe('cards'), 'expanded').map(function(cards) {
          return _.pluck(
              _.where(cards, _.property('expanded')),
              'model');
        });


        var dataModelObservableSequence = Rx.Observable.combineLatest(rowsOfCardsBySize, expandedCards, function(a, b) {
          return [a, b];
        });


        /***********************
        * Set up UI Controller *
        ***********************/

        var controller = UIController.initialize(layoutFn, dataModelObservableSequence);

        // Link the 'editMode' state to the UI controller
        $scope.$watch('editMode', function(editMode) {
          controller.setEditMode(editMode);
          //updateMetadataCardOrder($scope.page.cards);
        });

        // Link the 'expandedMode' state to the UI controller
        expandedCards.subscribe(function(expandedCards) {
          controller.setExpandedMode(expandedCards.length > 0);
        });


        /**************
        * Card layout *
        **************/

        function layoutFn(sortedTileLayoutResult, expandedCards, scrollTop) {


          // Figure out the sticky-ness of the QFB and apply the style appropriately
          var headerStuck = scrollTop >= (cardsMetadataOffsetTop + cardsMetadata.outerHeight());

          var containerDimensions = { width: cardContainer.width(), height: cardContainer.height() };

          var horizontalPadding = 5;
          var verticalPadding = 5;
          var gutter = 12;

          var cardPositions = [];

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

            var containerWidth = containerDimensions.width;
            var containerContentWidth = containerWidth - gutter * 2;

            var expandedColumnWidth = Math.floor(containerContentWidth * 0.65) - horizontalPadding;
            var unexpandedColumnWidth = containerContentWidth - expandedColumnWidth - horizontalPadding;

            var expandedColumnLeft = unexpandedColumnWidth + gutter + horizontalPadding;
            var unexpandedColumnLeft = gutter;

            var expandedColumnTop = 0;

            var cards = _.flatten(_.values(sortedTileLayoutResult));

            var expandedCard = expandedCards[0];

            var unexpandedCards = cards.filter(function(card) {
                // Note that the 'card' supplied by the iterator is a wrapper around
                // the card model, which is what 'expandedCard' is.
                return card.model.uniqueId !== expandedCard.uniqueId;
              });

            var heightOfAllCards = 0;

            styleText = _.reduce(unexpandedCards, function(accumulatedStyle, card, index) {
                var cardLeft = unexpandedColumnLeft;
                var cardTop = heightOfAllCards;
                var cardWidth = unexpandedColumnWidth;
                var cardHeight = deriveCardHeight(card.cardSize);

                // Keep track of the accumulated height of all cards so that we
                // know the top offset of the next card up for layout.
                heightOfAllCards += cardHeight + verticalPadding;

                return accumulatedStyle + '#card-tile-' + card.model.uniqueId
                                        + '{'
                                        + 'left:' + cardLeft + 'px;'
                                        + 'top:' + cardTop + 'px;'
                                        + 'width:' + cardWidth + 'px;'
                                        + 'height:' + cardHeight + 'px;'
                                        + '}';
            }, '');

            styleText += '#card-tile-' + expandedCard.uniqueId
                       + '{';




            var windowHeight = $(window).height();

            if (headerStuck) {
              var expandedColumnHeight = windowHeight - $('.quick-filter-bar').height() - verticalPadding;
            } else {
              console.log(windowHeight, cardContainer.offset().top, scrollTop, verticalPadding);
              var expandedColumnHeight = windowHeight - (cardContainer.offset().top - scrollTop) - verticalPadding;
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

                  var spaceTakenByOtherCardsPadding = Math.max(0, cardIndexInRow * horizontalPadding);
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

                  return '#card-tile-' + card.model.uniqueId + ', #card-tile-' + card.model.uniqueId + ' .dragged'
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

          if (headerStuck) {
            $('.quick-filter-bar').addClass('stuck');
          } else {
            $('.quick-filter-bar').removeClass('stuck');
          }

        };


        /******************************
        * Drag and drop functionality *
        ******************************/
        $scope.grabbedCard = null;

        var lastClientX = 0;
        var lastClientY = 0;
        var distanceSinceDragStart = 0;
        var mouseIsDown = false;

        var cursorToCardOriginXOffset = 0;
        var cursorToCardOriginYOffset = 0;

        // Given a point, the drop target is the card whose Y axis placement overlaps with the mouse Y position,
        // and whose top-left corner is closest to the mouse position.
        // Put another way, it's the closest card to the mouse in the row the mouse is in.
        function findDropTarget(clientX, clientY) {

          var containerOffset = cardContainer.offset();
          var containerXOffset = containerOffset.left - jqueryWindow.scrollLeft();
          var containerYOffset = containerOffset.top - jqueryWindow.scrollTop();
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


        element.on('mousedown', '.card-drag-overlay', function(e) {
          if ($scope.editMode) {

            if (e.button === 0) {
              mouseIsDown = true;
              lastClientX = e.clientX;
              lastClientY = e.clientY;
              distanceSinceDragStart = 0;
            }

            // Prevent accidental selection of text while in edit mode.
            e.preventDefault();

          }
        });

        // This is on the body rather than the individual cards so that dragging
        // the cursor off of a card and then letting go will correctly transition
        // the dragging state to false.
        $('body').on('mouseup', function(e) {
          mouseIsDown = false;
          lastClientX = 0;
          lastClientY = 0;
          distanceSinceDragStart = 0;
          $scope.$apply(function() {
            $scope.grabbedCard = null;
          });
        });

        element.on('mousemove', function(e) {

          if (mouseIsDown && $scope.grabbedCard === null) {

            distanceSinceDragStart +=
              Math.floor(Math.sqrt(
                Math.pow(e.clientX - lastClientX, 2) +
                Math.pow(e.clientY - lastClientY, 2)));

            lastClientX = e.clientX;
            lastClientY = e.clientY;

            // If we're out of the dead zone, start the drag operation.
            if (distanceSinceDragStart > 3) {
              $scope.$apply(function() {

                //TODO this is sorely needing some state transition goodness
                var scopeOfCard = $(e.target).scope();
                $scope.grabbedCard = scopeOfCard.cardModel;

                var grabbedCardBoundingClientRect = e.target.getBoundingClientRect();
                cursorToCardOriginXOffset = e.clientX - grabbedCardBoundingClientRect.left;
                cursorToCardOriginYOffset = e.clientY - grabbedCardBoundingClientRect.top;

              });
            }

          }

          if ($scope.grabbedCard !== null) {

            // Card is being dragged.

            var cardX = e.clientX - cursorToCardOriginXOffset;
            var cardY = e.clientY - cursorToCardOriginYOffset;

            $('#dragged-card-layout').text(".dragged { left: {0}px !important; top: {1}px !important;}".format(cardX, cardY));


            var targetModel = findDropTarget(e.clientX, e.clientY);

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


            requestAnimationFrame(checkForScroll);

          }

        });


        function checkForScroll() {


          var deltaTop = controller.pointerY;
          var distanceToScrollTop = $(window).scrollTop();

          var deltaBottom = jqueryWindow.height() - controller.pointerY;
          var distanceToScrollBottom = $(document).height() - jqueryWindow.scrollTop();

          if (deltaTop <= 75 && distanceToScrollTop > 0) {
            var newYOffset = jqueryWindow.scrollTop()
                           - Math.min(
                               Math.min(5, Math.pow(75 - deltaTop, 3) / 168.75),
                               distanceToScrollTop);

            jqueryWindow.scrollTop(newYOffset);

          } else if (deltaBottom <= 75 && distanceToScrollBottom > 0) {

            // Never allow the window to scroll past the bottom.
            var newYOffset = jqueryWindow.scrollTop()
                           + Math.min(
                               Math.min(5, Math.pow(75 - deltaBottom, 3) / 168.75),
                               distanceToScrollBottom);

            jqueryWindow.scrollTop(newYOffset);

          }

          if ($scope.grabbedCard !== null) {
            requestAnimationFrame(checkForScroll);
          }

        };


        /******************
        * Bind observable *
        ******************/

        $scope.bindObservable('cardModels', $scope.page.observe('cards'));


        /***********
        * Clean up *
        ***********/

        $scope.$on('$destroy', function() {
          $('body').off('mouseup');
        });


      }       // link() { ... }
    }         // return { ... }
  });         // angular.module().directive() { ... }

})();

