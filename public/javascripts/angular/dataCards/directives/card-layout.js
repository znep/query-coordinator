(function() {

  'use strict';

  function cardLayout(Constants, AngularRxExtensions, WindowState, SortedTileLayout) {
    return {
      restrict: 'E',
      scope: {
        page: '=',
        editMode: '=',
        globalWhereClauseFragment: '=',
        cardModels: '='
      },
      templateUrl: '/angular_templates/dataCards/card-layout.html',
      link: function($scope, cardContainer, attrs) {
        AngularRxExtensions.install($scope);

        /***********************
        * Cache some selectors *
        ***********************/

        var jqueryWindow = $(window);
        var jqueryDocument = $(document);
        var pageDescription = $('.page-description');
        var quickFilterBar = $('.quick-filter-bar');
        var cardsMetadata = $('.cards-metadata');
        var cardsMetadataOffsetTop = cardsMetadata.offset().top;

        if (cardContainer[0].id !== 'card-container') {
          throw new Error('The cardLayout directive must be given an DOM id attribute of "card-container".');
        }

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


        /**************
        * Card layout *
        **************/
        Rx.Observable.subscribeLatest(
          rowsOfCardsBySize,
          expandedCards,
          $scope.observe('editMode'),
          WindowState.windowSizeSubject,
          WindowState.scrollPositionSubject,
          pageDescription.observeDimensions().throttle(100),
          function layoutFn(sortedTileLayoutResult, expandedCards, editMode, windowSize, scrollTop, pageDescriptionDimensions) {

            // Figure out if there is an expanded card.
            if (!_.isEmpty(expandedCards)) {
              var expandedCard = expandedCards[0];
            } else {
              var expandedCard = null;
            }

            // Figure out the sticky-ness of the QFB and apply the style appropriately
            var headerStuck = scrollTop >= (cardsMetadataOffsetTop + cardsMetadata.outerHeight());

            var containerDimensions = { width: cardContainer.width(), height: cardContainer.height() };
            var cardPositions = [];

            // Branch here based on whether or not there is an expanded card.
            if (expandedCard !== null) {

              var deriveCardHeight = function(size) {
                switch (parseInt(size, 10)) {
                  case 1:
                    return 250;
                  case 2:
                    return 200;
                  case 3:
                    return 150;
                  default:
                    throw new Error('Unsupported card size: ' + size);
                }
              };

              var containerWidth = containerDimensions.width;
              var containerContentWidth = containerWidth - Constants.get('LAYOUT_GUTTER') * 2;

              var expandedColumnWidth = Math.floor(containerContentWidth * 0.65) - Constants.get('LAYOUT_HORIZONTAL_PADDING');
              var unexpandedColumnWidth = containerContentWidth - expandedColumnWidth - Constants.get('LAYOUT_HORIZONTAL_PADDING');

              var expandedColumnLeft = unexpandedColumnWidth + Constants.get('LAYOUT_GUTTER') + Constants.get('LAYOUT_HORIZONTAL_PADDING');
              var unexpandedColumnLeft = Constants.get('LAYOUT_GUTTER');

              var expandedColumnTop = 0;

              var cards = _.flatten(_.values(sortedTileLayoutResult));

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
                  heightOfAllCards += cardHeight + Constants.get('LAYOUT_VERTICAL_PADDING');

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

              if (headerStuck) {
                var expandedColumnHeight = windowSize.height - quickFilterBar.height() - Constants.get('LAYOUT_VERTICAL_PADDING');
              } else {
                var expandedColumnHeight = windowSize.height - cardContainer.offset().top - scrollTop - Constants.get('LAYOUT_VERTICAL_PADDING');
              }

              styleText += 'position:fixed;'
                         + 'left:' + expandedColumnLeft + 'px;'
                         + 'bottom:' + Constants.get('LAYOUT_VERTICAL_PADDING') + 'px;'
                         + 'width:' + expandedColumnWidth + 'px;'
                         + 'height:' + expandedColumnHeight + 'px;'
                         + '}';

            } else {

              var deriveCardHeight = function(size) {
                switch (parseInt(size, 10)) {
                  case 1:
                    return 300;
                  case 2:
                    return 250;
                  case 3:
                    return 200;
                  default:
                    throw new Error('Unsupported card size: ' + size);
                }
              };

              var firstRow = true;

              // Track whether or not to draw placeholder drop targets
              // for each card grouping.
              var placeholderDropTargets = [];

              // Terminology:
              // Content size (width, height) refers to a size with padding/LAYOUT_GUTTER removed.
              // Otherwise, sizes include padding/LAYOUT_GUTTER.
              // For instance, containerWidth is the full width of the container,
              // but containerContentWidth is contentWidth minus the LAYOUT_GUTTER.

              var containerWidth = containerDimensions.width;
              var containerContentWidth = containerWidth - Constants.get('LAYOUT_GUTTER') * 2;

              var heightOfAllCards = 0;

              // If we're in edit mode, we have to make sure that every category is
              // represented even if it 
              if (editMode) {
                if (!sortedTileLayoutResult.hasOwnProperty('1')) {
                  sortedTileLayoutResult['1'] = [];
                }
                if (!sortedTileLayoutResult.hasOwnProperty('2')) {
                  sortedTileLayoutResult['2'] = [];
                }
                if (!sortedTileLayoutResult.hasOwnProperty('3')) {
                  sortedTileLayoutResult['3'] = [];
                }

              }

              var currentCardGroup = 0;

              var styleText = _.reduce(sortedTileLayoutResult, function(overallStyleAcc, rows, cardSize) {

                currentCardGroup += 1;

                var rowCount = 0;
                var currentRowHeight = deriveCardHeight(parseInt(cardSize), 10);
                var currentRowContentHeight = currentRowHeight - Constants.get('LAYOUT_VERTICAL_PADDING');

                var styleForRow = _.reduce(rows, function(styleForRowAcc, row, rowIndex) {

                  var paddingForEntireRow = Constants.get('LAYOUT_HORIZONTAL_PADDING') * (row.length - 1);
                  var usableContentSpaceForRow = containerContentWidth - paddingForEntireRow;
                  var cardWidth = Math.floor(usableContentSpaceForRow / row.length);

                  rowCount += 1;

                  return styleForRowAcc + _.map(row, function(card, cardIndexInRow) {

                    var spaceTakenByOtherCardsPadding = Math.max(0, cardIndexInRow * Constants.get('LAYOUT_HORIZONTAL_PADDING'));
                    var cardLeft = Constants.get('LAYOUT_GUTTER') + (cardIndexInRow * cardWidth) + spaceTakenByOtherCardsPadding;

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

                // Add gap between card groups in edit mode only
                if (editMode) {

                  // Also accommodate for empty groups and display a placeholder drop target.
                  var groupEmpty = sortedTileLayoutResult[currentCardGroup].length === 0;

                  placeholderDropTargets.push({
                    id: currentCardGroup,
                    show: groupEmpty,
                    top: heightOfAllCards
                  });

                  if (groupEmpty) {
                    heightOfAllCards += Constants.get('LAYOUT_PLACEHOLDER_DROP_TARGET_HEIGHT') + Constants.get('LAYOUT_EDIT_MODE_GROUP_PADDING');
                  } else {
                    heightOfAllCards += rows.length * currentRowHeight + rowCount + Constants.get('LAYOUT_EDIT_MODE_GROUP_PADDING');
                  }

                } else {
                  heightOfAllCards += rows.length * currentRowHeight;
                }

                return overallStyleAcc + styleForRow;

              }, '');

            }

            styleText += '#card-container{'
                       + 'visibility:visible !important;'
                       + 'height:' + heightOfAllCards + 'px;'
                       + '}';

            if (editMode) {

              placeholderDropTargets.forEach(function(groupData) {
                styleText += '#card-group-' + groupData.id + '-drop-placeholder{';
                if (groupData.show) {
                  styleText += 'display:block;';
                } else {
                  styleText += 'display:none;';
                }
                styleText += 'width:' + containerContentWidth + 'px;'
                           + 'left:' + Constants.get('LAYOUT_GUTTER') + 'px;'
                           + 'top:' + groupData.top + 'px;'
                           + '}';
              });

            }

            // OMG side-effect, but *what* a side effect, amirite?
            $scope.cardPositions = cardPositions;

            $('#card-layout').text(styleText);

            if (headerStuck) {
              $('.quick-filter-bar').addClass('stuck');
            } else {
              $('.quick-filter-bar').removeClass('stuck');
            }



          });


        /******************************
        * Drag and drop functionality *
        ******************************/
        $scope.grabbedCard = null;

        var lastClientX = 0;
        var lastClientY = 0;
        var distanceSinceDragStart = 0;
        var mouseIsDown = false;

        var grabbedElement = null;
        var cursorToCardOriginXRatio = 0;
        var cursorToCardOriginYRatio = 0;
        var cardOriginX = 0;
        var cardOriginY = 0;

        // Given a point, the drop target is the card whose Y axis placement overlaps with the mouse Y position,
        // and whose top-left corner is closest to the mouse position.
        // Put another way, it's the closest card to the mouse in the row the mouse is in.
        function findDropTarget(cardOriginX, cardOriginY, clientY) {

          var containerOffset = cardContainer.offset();
          var containerXOffset = containerOffset.left - jqueryWindow.scrollLeft();
          var containerYOffset = containerOffset.top - jqueryWindow.scrollTop();
          var cursorX = cardOriginX - containerXOffset;
          var cursorY = cardOriginY - containerYOffset;
          var clientY = clientY - containerYOffset;

          var cardsInMyRow = _.where($scope.cardPositions, function(cardPositionData) {
            return cardPositionData.top <= clientY && (cardPositionData.top + cardPositionData.height) >= clientY;
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

        cardContainer.on('mousedown', '.card-drag-overlay', function(e) {

          if ($scope.editMode) {

            if (e.button === 0) {
              mouseIsDown = true;
              lastClientX = e.clientX;
              lastClientY = e.clientY;
              distanceSinceDragStart = 0;
            }

            var boundingClientRect = e.target.getBoundingClientRect();
            cursorToCardOriginXRatio = (e.clientX - boundingClientRect.left) / boundingClientRect.width;
            cursorToCardOriginYRatio = (e.clientY - boundingClientRect.top) / boundingClientRect.height;

            // Prevent accidental selection of text while in edit mode.
            e.preventDefault();

          }

        });

        // This is on the body rather than the individual cards so that dragging
        // the cursor off of a card and then letting go will correctly transition
        // the dragging state to false.
        WindowState.mouseLeftButtonPressedSubject.subscribe(function(leftPressed) {
          if (!leftPressed) {
            mouseIsDown = false;
            lastClientX = 0;
            lastClientY = 0;
            distanceSinceDragStart = 0;
            $scope.safeApply(function() {
              $scope.grabbedCard = null;
            });
          }
        });

        WindowState.mousePositionSubject.subscribe(function(position) {
          if (mouseIsDown && $scope.grabbedCard === null) {

            distanceSinceDragStart +=
              Math.floor(Math.sqrt(
                Math.pow(position.clientX - lastClientX, 2) +
                Math.pow(position.clientY - lastClientY, 2)));

            lastClientX = position.clientX;
            lastClientY = position.clientY;

            // If we're out of the dead zone, start the drag operation.
            if (distanceSinceDragStart > 3) {

              $scope.safeApply(function() {

                var scopeOfCard = $(position.target).scope();
                $scope.grabbedCard = scopeOfCard.cardModel;

              });
            }

          }

          if ($scope.grabbedCard !== null && typeof $scope.grabbedCard !== 'undefined') {

            // Card is being dragged.

            var newWidth = $('#card-tile-' + $scope.grabbedCard.uniqueId).width();
            var newHeight = $('#card-tile-' + $scope.grabbedCard.uniqueId).height();

            cardOriginX = position.clientX - newWidth * cursorToCardOriginXRatio;
            cardOriginY = position.clientY - newHeight * cursorToCardOriginYRatio;


            var targetModel = findDropTarget(cardOriginX, cardOriginY, position.clientY);

            if (targetModel !== null && targetModel !== $scope.grabbedCard) {

              var currentCards = $scope.page.getCurrentValue('cards');

              var targetModelIndex = _.indexOf(currentCards, targetModel);

              // Drop the dropped card in front of the card dropped onto.
              var newCards = _.without(currentCards, $scope.grabbedCard);

              if ($scope.grabbedCard.getCurrentValue('cardSize') !== targetModel.getCurrentValue('cardSize')) {

                $scope.grabbedCard.set('cardSize', targetModel.getCurrentValue('cardSize'));

              }

              newCards.splice(targetModelIndex, 0, $scope.grabbedCard);

              $scope.safeApply(function() {
                $scope.page.set('cards', newCards);
              });

            } else {

              var cardSize = null;

              $('.card-group-drop-placeholder').each(function(index, item) {
                var boundingRect = item.getBoundingClientRect();
                if (cardOriginX >= boundingRect.left &&
                    cardOriginX <= boundingRect.left + boundingRect.width &&
                    position.clientY >= boundingRect.top &&
                    position.clientY <= boundingRect.top + boundingRect.height) {
                  cardSize = item.getAttribute('data-group-id');
                }
              });

              if (cardSize !== null) {
                $scope.safeApply(function() {
                  $scope.grabbedCard.set('cardSize', cardSize);
                });
              }

            }

            $('#dragged-card-layout').text(".dragged { left: {0}px !important; top: {1}px !important;}".format(cardOriginX, cardOriginY));

            requestAnimationFrame(checkForScroll);

          }

        });


        var lastFrameTime = Date.now();

        function checkForScroll() {

          var now = Date.now();

          var deltaTime = now - lastFrameTime;

          var deltaTop = WindowState.mouseClientY;
          var distanceToScrollTop = $(window).scrollTop();

          var deltaBottom = jqueryWindow.height() - WindowState.mouseClientY;
          var distanceToScrollBottom = jqueryDocument.height() - jqueryWindow.scrollTop();

          if (deltaTop <= 75 && distanceToScrollTop > 0) {
            var newYOffset = jqueryWindow.scrollTop()
                           - Math.min(
                               Math.max(5, Math.pow(75 - deltaTop, 3) / 168.75) * (deltaTime / 1000),
                               distanceToScrollTop);


            jqueryWindow.scrollTop(newYOffset);

          } else if (deltaBottom <= 75 && distanceToScrollBottom > 0) {

            // Never allow the window to scroll past the bottom.
            var newYOffset = jqueryWindow.scrollTop()
                           + Math.min(
                               Math.max(5, Math.pow(75 - deltaBottom, 3) / 168.75) * (deltaTime / 1000),
                               distanceToScrollBottom);

            jqueryWindow.scrollTop(newYOffset);

          }

          if ($scope.grabbedCard !== null) {
            lastFrameTime = now;
            requestAnimationFrame(checkForScroll);
          }

        };


        /******************
        * Bind observable *
        ******************/

        $scope.bindObservable('cardModels', $scope.page.observe('cards'));

      }
    }
  }

  angular.
    module('dataCards.directives').
      directive('cardLayout', ['Constants', 'AngularRxExtensions', 'WindowState', 'SortedTileLayout', cardLayout]);

})();

