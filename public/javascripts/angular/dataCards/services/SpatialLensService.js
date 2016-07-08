var httpConfig = {
  requester: {
    requesterLabel: _.constant('spatial-lens-service')
  },
  cache: true
};

module.exports = function SpatialLensService($q, http, rx, ServerConfig, CardVisualizationChoroplethHelpers) {
  var spatialLensService = {
    isSpatialLensEnabled: isSpatialLensEnabled,
    getAvailableGeoregions$: getAvailableGeoregions$,
    findComputedColumnForRegion: findComputedColumnForRegion,
    cardNeedsRegionCoding: cardNeedsRegionCoding,
    initiateRegionCodingIfNecessaryForCard: initiateRegionCodingIfNecessaryForCard,
    getCuratedRegions: getCuratedRegions,
    initiateRegionCoding: initiateRegionCoding,
    getRegionCodingStatus: getRegionCodingStatus,
    getRegionCodingStatusFromJob: getRegionCodingStatusFromJob,
    pollRegionCodingStatus: pollRegionCodingStatus
  };

  function isSpatialLensEnabled() {
    return ServerConfig.get('enableSpatialLensRegionCoding');
  }

  function getAvailableGeoregions$(dataset) {
    var columns = dataset.getCurrentValue('columns');

    // Regions that have already been region-coded and exist as computed columns on the dataset.
    // Pluck out the name and shapefile 4x4. Transform into the same shape as the curated regions
    // API for a consistent structure. Use substring because the region is stored with a leading
    // underscore in the column metadata.
    var existingRegions = _.chain(columns).
      filter('computationStrategy.parameters.region').
      map(function(column) {
        return {
          name: column.name,
          view: {
            id: column.computationStrategy.parameters.region.substring(1)
          }
        };
      }).
      value();

    // If spatial lens is not enabled then we do not expose non-region coded curated regions as
    // valid georegions for the dataset. Otherwise, merge the existing regions with the curated
    // regions and remove duplicates.
    if (!spatialLensService.isSpatialLensEnabled()) {
      return rx.Observable.returnValue(existingRegions);
    } else {
      return rx.Observable.fromPromise(spatialLensService.getCuratedRegions()).
        map(function(curatedRegions) {
          return _.uniqBy(curatedRegions.concat(existingRegions), 'view.id');
        });
    }
  }

  function findComputedColumnForRegion(columns, region) {
    return _.find(columns, {
      computationStrategy: {
        parameters: {
          region: `_${region}`
        }
      }
    });
  }

  function cardNeedsRegionCoding(cardModel) {
    var columns = cardModel.page.getCurrentValue('dataset').getCurrentValue('columns');
    var computedColumnName = cardModel.getCurrentValue('computedColumn');

    var cardIsChoropleth = cardModel.getCurrentValue('cardType') === 'choropleth';
    var computedColumnMissing = !_.isPresent(columns[computedColumnName]);

    return cardIsChoropleth && computedColumnMissing;
  }

  function initiateRegionCodingIfNecessaryForCard(cardModel) {
    if (!isSpatialLensEnabled() || !cardNeedsRegionCoding(cardModel)) {
      return $q.when(null);
    }

    var datasetId = cardModel.page.getCurrentValue('dataset').id;
    var computedColumnName = cardModel.getCurrentValue('computedColumn');
    var shapefileId = CardVisualizationChoroplethHelpers.computedColumnNameToShapefileId(computedColumnName);
    var sourceColumn = cardModel.fieldName;

    return getRegionCodingStatus(datasetId, shapefileId).then(function(response) {
      var status = _.get(response, 'data.status');

      if (status === 'completed' || status === 'processing') {
        return null;
      } else {
        return initiateRegionCoding(datasetId, shapefileId, sourceColumn);
      }
    });
  }

  function getCuratedRegions() {
    var url = $.baseUrl('/api/curated_regions');

    return http.get(url.href, httpConfig).then(function(response) {
      return response.data;
    }, function() {
      return [];
    });
  }

  function initiateRegionCoding(datasetId, shapefileId, sourceColumn) {
    var url = $.baseUrl('/geo/initiate');

    var payload = {
      datasetId: datasetId,
      shapefileId: shapefileId,
      sourceColumn: sourceColumn
    };

    return http.post(url.href, payload, httpConfig);
  }

  // Uses an unreliable method to determine region coding status using a shapefile ID. Useful if
  // the job ID is not known.
  function getRegionCodingStatus(datasetId, shapefileId) {
    var url = $.baseUrl('/geo/status');

    url.searchParams.set('datasetId', datasetId);
    url.searchParams.set('shapefileId', shapefileId);

    return http.get(url.href, _.merge(httpConfig, {
      cache: false
    }));
  }

  // Gets the status for a region coding job.
  function getRegionCodingStatusFromJob(datasetId, jobId) {
    var url = $.baseUrl('/geo/status');

    url.searchParams.set('datasetId', datasetId);
    url.searchParams.set('jobId', jobId);

    return http.get(url.href, _.merge(httpConfig, {
      cache: false
    }));
  }

  // Returns an observable that polls the region coding job's status and emits a value when the
  // job is complete.
  function pollRegionCodingStatus(datasetId, jobId) {
    var getStatus = _.partial(spatialLensService.getRegionCodingStatusFromJob, datasetId, jobId);

    function isComplete(response) {
      return response.data &&
        response.data.success === true &&
        response.data.status === 'completed';
    }

    return rx.Observable.
      interval(5000).
      map(getStatus).
      switchLatest().
      filter(isComplete).
      take(1);
  }

  return spatialLensService;
};
