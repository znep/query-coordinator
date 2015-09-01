(function() {
  'use strict';

  function cardVisualizationFeatureMap(
    $q,
    $log,
    Constants,
    WindowState,
    ServerConfig,
    CardDataService,
    VectorTileDataService,
    LeafletHelpersService,
    LeafletVisualizationHelpersService
  ) {

    function createTimer$() {
      return Rx.Observable.timer(Constants.FEATURE_MAP_RENDER_TIMEOUT, Rx.Scheduler.timeout);
    }

    return {
      restrict: 'E',
      scope: {
        'model': '=',
        'whereClause': '='
      },
      templateUrl: '/angular_templates/dataCards/cardVisualizationFeatureMap.html',
      link: function cardVisualizationFeatureMapLink(scope) {
        var model = scope.$observe('model');
        var whereClause$ = scope.$observe('whereClause');
        var dataset$ = model.observeOnLatest('page.dataset').filter(_.isPresent);
        var columns$ = dataset$.observeOnLatest('columns').filter(_.isPresent);
        var dataFieldName$ = model.observeOnLatest('fieldName');
        var id$ = dataset$.observeOnLatest('id').filter(_.isPresent);
        var flannelTitleColumn$ = model.observeOnLatest('cardOptions.mapFlannelTitleColumn');

        /**
         * Handle queries for the row data for points clicked on current feature map.
         *
         * @param {Object} mousePosition - The e.latlng object of current click event
         * @param {Array} rows - the current rows represented by points highlighted on map by hover
         * @return {Array} the reformatted and organized dataset data for each row currently
         *    highlighted by hover. Stored in an array of rows, structured as:
         *    [row1, row2, row3, row4...], where each row is an array of its cells:
         *      row1 = [cell1, cell2, cell3 ...]
         *
         *    The data of each column cell within the row can take the following forms:
         *
         *      simpleCell = {
         *        columnName: <column name>,
         *        format: <Object from column containing formatting info>,
         *        physicalDatatype: <physicalDataType>
         *        value : <simple data type>,
         *      },
         *
         *      complexCell: { // Point, Line, or Polygon columns, or any column with an object as its value
         *        columnName: <column name>,
         *        format: <Object from column containing formatting info>,
         *        currentColumn: <boolean whether is from the column represented in feature map>,
         *        physicalDatatype: <physicalDataType>,
         *        value: [subColumn1, subColumn2, subColumn3...] where a subColumn is:
         *          originalColumnData = {
         *            value: {
         *              coordinates: [lng, lat], // or [v, x, y, z]
         *              type: Point // or Line, Polygon, etc
         *            }
         *          },
         *          generatedSubColumn = {
         *            columnName: <computed name>, // 'address', 'city', 'state', 'zip', or the column key
         *                // with each word capitalized separated by spaces.
         *            format: <Object from column containing formatting info>,
         *            physicalDatatype: <physicalDataType>
         *            value: <simple data type>
         *          }
         *      }, ...
         */

        // Reformats columnKeys (in snake case) capitalizing each word,
        // separated by spaces.
        function reformatCellName(cellName) {
          return cellName.split('_').
            map(function(word) {
              return _.capitalize(word);
            }).
            join(' ');
        }

        // This method takes in the column name of the subColumn
        // (e.g. Crime Location (address)) and the parentColumnName of that
        // subColumn (e.g. Crime Location) and returns the subColumn string
        // within the parentheses (address).
        function constructSubColumnName(existingName, parentColumnName) {
          var subColumnMatch = existingName.match(/\(([^()]+)\)$/);
          if (subColumnMatch) {
            var existingNameSuffix = subColumnMatch[1];
            if (_.contains(['address', 'city', 'state', 'zip'], existingNameSuffix)) {
              return existingNameSuffix;
            }
          }
          return existingName.replace('{0} '.format(parentColumnName), '');
        }

        // Handles query for rows under clicked points, and reformats query response.
        scope.getClickedRows = function(mousePosition, points, bounds) {

          // Get necessary data for query and perform query for clicked rows
          var numberOfRowsClicked = _.sum(points, 'count');
          var rowQueryComponents$ = Rx.Observable.combineLatest(
            id$,
            dataFieldName$,
            whereClause$,
            function(id, fieldName, whereClause) {
              return {
                id: id,
                fieldName: fieldName,
                whereClause: whereClause
              };
            });

          // Submit query for clicked rows
          var rowQueryResponse$ = rowQueryComponents$.flatMapLatest(function(rowQueryComponents) {
            var offset = 0;
            var order = 'distance_in_meters({field}, "POINT({lng} {lat})")'.format({
              field: rowQueryComponents.fieldName,
              lng: mousePosition.lng,
              lat: mousePosition.lat
            });

            var withinBox = 'within_box({field}, {northeast}, {southwest})'.format({
              field: rowQueryComponents.fieldName,
              northeast: '{0}, {1}'.format(bounds.northeast.lat, bounds.northeast.lng),
              southwest: '{0}, {1}'.format(bounds.southwest.lat, bounds.southwest.lng)
            });

            var whereClause;
            if (_.isPresent(rowQueryComponents.whereClause)) {
              whereClause = '{originalWhereClause} AND {withinBox}'.format({
                originalWhereClause: rowQueryComponents.whereClause,
                withinBox: withinBox
              });
            } else {
              whereClause = withinBox;
            }

            var rowQueryResponsePromise = CardDataService.getRows(
              rowQueryComponents.id,
              offset,
              numberOfRowsClicked,
              order,
              $q.defer(),
              whereClause
            );
            return Rx.Observable.fromPromise(rowQueryResponsePromise);
          });

          var formattedRowQueryResponse$ = Rx.Observable.combineLatest(
            rowQueryResponse$,
            columns$.filter(_.isDefined),
            dataFieldName$,
            flannelTitleColumn$,
            function(rows, columns, fieldName, flannelTitleColumn) {
              if (_.isNull(rows)) {
                return null;
              }

              // Each of our rows will be mapped to 'formattedRowData',
              // an array of objects.  Each row corresponds to a single
              // page in the flannel.
              return _.map(rows, function(row) {
                var formattedRowData = [];

                // We will be representing our formatted line-by-line data
                // on each page with an array of objects, where each object
                // corresponds to a single line on the flannel page.
                _.each(row, function(cellValue, cellName) {
                  var column = columns[cellName];

                  if (_.isUndefined(column.name)) {
                    column.name = reformatCellName(cellName);
                  }

                  // If we're formatting a subcolumn, first find the parent
                  // column name and position, and then format accordingly.
                  // Otherwise, just format the normal column.
                  // Note: We can rely upon subcolumns being added after their
                  // corresponding parent columns.
                  if (column.isSubcolumn) {

                    // For example, if cellName was 'crime_location_address' or
                    // 'crime_location_zip', the parentColumnName would be
                    // 'crime_location'.
                    var parentColumnName = cellName.slice(0, cellName.lastIndexOf('_'));
                    var parentPosition = columns[parentColumnName].position;
                    var subColumnName = constructSubColumnName(column.name, parentColumnName);

                    // Add the subcolumn data.
                    formattedRowData[parentPosition].value.push({
                      columnName: subColumnName,
                      value: cellValue,
                      format: column.format,
                      physicalDatatype: column.physicalDatatype
                    });
                  } else {
                    // If the cellValue is an object (e.g. a coordinate point),
                    // we should format it slightly differently.
                    // We mark whether the cell is from the flannel title column.
                    formattedRowData[column.position] = {
                      columnName: column.name,
                      isTitleColumn: (cellName === flannelTitleColumn),
                      isFeatureMapColumn: (cellName === fieldName),
                      value: _.isObject(cellValue) ? [cellValue] : cellValue,
                      format: _.isObject(cellValue) ? undefined : column.format,
                      physicalDatatype: column.physicalDatatype
                    };
                  }
                });
                return formattedRowData.filter(_.isDefined);
              });
            }
          );
          return formattedRowQueryResponse$;
        };

        /*
        * Set up remaining observables
        */
        var datasetPermissions$ = dataset$.observeOnLatest('permissions').filter(_.isPresent);
        var baseSoqlFilter$ = model.observeOnLatest('page.baseSoqlFilter');
        var savedExtent$ = model.observeOnLatest('cardOptions.mapExtent').take(1);
        var defaultExtent$ = Rx.Observable.returnValue(CardDataService.getDefaultFeatureExtent());

        // The 'render:start' and 'render:complete' events are emitted by the
        // underlying feature map and are used for a) toggling the state of the
        // 'busy' spinner and b) performance analytics.
        var renderStart$ = scope.$eventToObservable('render:start');
        var renderError$ = scope.$eventToObservable('render:error');
        var renderComplete$ = scope.$eventToObservable('render:complete').
          takeUntil(renderError$);

        LeafletVisualizationHelpersService.setObservedExtentOnModel(scope, scope.model);

        // For every renderStart event, start a timer that will either expire on
        // its own, or get cancelled by the renderComplete event firing
        var renderTimeout$ = renderStart$.
          flatMap(createTimer$).
          takeUntil(renderComplete$);

        var synchronizedFieldnameDataset = Rx.Observable.combineLatest(
          model.pluck('fieldName'),
          dataset$,
          baseSoqlFilter$,
          function(fieldName, currentDataset) {
            return {
              fieldName: fieldName,
              dataset: currentDataset
            };
          }
        );

        // Start a timer when the card is ready to render, that will either
        // expire on its own, or get cancelled by a renderComplete event
        var directiveTimeout$ = synchronizedFieldnameDataset.
          flatMap(createTimer$).
          takeUntil(renderComplete$);

        // Display the error whenever something has timed out, clear it whenever
        // we successfully render
        var displayRenderError$ = Rx.Observable.
          merge(
            renderTimeout$.map(_.constant(true)),
            directiveTimeout$.map(_.constant(true)),
            renderError$.map(_.constant(true)),
            renderComplete$.map(_.constant(false))
          ).
          startWith(false).
          distinctUntilChanged();

        scope.$bindObservable('displayRenderError', displayRenderError$);

        // Show the busy indicator when we are ready to render, and when we have
        // started rendering.  Clear the indicator when things have timed out
        // (i.e. we are showing the render error), or when rendering has
        // completed successfully
        var busy$ = Rx.Observable.
          merge(
            synchronizedFieldnameDataset.map(_.constant(true)),
            renderStart$.map(_.constant(true)),
            renderTimeout$.map(_.constant(false)),
            directiveTimeout$.map(_.constant(false)),
            renderComplete$.map(_.constant(false)),
            renderError$.map(_.constant(false))
        ).
          startWith(true).
          distinctUntilChanged();

        scope.$bindObservable('busy', busy$);

        var serverExtent$ = synchronizedFieldnameDataset.
          flatMap(function(fieldNameDataset) {
            var fieldName = fieldNameDataset.fieldName;
            var currentDataset = fieldNameDataset.dataset;
            return Rx.Observable.
              fromPromise(CardDataService.getFeatureExtent(fieldName, currentDataset.id));
          }).
          onErrorResumeNext(Rx.Observable.empty());  // Promise error becomes empty observable

        // TODO - Fix synchronization here - not getting saved value
        var synchronizedFeatureExtentData$ = serverExtent$.
          startWith(undefined).
          combineLatest(
          defaultExtent$,
          savedExtent$,
          function(serverExtent, defaultExtent, savedExtent) {
            if (_.isPresent(savedExtent)) {
              return savedExtent;
            } else if (defaultExtent) {
              var defaultBounds;
              var featureBounds;
              try {
                defaultBounds = LeafletHelpersService.buildBounds(defaultExtent);
              } catch(error) {
                $log.warn(
                  'Unable to build bounds from defaultExtent: \n{0}'.
                    format(defaultExtent)
                );
                return serverExtent;
              }
              try {
                featureBounds = LeafletHelpersService.buildBounds(serverExtent);
              } catch(error) {
                $log.warn(
                  'Unable to build bounds from serverExtent: \n{0}'.
                    format(serverExtent)
                );
                return serverExtent;
              }
              if (defaultBounds.contains(featureBounds)) {
                return serverExtent;
              } else {
                return defaultExtent;
              }
            } else {
              return serverExtent;
            }
          });

        /****************************************
        * Bind non-busy-indicating observables. *
        ****************************************/

        scope.$bindObservable(
          'baseLayerUrl',
          model.observeOnLatest('baseLayerUrl')
        );

        scope.$bindObservable('featureExtent', synchronizedFeatureExtentData$);

        var featureSet = ServerConfig.getFeatureSet();

        var datasetIsPrivate$ = datasetPermissions$.
          map(function(permissions) {
            return !permissions.isPublic;
          }).
          startWith(true);

        var stagingApiLockdown$ = Rx.Observable.
          returnValue(_.get(featureSet, 'staging_api_lockdown', false));

        var stagingLockdown$ = Rx.Observable.
          returnValue(_.get(featureSet, 'staging_lockdown', false));

        var useOriginHost$ = Rx.Observable.combineLatest(
          datasetIsPrivate$,
          stagingApiLockdown$,
          stagingLockdown$,
          function(datasetIsPrivate, stagingApiLockdown, stagingLockdown) {
            return datasetIsPrivate || stagingApiLockdown || stagingLockdown;
          });

        var vectorTileGetter$ = Rx.Observable.combineLatest(
          model.pluck('fieldName'),
          dataset$.pluck('id'),
          whereClause$,
          useOriginHost$,
          VectorTileDataService.buildTileGetter);

        scope.$bindObservable('vectorTileGetter', vectorTileGetter$);

        scope.$bindObservable(
          'rowDisplayUnit',
          model.observeOnLatest('page.rowDisplayUnit')
        );

        scope.zoomDebounceMilliseconds = ServerConfig.get('featureMapZoomDebounce');

        scope.disablePanAndZoom = ServerConfig.get('featureMapDisablePanZoom');
      }
    };

  }

  angular.
    module('dataCards.directives').
      directive('cardVisualizationFeatureMap', cardVisualizationFeatureMap);

})();
