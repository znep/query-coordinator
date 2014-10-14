(function() {
  'use strict';

  var sortedTileLayout;
  var EXPANDED_SIZE_TO_HEIGHT = {
    1: 250,
    2: 200,
    // TODO this should be 150, but for demo purposes we're bumping it up to work around
    // some padding overflow issues.
    3: 200
  };
  var COLLAPSED_SIZE_TO_HEIGHT = {
    1: 300,
    2: 250,
    3: 200
  };

  function cardLayout(Constants, AngularRxExtensions, WindowState, SortedTileLayout, FlyoutService) {
    sortedTileLayout = new SortedTileLayout();
    return {
      restrict: 'E',
      scope: {
        page: '=',
        expandedCard: '=',
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


        /**
         * In an expanded view, the expanded card needs to update its vertical
         * sizing/position based on the quick filter bar and the footer.
         *
         * @param {object} style The object that holds the css styles for the expanded
         * card.
         * @param {Card} cardModel The Card model for the expanded card.
         */
        function updateExpandedVerticalDims(style, cardModel, scrollTop,
                                            windowSize, heightOfAllCards) {
          var expandedColumnHeight = windowSize.height - Constants.LAYOUT_VERTICAL_PADDING;
          if (quickFilterBar.hasClass('stuck')) {
            expandedColumnHeight -= quickFilterBar.height();
          } else {
            expandedColumnHeight -= cardContainer.offset().top - scrollTop;
          }

          var footerOffset = cardModel.fieldName === '*' ?
              0 :
              Math.max(0, (scrollTop + windowSize.height) - (
                cardContainer.offset().top + heightOfAllCards));

          style.bottom = Constants.LAYOUT_VERTICAL_PADDING + footerOffset;
          style.height = expandedColumnHeight - footerOffset;
        }

        /**
         * Generates the styles for an expanded-card layout.
         */
        function layoutExpanded(cardsBySize, containerContentWidth, windowSize) {
          var heightOfAllCards = 0;
          var expandedCardPos;
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
            // the card model.
            if (card.model.getCurrentValue('expanded')) {
              expandedCardPos = card;
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
              var cardHeight = EXPANDED_SIZE_TO_HEIGHT[parseInt(card.cardSize, 10)];

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
            heightOfAllCards = Constants['LAYOUT_MIN_EXPANDED_CARD_HEIGHT']
              + (Constants['LAYOUT_VERTICAL_PADDING'] * 2);
          }

          // Set the style for the expanded card.
          expandedCardPos.style = {
            position: 'fixed',
            left: expandedColumnLeft,
            width: expandedColumnWidth
          };
          updateExpandedVerticalDims(expandedCardPos.style, expandedCardPos.model,
                                     jqueryWindow.scrollTop(), windowSize,
                                     heightOfAllCards);


          // If the datacard isn't expanded, then add it to the bottom
          if (expandedCardPos.model.fieldName !== '*') {
            cardsBySize.dataCard[0].style = {
              left: Constants['LAYOUT_GUTTER'],
              top: heightOfAllCards,
              width: containerContentWidth,
              height: Constants['LAYOUT_DATA_CARD_HEIGHT']
            };
          }

          return heightOfAllCards;
        }

        /**
         * Generates the styles for a collapsed-card layout.
         */
        function layoutCollapsed(cardsBySize, editMode, containerContentWidth,
                                 placeholderDropTargets, addCardButtons) {
          var heightOfAllCards = 0;

          // Lay out the cards into rows
          // Hash of {cardSize: [ row_n, ... ]}, where  row_n is an array of items from
          // cardsBySize.normal.
          var editableCards = sortedTileLayout.doLayout(cardsBySize.normal);

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
            var currentRowHeight = COLLAPSED_SIZE_TO_HEIGHT[parseInt(cardSize, 10)];
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

                card.style = {
                  top: cardTop,
                  left: cardLeft,
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
                cardSize: cardSize,
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
                cardSize: cardSize,
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

          return heightOfAllCards;
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

        var cardsBySizeObs = zipLatestArray(scope.page.observe('cards'), 'cardSize').
            map(function(cards) {
              return _.groupBy(cards, function(card) {
                return card.model.fieldName === '*' ? 'dataCard' : 'normal';
              });
            });

        var expandedCardsObs = zipLatestArray(scope.page.observe('cards'), 'expanded').
            map(function(cards) {
              return _.where(cards, _.property('expanded'));
            });

        // Stuff that changes when we scroll
        WindowState.scrollPositionSubject.subscribe(function(scrollTop) {
          // Figure out the sticky-ness of the QFB and apply the style appropriately
          var headerStuck = scrollTop >= (
            cardsMetadataOffsetTop + cardsMetadata.outerHeight());
          quickFilterBar.toggleClass('stuck', headerStuck);

        // We also change the height of the expanded card onscroll
        });
        WindowState.scrollPositionSubject.where(function() {
          // Cast to a boolean
          return !!scope.expandedCard;
        }).subscribe(function(scrollTop) {
          var styles = {};
          updateExpandedVerticalDims(styles, scope.expandedCard,
                                     jqueryWindow.scrollTop(), jqueryWindow.dimensions(),
                                     cardContainer.height());
          cardContainer.find('.expanded').closest('.card-spot').css(styles);
        });

        /**************
        * Card layout *
        **************/
        Rx.Observable.subscribeLatest(
          cardsBySizeObs,
          expandedCardsObs,
          scope.observe('editMode'),
          scope.observe('allowAddCard'),
          cardsMetadata.observeDimensions(),
          WindowState.windowSizeSubject,
          function layoutFn(cardsBySize, expandedCards, editMode, allowAddCard, cardsMetadataSize, windowSize) {

            if (_.isEmpty(cardsBySize.normal) || _.isEmpty(cardsBySize.dataCard)) {
              return;
            }

            // Figure out if there is an expanded card.
            // Keep track of whether the layout is an expanded-card layout, so upstream
            // scopes can do things like disable edit buttons
            scope.expandedCard = _.isEmpty(expandedCards) ? null : expandedCards[0].model;

            // Terminology:
            //
            // Content size (width, height) refers to a size with padding/LAYOUT_GUTTER
            // removed.  Otherwise, sizes include padding/LAYOUT_GUTTER.
            var containerContentWidth = cardContainer.width()
              - Constants['LAYOUT_GUTTER'] * 2;

            // Track whether or not to draw placeholder drop targets
            // for each card grouping.
            var placeholderDropTargets = [];

            // Track each 'add card' button's position in the layout
            var addCardButtons = [];

            // Branch here based on whether or not there is an expanded card.
            var heightOfAllCards;
            if (scope.expandedCard !== null) {
              heightOfAllCards = layoutExpanded(
                cardsBySize, containerContentWidth, windowSize);
            } else {
              heightOfAllCards = layoutCollapsed(
                cardsBySize, editMode, containerContentWidth,
                placeholderDropTargets, addCardButtons);
            }

            cardContainer.css({
              visibility: 'visible',
              height: heightOfAllCards
            });

            scope.cardPositions = cardsBySize.normal.concat(cardsBySize.dataCard);
            scope.placeholderDropTargets = placeholderDropTargets;
            scope.addCardButtons = addCardButtons;

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
            return cardPositionData.style.top <= clientY && (
              cardPositionData.style.top + cardPositionData.style.height) >= clientY;
          });

          var closestCard = cardsInMyRow.reduce(function(currentClosest, cardPositionData) {
            var distance = Math.sqrt(Math.pow(cursorX - cardPositionData.style.left, 2)
                                     + Math.pow(cursorY - cardPositionData.style.top, 2));
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
                  model: jqEl.scope().cardPosition.model,
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
          var distanceToScrollTop = jqueryWindow.scrollTop();

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
