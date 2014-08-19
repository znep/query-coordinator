angular.module('dataCards.controllers').controller('CardsViewController',
  function($scope, $log, AngularRxExtensions, SortedTileLayout, Filter, page) {

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

    AngularRxExtensions.install($scope);

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
    var rowsOfCardsBySize = zipLatestArray(page.observe('cards'), 'cardSize').
      map(function(sizedCards) {
        return layout.doLayout(sizedCards);
      });

    $scope.page = page;

    $scope.bindObservable('pageName', page.observe('name').map(function(name) {
      return _.isUndefined(name) ? 'Untitled' : name;
    }));

    $scope.bindObservable('pageDescription', page.observe('description'));

    $scope.bindObservable('datasetCSVDownloadURL',
      page.observe('dataset').map(function(dataset) {
        if (dataset && dataset.hasOwnProperty('id')) {
          return '/api/views/{0}/rows.csv?accessType=DOWNLOAD'.format(dataset.id);
        } else {
          return '#';
        }
      }));

    $scope.bindObservable('datasetAPIURL', Rx.Observable.combineLatest(
      page.observe('dataset').map(function(dataset) { if (dataset) { return dataset.id; } else { return null; } }),
      page.observe('dataset').observeOnLatest('domain').map(function(domain) { if (domain) { return domain; } else { return null; } }),
      function(datasetId, domain) {
        if ($.isPresent(datasetId) && $.isPresent(domain)) {
          return 'http://{0}/resource/{1}/rows.json'.format(domain, datasetId);
        } else {
          return '';
        }
      }));

    $scope.bindObservable('datasetDocumentationURL',Rx.Observable.combineLatest(
      page.observe('dataset').map(function(dataset) { if (dataset) { return dataset.id; } else { return null; } }),
      page.observe('dataset').observeOnLatest('domain').map(function(domain) { if (domain) { return domain; } else { return null; } }),
      function(datasetId, domain) {
        if ($.isPresent(datasetId) && $.isPresent(domain)) {
          return 'http://dev.socrata.com/foundry/#/{0}/{1}'.format(domain, datasetId);
        } else {
          return '#';
        }
      }));

    $scope.bindObservable('rowsOfCardsBySize', rowsOfCardsBySize);
    $scope.bindObservable('cardSizeNamesInDisplayOrder', rowsOfCardsBySize.map(function(sizedCards) {
      // Note that this only works because our card sizes ('1', '2', '3', and '4') sort well
      // lexicographically.
      return _.keys(sizedCards).sort();
    }));

    var expandedZipped = zipLatestArray(page.observe('cards'), 'expanded');
    var expandedCards = expandedZipped.map(function(cards) {
      return _.pluck(_.filter(cards, 'expanded'), 'model');
    });
    var collapsedCards = expandedZipped.map(function(cards) {
      return _.pluck(_.reject(cards, 'expanded'), 'model');
    });
    $scope.bindObservable('collapsedCards', collapsedCards);
    $scope.bindObservable('expandedCards', expandedCards);
    $scope.bindObservable('useExpandedLayout', expandedCards.map(function(cards) {
      return !_.isEmpty(cards);
    }));

    $scope.bindObservable('dataset', page.observe('dataset'));
    $scope.bindObservable('datasetPages', page.observe('dataset').observeOnLatest('pages'));
    $scope.bindObservable('datasetRowDisplayUnit', page.observe('dataset').observeOnLatest('rowDisplayUnit'));
    $scope.bindObservable('datasetDaysUnmodified', page.observe('dataset').observeOnLatest('updatedAt').map(function(date) {
      // TODO just a placeholder implementation
      if (!date) return '';
      return moment(date).fromNow();
    }));

    var allCardsFilters = page.observe('cards').flatMap(function(cards) {
      if (!cards) { return Rx.Observable.never(); }
      return Rx.Observable.combineLatest(_.map(cards, function(d) { return d.observe('activeFilters');}), function() {
        return _.zipObject(_.pluck(cards, 'fieldName'), arguments);
      });
    });
    var allCardsWheres = allCardsFilters.map(function(filters) {
      var wheres = _.map(filters, function(operators, field) {
        if (_.isEmpty(operators)) {
          return null;
        } else {
          return _.invoke(operators, 'generateSoqlWhereFragment', field).join(' AND ');
        }
      });
      return _.compact(wheres).join(' AND ');
    });
    $scope.bindObservable('globalWhereClauseFragment', allCardsWheres.combineLatest(page.observe('baseSoqlFilter'), function(cardWheres, basePageWhere) {
      return _.compact([basePageWhere, cardWheres]).join(' AND ');
    }));

    $scope.bindObservable('appliedFiltersForDisplay', allCardsFilters.combineLatest(page.observe('dataset').observeOnLatest('columns'), function(filters, columns) {
      function humanReadableOperator(filter) {
        if (filter instanceof Filter.BinaryOperatorFilter) {
          if (filter.operator === '=') {
            return 'is';
          } else {
            throw new Error('Only = binary operator supported for MVP');
          }
        } else if (filter instanceof Filter.TimeRangeFilter) {
          return 'is';
        } else if (filter instanceof Filter.IsNullFilter) {
          if (filter.isNull) {
            return 'is';
          } else {
            return 'is not';
          }
        } else {
          throw new Error('Unsupported filter type');
        }
      };

      function humanReadableOperand(filter) {
        if (filter instanceof Filter.BinaryOperatorFilter) {
          return filter.humanReadableOperand || filter.operand;
        } else if (filter instanceof Filter.IsNullFilter) {
          return 'blank';
        } else if (filter instanceof Filter.TimeRangeFilter) {
          var format = 'YYYY MMMM DD';
          return '{0} to {1}'.format(
            moment(filter.start).format(format),
            moment(filter.end).format(format)
          );
        } else {
          throw new Error('Unsupported filter type');
        }
      };

      return _.reduce(filters, function(accumulator, appliedFilters, fieldName) {
        if ($.isPresent(appliedFilters)) {
          if (appliedFilters.length > 1) {
            $log.warn('NOTE: quick filter bar does not yet support multiple filters for one card. Only first filter displayed.');
          }
          var filter = _.first(appliedFilters);
          accumulator.push({
            column: columns[fieldName],
            operator: humanReadableOperator(filter),
            operand: humanReadableOperand(filter)
          });
        }
        return accumulator;
      }, []);
    }));

    $scope.$on('stickyHeaderAvailableContentHeightChanged', function(event, availableContentHeight) {
      event.stopPropagation();
      $scope.availableContentHeightStyle = {
        'top': availableContentHeight + 'px'
      };
    });

    $scope.apiPanelActive = false;

    $('#api-panel-toggle-btn').on('click', function() {
      $scope.$apply(function() {
        $scope.apiPanelActive = !$scope.apiPanelActive;
      });
    });

    /* Handle selection of the API endpoint URL in the API panel */

    // Don't include this in scope! It either won't work and will require an .$apply()
    // or it will cause a bunch of digest cycles unnecessarily.
    var mouseHasNotMovedSinceMouseDown = false;

    $('#api-url-display').on('mousedown', function() {
      mouseHasNotMovedSinceMouseDown = true;
    });

    $('#api-url-display').on('mousemove', function() {
      mouseHasNotMovedSinceMouseDown = false;
    });

    // Also reset the mouse state on scroll so it doesn't auto-select the API url
    // when we try to maniuplate the scroll bar.
    $('#api-url-display').on('scroll', function() {
      mouseHasNotMovedSinceMouseDown = false;
    });

    $('#api-url-display').on('mouseup', function() {
      if (mouseHasNotMovedSinceMouseDown) {

        var text = document.getElementById('api-url-display');

        // Cater to IE...
        if (document.body.createTextRange) {
            var range = document.body.createTextRange();
            range.moveToElementText(text);
            range.select();
        // ...or everyone else.
        } else if (window.getSelection) {
            var selection = window.getSelection();
            var range = document.createRange();
            range.selectNodeContents(text);
            selection.removeAllRanges();
            selection.addRange(range);
        }

      }
    });

    $('#api-url-display').on('blur', function() {
      urlDisplayNotFocused = true;
    });

    $scope.$on('$destroy', function() {
      $('#api-panel-toggle-btn').off('click');
      $('#api-url-display').off('mousedown');
      $('#api-url-display').off('mousemove');
      $('#api-url-display').off('scroll');
      $('#api-url-display').off('mouseup');
      $('#api-url-display').off('blur');
    });

    // Given a card's position in its line and the number of cards in its line,
    // returns either the string 'onRight' or 'onLeft'. If the card is in the middle,
    // 'onLeft' is returned.
    $scope.classForScreenPosition = function(cardIndex, numCardsInLine) {
      var onRight = cardIndex >= Math.ceil(numCardsInLine / 2);
      return onRight ? 'onRight' : 'onLeft';
    };
  });
