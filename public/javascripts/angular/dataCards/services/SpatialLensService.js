const angular = require('angular');

var httpConfig = {
  requester: {
    requesterLabel: _.constant('spatial-lens-service')
  },
  cache: true
};

function SpatialLensService(http, rx, ServerConfig) {
  var spatialLensService = {
    isSpatialLensEnabled: isSpatialLensEnabled,
    isSpatialLensAdminEnabled: isSpatialLensAdminEnabled,
    getAvailableGeoregions$: getAvailableGeoregions$,
    findComputedColumnForRegion: findComputedColumnForRegion,
    getCuratedRegions: getCuratedRegions,
    initiateRegionCoding: initiateRegionCoding,
    getRegionCodingStatus: getRegionCodingStatus,
    getRegionCodingStatusFromJob: getRegionCodingStatusFromJob,
    pollRegionCodingStatus: pollRegionCodingStatus,
    executeRegionCodingJob: executeRegionCodingJob
  };

  function isSpatialLensEnabled() {
    return ServerConfig.get('enableSpatialLensRegionCoding');
  }

  function isSpatialLensAdminEnabled() {
    return ServerConfig.get('enableSpatialLensAdmin');
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
          return _.uniq(curatedRegions.concat(existingRegions), 'view.id');
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

  function executeRegionCodingJob(datasetId, shapefileId, sourceColumn) {
    var initiate$ = spatialLensService.initiateRegionCoding(datasetId, shapefileId, sourceColumn);
    var getPollObservable = _.partial(spatialLensService.pollRegionCodingStatus, datasetId, _);

    return rx.Observable.fromPromise(initiate$). // Make a request to /initiate
      filter(_.property('data.success')). // Only continue if it was successful
      pluck('data', 'jobId'). // Grab out the jobId
      flatMapLatest(getPollObservable);
  }

  return spatialLensService;
}

angular.
  module('dataCards.services').
  factory('SpatialLensService', SpatialLensService);
