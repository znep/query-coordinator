(function(){

  var _ssync;

  var DataSync = Model.extend({
    ssync: function() {
      if (!_ssync) {
        _ssync = new DatasyncUpload({
          // log : function(thing) { console.log(thing); },
          // forceWorkerReload : true
        });
      }
      return _ssync;
    },

    _buildControlFile: function(optionsParam) {
      //options = options || {};
      var options = $.extend(true, {}, optionsParam, optionsParam.blueprint),
          control = {};

      if (_.isUndefined(options.action)) {
        control.action = 'replace';
      } else if (_.include([ 'append', 'replace' ], options.action.toLowerCase())) {
        control.action = options.action;
      } else {
        throw 'Control file is missing valid action.';
      }

      if (_.isNumber(options.skip)) {
        control.skip = options.skip;
      }

      // TODO: More option handling here.

      var controlFile = {};
      if (_.isUndefined(options.fileType)) {
        controlFile['csv'] = control;
      } else if (_.include([ 'csv', 'tsv' ], options.fileType)) {
        controlFile[options.fileType] = control;
      } else {
        throw 'Control file is missing file type.';
      }

      return controlFile;
    },

    upload: function(file, options) {
      options = options || {};
      console.info('uploading options', options);

      if (_.isUndefined(file)) {
        throw 'No file passed for upload.';
      }

      if (_.isUndefined(options.datasetId)) {
        throw 'No dataset ID found';
      } else if (!blist.util.patterns.UID.test(options.datasetId)) {
        throw 'Given dataset ID is not a dataset ID.';
      }

      var deferred = $.Deferred(),
          controlFile = this._buildControlFile(options);

      var onProgress = function(progressObj) {
        if (_.isFunction(options.onProgress)) {
          options.onProgress(progressObj);
        }
      };

      var onError = function(errObj) {
        console.error('datasync errored: ', errObj);

        if (_.isFunction(options.onError)) {
          options.onError(errObj);
        }

        deferred.reject(errObj);
      };

      var onComplete = function(progressObj) {
        if (_.isFunction(options.onComplete)) {
          options.onComplete(progressObj);
        } else if (_.isFunction(options.onProgress)) {
          options.onProgress(progressObj);
        }
        console.info('complete', options.datasetId);
        deferred.resolve(progressObj);
      };

      var authToken = options.authenticity_token || $('meta[name="csrf-token"]').attr('content');
      var headers = {
        'x-app-token': blist.configuration.appToken,
        'x-csrf-token': authToken
      };

      this.ssync().upload(options.datasetId, controlFile, file, {
        progress: onProgress,
        onError: onError,
        onComplete: onComplete,
        headers: headers
      });

      return deferred.promise();
    }
  });

  if (blist.inBrowser) {
    this.DataSync = DataSync;
    $.dataSync = new DataSync();
  }
  else {
    module.exports = DataSync;
  }

})();
