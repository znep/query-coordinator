(function() {
  'use strict';

  function cardLayout(Constants, AngularRxExtensions, WindowState, SortedTileLayout, FlyoutService) {
    return {
      restrict: 'E',
      scope: {
        page: '=',
        cardExpanded: '=',
        editMode: '=',
        globalWhereClauseFragment: '=',
        cardModels: '=',
        allowAddCard: '='
      },
      templateUrl: '/angular_templates/dataCards/card-layout.html',
      link: function(scope, cardContainer, attrs) {
        AngularRxExtensions.install(scope);

        scope.grabbedCard = null;

        var jqueryWindow = $(window);
        var jqueryDocument = $(document);
        var pageDescription = $('.page-description');
        var quickFilterBar = $('.quick-filter-bar');
        var cardsMetadata = $('.cards-metadata');

        var mouseDownClientX = 0;
        var mouseDownClientY = 0;
        var distanceSinceDragStart = 0;
        var mouseIsDown = false;

        var grabbedElement = null;
        var cursorToCardOriginXRatio = 0;
        var cursorToCardOriginYRatio = 0;
        var cardOriginX = 0;
        var cardOriginY = 0;

        var lastFrameTime = Date.now();

        // NOTE Right now this directive has strict DOM structure requirements.
        // Ideally these wouldn't be required, but for the time being we'll
        // verify our requirements are met.
        if (_.isEmpty(cardsMetadata)) {
          throw new Error('The cardLayout directive must be in the DOM with a node with class "cards-metadata".');
        }
        if (_.isEmpty($('.quick-filter-bar'))) {
          throw new Error('The cardLayout directive must be in the DOM with a node with class "quick-filter-bar".');
        }

        //TODO This should never change at runtime. If it does, we need to react to that change.
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
              if (_.isEmpty(values)) {
                return Rx.Observable.returnValue([]);
              }
              return Rx.Observable.combineLatest(_.map(values, function(val) {
                return val.observe(property);
              }), function() {
                return _.map(_.zip(values, arguments), function(arr) {
                  var r = { model: arr[0] };
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
        var cardsBySize = zipLatestArray(scope.page.observe('cards'), 'cardSize').map(function(cards) {
          return _.groupBy(cards, function(card) {
            return card.model.fieldName === '*' ? 'dataCard' : 'normal';
          });
        });

        var expandedCards = zipLatestArray(scope.page.observe('cards'), 'expanded').map(function(cards) {
          return _.where(cards, _.property('expanded'));
        });

        // Keep track of whether the layout is an expanded-card layout, so upstream scopes
        // can do things like disable edit buttons
        expandedCards.subscribe(function(expandedCards) {
          scope.cardExpanded = !_.isEmpty(expandedCards);
        });

        /**************
        * Card layout *
        **************/
        Rx.Observable.subscribeLatest(
          cardsBySize,
          expandedCards,
          scope.observe('editMode'),
          scope.observe('allowAddCard'),
          cardsMetadata.observeDimensions(),
          WindowState.windowSizeSubject,
          WindowState.scrollPositionSubject,
          function layoutFn(cardsBySize, expandedCards, editMode, allowAddCard, cardsMetadataSize, windowSize, scrollTop) {

            if (_.isEmpty(cardsBySize.normal) || _.isEmpty(cardsBySize.dataCard)) {
              return;
            }

            // Figure out if there is an expanded card.
            var expandedCard = _.isEmpty(expandedCards) ? null : expandedCards[0];

            // Figure out the sticky-ness of the QFB and apply the style appropriately
            var headerStuck = scrollTop >= (cardsMetadataOffsetTop + cardsMetadata.outerHeight());

            var cardPositions = [];
            var heightOfAllCards = 0;

            // Terminology:
            //
            // Content size (width, height) refers to a size with padding/LAYOUT_GUTTER removed.
            // Otherwise, sizes include padding/LAYOUT_GUTTER.
            var containerContentWidth = cardContainer.width()
              - Constants['LAYOUT_GUTTER'] * 2;

            var deriveCardHeight = function(size) {
              size = parseInt(size, 10);
              if (expandedCard === null) {
                switch (size) {
                  case 1:
                    return 300;
                  case 2:
                    return 250;
                  case 3:
                    return 200;
                }
              } else {
                switch (size) {
                  case 1:
                    return 250;
                  case 2:
                    return 200;
                  case 3:
                    //TODO this should be 150, but for demo purposes we're bumping it up to work around some padding overflow
                    //issues.
                    return 200;
                }
              }

              throw new Error('Unsupported card size: ' + size);
            };

            // Track whether or not to draw placeholder drop targets
            // for each card grouping.
            var placeholderDropTargets = [];

            // Track each 'add card' button's position in the layout
            var addCardButtons = [];

            // Branch here based on whether or not there is an expanded card.
            if (expandedCard !== null) {
              var EXPANDED_COL_RATIO = 0.65;

              var unexpandedColumnWidth = Math.floor(
                (1 - EXPANDED_COL_RATIO) * containerContentWidth);
              var expandedColumnWidth = Math.floor(
                EXPANDED_COL_RATIO * containerContentWidth)
                - Constants['LAYOUT_HORIZONTAL_PADDING'];

              var expandedColumnLeft = unexpandedColumnWidth
                + Constants['LAYOUT_GUTTER'] + Constants['LAYOUT_HORIZONTAL_PADDING'];
              var unexpandedColumnLeft = Constants['LAYOUT_GUTTER'];

              var expandedColumnTop = 0;

              var unexpandedCards = cardsBySize.normal.filter(function(card) {
                // Note that the 'card' supplied by the iterator is a wrapper around
                // the card model, which is what 'expandedCard' is.
                if (card.model.uniqueId === expandedCard.model.uniqueId) {
                  // Keep a handle on the object within cardsBySize, so we can set the
                  // style on that object, and process all the cardsBySize at once.
                  expandedCard = card;
                  return false;
                } else {
                  return true;
                }
              });

              // Set the styles for the left-column cards
              _.map(unexpandedCards, function(card, index) {

                  var cardLeft = unexpandedColumnLeft;
                  var cardTop = heightOfAllCards;
                  var cardWidth = unexpandedColumnWidth;
                  var cardHeight = deriveCardHeight(card.cardSize);

                  // Keep track of the accumulated height of all cards so that we
                  // know the top offset of the next card up for layout.
                  heightOfAllCards += cardHeight + Constants['LAYOUT_VERTICAL_PADDING'];

                  card.style = {
                    left: cardLeft,
                    top: cardTop,
                    width: cardWidth,
                    height: cardHeight,
                  };
              });

              // Enforce a minimum height
              if (heightOfAllCards === 0) {
                heightOfAllCards = Constants['LAYOUT_MIN_EXPANDED_CARD_HEIGHT'] + (Constants['LAYOUT_VERTICAL_PADDING'] * 2);
              }

              // Set the style for the expanded card.
              var expandedColumnHeight;
              if (headerStuck) {
                expandedColumnHeight = windowSize.height
                  - quickFilterBar.height()
                  - Constants['LAYOUT_VERTICAL_PADDING'];
              } else {
                expandedColumnHeight = windowSize.height
                  - (cardContainer.offset().top - scrollTop)
                  - Constants['LAYOUT_VERTICAL_PADDING'];
              }
              var footerOffset = expandedCard.model.fieldName === '*' ?
                  0 :
                  Math.max(0, (scrollTop + windowSize.height) - (
                    cardContainer.offset().top + heightOfAllCards));

              expandedCard.style = {
                position: 'fixed',
                left: expandedColumnLeft,
                bottom: Constants.LAYOUT_VERTICAL_PADDING + footerOffset,
                width: expandedColumnWidth,
                height: expandedColumnHeight - footerOffset,
              };


              // If the datacard isn't expanded, then add it to the bottom
              if (expandedCard.model.fieldName !== '*') {
                cardsBySize.dataCard[0].style = {
                  left: Constants['LAYOUT_GUTTER'],
                  top: heightOfAllCards,
                  width: containerContentWidth,
                  height: Constants['LAYOUT_DATA_CARD_HEIGHT']
                };
              }

              // END EXPANDED CARD
            } else {

              var heightOfAllCards = 0;

              // Lay out the cards into rows
              var editableCards = layout.doLayout(cardsBySize.normal);

              if (editMode) {

                if (!editableCards.hasOwnProperty('1')) {
                  editableCards['1'] = [];
                }
                if (!editableCards.hasOwnProperty('2')) {
                  editableCards['2'] = [];
                }
                if (!editableCards.hasOwnProperty('3')) {
                  editableCards['3'] = [];
                }

              }

              // Position the rows of cards
              _.map(editableCards, function(rows, cardSize) {
                var currentRowHeight = deriveCardHeight(cardSize);
                var currentRowContentHeight = currentRowHeight
                  - Constants['LAYOUT_VERTICAL_PADDING'];

                _.map(rows, function(row, rowIndex) {

                  var paddingForEntireRow = Constants['LAYOUT_HORIZONTAL_PADDING']
                    * (row.length - 1);
                  var usableContentSpaceForRow = containerContentWidth
                    - paddingForEntireRow;
                  var cardWidth = Math.floor(usableContentSpaceForRow / row.length);

                  _.map(row, function(card, cardIndexInRow) {
                    var spaceTakenByOtherCardsPadding = Math.max(
                      0, cardIndexInRow * Constants['LAYOUT_HORIZONTAL_PADDING']);
                    var cardLeft = Constants['LAYOUT_GUTTER'] + (
                      cardIndexInRow * cardWidth) + spaceTakenByOtherCardsPadding;
                    var cardTop = heightOfAllCards + rowIndex * currentRowHeight;

                    cardPositions.push({
                      model: card.model,
                      top: cardTop,
                      left: cardLeft,
                      width: cardWidth,
                      height: currentRowContentHeight
                    });

                    card.style = {
                      left: cardLeft,
                      top: cardTop,
                      width: cardWidth,
                      height: currentRowContentHeight
                    };
                  });
                });

                // Add gap between card groups in edit mode only
                if (editMode) {

                  // Also accommodate for empty groups and display a placeholder drop target.
                  var groupEmpty = rows.length === 0;

                  placeholderDropTargets.push({
                    id: cardSize,
                    style: {
                      display: groupEmpty ? 'block' : 'none',
                      width: containerContentWidth,
                      left: Constants['LAYOUT_GUTTER'],
                      top: heightOfAllCards
                    }
                  });

                  if (groupEmpty) {
                    heightOfAllCards += Constants['LAYOUT_PLACEHOLDER_DROP_TARGET_HEIGHT'];
                  } else {
                    heightOfAllCards += rows.length * currentRowHeight;
                  }

                  heightOfAllCards += 10;

                  addCardButtons.push({
                    id: cardSize,
                    style: {
                      top: heightOfAllCards,
                      left: Constants['LAYOUT_GUTTER']
                    }
                  });

                  heightOfAllCards += Constants['LAYOUT_EDIT_MODE_GROUP_PADDING'];

                } else {
                  heightOfAllCards += rows.length * currentRowHeight;
                }
              });

              cardsBySize.dataCard[0].style = {
                left: Constants['LAYOUT_GUTTER'],
                top: heightOfAllCards,
                width: containerContentWidth,
                height: Constants['LAYOUT_DATA_CARD_HEIGHT']
              };

              heightOfAllCards += Constants['LAYOUT_DATA_CARD_HEIGHT']
                + Constants['LAYOUT_VERTICAL_PADDING'];

            }

            cardContainer.css({
              visibility: 'visible',
              height: heightOfAllCards
            });

            // OMG side-effect, but *what* a side effect, amirite?
            scope.cardPositions = cardPositions;

            function styleToString(style) {
              return _.map(style, function(v, k) {
                return k + ':' + (_.isNumber(v) ? v + 'px' : v);
              }).join(';')
            }
            $('#card-layout').text(
              [_.map(cardsBySize.normal.concat(cardsBySize.dataCard),
                     function(card) {
                       var styles = styleToString(card.style);
                       return '#card-tile-{0} { {1}; }'.format(
                         card.model.uniqueId, styles)
                         + '#card-tile-{0} .dragged { {1}; }'.format(
                           card.model.uniqueId, styles);
                     }).join(''),
               _.map(addCardButtons,
                     function(button) {
                       return '#add-card-button-group-{0} { {1}; }'.format(
                         button.id,
                         styleToString(button.style)
                       );
                     }).join(''),
              _.map(placeholderDropTargets,
                    function(placeholder) {
                       return '#card-group-{0}-drop-placeholder { {1}; }'.format(
                         placeholder.id,
                         styleToString(placeholder.style)
                       );
                    }).join('')
              ].join('')
            );

            quickFilterBar.toggleClass('stuck', headerStuck);

            console.log('rerender');
          });


        /******************************
        * Drag and drop functionality *
        ******************************/

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

          var cardsInMyRow = _.where(scope.cardPositions, function(cardPositionData) {
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

          if (scope.editMode) {

            if (e.button === 0) {
              mouseIsDown = true;
              mouseDownClientX = e.clientX;
              mouseDownClientY = e.clientY;
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
            mouseDownClientX = null;
            mouseDownClientY = null;
            scope.safeApply(function() {
              if (scope.grabbedCard) {
                // Reset the element to default
                scope.grabbedCard.jqEl.css({top: '', left: ''});
              }
              scope.grabbedCard = null;
            });
          }
        });

        WindowState.mousePositionSubject.subscribe(function(position) {
          if (mouseIsDown && scope.grabbedCard === null) {

            var distanceSinceDragStart =
              Math.floor(Math.sqrt(
                Math.pow(position.clientX - mouseDownClientX, 2) +
                Math.pow(position.clientY - mouseDownClientY, 2)));

            // If we're out of the dead zone, start the drag operation.
            if (distanceSinceDragStart > 3) {

              scope.safeApply(function() {

                var jqEl = $(position.target);
                scope.grabbedCard = {
                  model: jqEl.scope().cardModel,
                  jqEl: jqEl.siblings('card')
                };
              });
            }

          }

          if (!_.isEmpty(scope.grabbedCard)) {

            // Card is being dragged.

            var cardTile = scope.grabbedCard.jqEl.closest('.card-spot');
            var newWidth = cardTile.width();
            var newHeight = cardTile.height();

            var cardModel = scope.grabbedCard.model;

            cardOriginX = position.clientX - newWidth * cursorToCardOriginXRatio;
            cardOriginY = position.clientY - newHeight * cursorToCardOriginYRatio;


            var targetModel = findDropTarget(cardOriginX, cardOriginY, position.clientY);

            if (targetModel !== null && targetModel !== cardModel) {

              var currentCards = scope.page.getCurrentValue('cards');

              var targetModelIndex = _.indexOf(currentCards, targetModel);

              // Drop the dropped card in front of the card dropped onto.
              var newCards = _.without(currentCards, cardModel);

              if (cardModel.getCurrentValue('cardSize') !== targetModel.getCurrentValue('cardSize')) {

                cardModel.set('cardSize', targetModel.getCurrentValue('cardSize'));

              }

              newCards.splice(targetModelIndex, 0, cardModel);

              scope.safeApply(function() {
                scope.page.set('cards', newCards);
              });

            } else {

              var cardSize = null;

              $('.card-group-drop-placeholder').each(function(index, item) {
                var boundingRect = item.getBoundingClientRect();
                if (cardOriginX >= boundingRect.left &&
                    cardOriginX <= boundingRect.left + boundingRect.width &&
                    position.clientY >= boundingRect.top &&
                    position.clientY <= boundingRect.top + boundingRect.height) {
                  cardSize = parseInt(item.getAttribute('data-group-id'), 10);
                }
              });

              if (cardSize !== null) {
                scope.safeApply(function() {
                  cardModel.set('cardSize', cardSize);
                });
              }

            }

            scope.grabbedCard.jqEl.css({
              top: cardOriginY,
              left: cardOriginX
            });

            requestAnimationFrame(checkForScroll);
          }

        });

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

          if (scope.grabbedCard !== null) {
            lastFrameTime = now;
            requestAnimationFrame(checkForScroll);
          }

        };

        scope.deleteCard = function(cardModel) {
          scope.safeApply(function() {
            scope.page.set('cards', _.without(scope.cardModels, cardModel));
          });
        };

        scope.addCard = function(cardSize) {
          if (scope.allowAddCard) {
            scope.$emit('modal-open-surrogate', {id: 'add-card-dialog', cardSize: cardSize});
          }
        };

        FlyoutService.register('expand-button-target', function(el) {
          return '<div class="flyout-title">{0}</div>'.format($(el).attr('title'));
        });

        FlyoutService.register('delete-button-target', function(el) {
            return '<div class="flyout-title">{0}</div>'.format($(el).attr('title'));
          });

        FlyoutService.register('add-card-button', function(el) {
            if ($(el).hasClass('disabled')) {
              return '<div class="flyout-title">All available cards are already on the page</div>';
            }
          });

        /******************
        * Bind observable *
        ******************/

        scope.bindObservable('cardModels', scope.page.observe('cards'));

      }
    }
  }

  angular.
    module('dataCards.directives').
      directive('cardLayout', cardLayout);

})();
