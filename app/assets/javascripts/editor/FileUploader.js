(function(root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  function FileUploader() {

    var _apiPrefixPath = '/stories/api/v1';

    var _uploadedPercent;
    var _file;
    var _getDocInterval = null;
    var _xhr = null;
    var _destroyed = false;

    var self = this;

    /**
     * Uploads a file to the storyteller app.
     *
     * Emits actions:
     *   FILE_UPLOAD_PROGRESS
     *   FILE_UPLOAD_ERROR
     *   FILE_UPLOAD_DONE
     *
     * The workflow for uploading a file requires at least 4 web requests.
     *
     *   1. Generate signed upload URL
     *
     *      POST /stories/api/v1/uploads
     *        {
     *          upload: { filename: 'filename.png' }
     *        }
     *
     *      This request responds with a signed URL and content-type to upload the
     *      file to S3.
     *
     *   2. Upload file to signed S3 URL
     *
     *      PUT https://sa-storyteller-us-west-2-staging.s3.amazonaws.com/uploads/random/filename.png?signed-params...
     *
     *   3. Create Document resource
     *
     *      POST /stories/api/v1/documents
     *        {
     *          document: {
     *            story_uid: 'four-four',
     *            direct_upload_url: 'https://sa-storyteller-us-west-2-staging.s3.amazonaws.com/uploads/random/filename.png',
     *            upload_file_name: 'thefilename.png',
     *            upload_content_type: 'image/png',
     *            upload_file_size: 1234
     *          }
     *        }
     *
     *      Returns the created document with an id
     *
     *   4. Wait for Document resource to be processed. This step is where the rails
     *      server will do any image processing, along with copying the uploaded file
     *      from the temp location above to its final location.
     *
     *      GET /stories/api/v1/documents/:id
     *
     *      Retry until document.status === 'processed'
     *
     * @param {File} file - a reference to the file to upload
     */
    this.upload = function(file) {
      // Would love to be able to do `utils.assert(file instanceof File)`, but mocking File is hard.
      utils.assert(!_.isUndefined(file.name), 'File not valid: missing name.');
      utils.assert(!_.isUndefined(file.size), 'File not valid: missing size.');
      utils.assert(!_.isUndefined(file.type), 'File not valid: missing type.');

      var maxFileSizeBytes = storyteller.config.fileUploader.maxFileSizeBytes || (1024 * 1024 * 5);

      _file = file;

      if (_file.size > maxFileSizeBytes) {
        _emitError('validation_file_size');
        return;
      }

      if (/image\/.*/.test(_file.type) !== true) {
        _emitError('validation_file_type');
        return;
      }

      _emitProgress(0);

      _getSignedUploadUrl().
        then(function(data) {
          return _uploadFile(data.url, data.content_type);
        }).
        then(function(downloadUrl) {
          return _saveResource(downloadUrl);
        }).
        then(function(resource) {
          return _waitForResourceToBeProcessed(resource);
        }).
        catch(function(error) {
          storyteller.notifyAirbrake(error);
          self.destroy();
        });
    };

    /**
     * Aborts uploads in progress and any intervals we have set to poll document
     * processing progress.
     */
    this.destroy = function() {
      _destroyed = true;

      // cancel all teh things
      if (_xhr !== null) {
        _xhr.abort();
      }

      if (_getDocInterval !== null) {
        clearInterval(_getDocInterval);
      }

      _file = null;
    };

    // Private methods

    function _emitProgress(progressBytes) {
      if (!_destroyed) {
        _uploadedPercent = progressBytes / _file.size;

        storyteller.dispatcher.dispatch({
          action: Actions.FILE_UPLOAD_PROGRESS,
          percentLoaded: _uploadedPercent
        });
      }
    }

    function _emitError(errorStep, reason) {
      storyteller.dispatcher.dispatch({
        action: Actions.FILE_UPLOAD_ERROR,
        error: {
          step: errorStep,
          reason: reason
        }
      });
    }

    function _getSignedUploadUrl() {
      var requestData = {
        upload: { filename: _file.name }
      };

      return _storytellerApiRequest('/uploads', 'POST', requestData).
        then(
          function(data) {
            // success
            return data.upload;
          },
          function(reason) {
            // error
            _emitError(
              'get_upload_url',
              { status: reason.status, message: reason.statusText }
            );

            throw new Error(
              'FileUploader#_getSignedUploadUrl: Could not create upload (story: {0}, filename: {1}) {2} {3} - {4}'.format(
                storyteller.userStoryUid,
                _file.name,
                reason.status,
                reason.statusText,
                reason.responseText
              )
            );
          }
        );
    }

    function _uploadFile(uploadUrl, contentType) {
      utils.assertIsOneOfTypes(uploadUrl, 'string');
      utils.assertIsOneOfTypes(contentType, 'string');

      return new Promise(function(resolve, reject) {
        _xhr = new XMLHttpRequest();

        function onFail() {
          if (!_destroyed) {
            _emitError(
              'upload_file',
              { status: parseInt(_xhr.status, 10), message: _xhr.statusText }
            );
            reject(new Error('Failed to upload file to {0}'.format(uploadUrl)));
          }
        }

        _xhr.onload = function() {
          if (_xhr.status === 200) {
            _emitProgress(_file.size);

            // Return the final URL of the uploaded file, which shouldn't include
            // any additional URL parameters.
            return resolve(uploadUrl.split('?')[0]);
          }

          onFail();
        };

        _xhr.upload.onprogress = function(event) {
          if (event.lengthComputable) {
            _emitProgress(event.loaded);
          }
        };

        _xhr.open('PUT', uploadUrl, true);
        _xhr.setRequestHeader('Content-Type', contentType);

        _xhr.onabort = onFail;
        _xhr.onerror = onFail;

        _xhr.send(_file);
      });
    }

    function _saveResource(downloadUrl) {
      var requestData = {
        document: {
          'story_uid': storyteller.userStoryUid,
          'direct_upload_url': downloadUrl,
          'upload_file_name': _file.name,
          'upload_content_type': _file.type,
          'upload_file_size': _file.size
        }
      };

      return _storytellerApiRequest('/documents', 'POST', requestData).
        then(
          function(data) {
            // success
            return data.document;
          },
          function(reason) {
            // error
            _emitError(
              'save_resource',
              { status: reason.status, message: reason.statusText }
            );

            throw new Error(
              'FileUploader#_saveResource: Could not create document (story: {0}) {1} {2} - {3}'.format(
                storyteller.userStoryUid,
                reason.status,
                reason.statusText,
                reason.responseText
              )
            );
          }
        );
    }

    function _dispatchFileDone(resource) {
      if (!_destroyed) {
        storyteller.dispatcher.dispatch({
          action: Actions.FILE_UPLOAD_DONE,
          documentId: resource.id,
          url: resource.url
        });
      }
    }

    function _waitForResourceToBeProcessed(resource) {
      var resourceId = resource.id;

      if (resource.status === 'processed') {
        _dispatchFileDone(resource);
      } else {

        var retryInterval = storyteller.config.fileUploader.checkDocumentProcessedRetryInterval || 1000;
        var retryMaxSeconds = storyteller.config.fileUploader.checkDocumentProcessedMaxRetrySeconds || 30;
        var docRequestErrorCount = 0;
        var docRequestRetryEndTime = new Date();
        docRequestRetryEndTime.setSeconds(docRequestRetryEndTime.getSeconds() + retryMaxSeconds);

        // Poll document endpoint until it is 'processed'
        _getDocInterval = setInterval(function() {

          if (new Date() > docRequestRetryEndTime) {
            _emitError(
              'get_resource',
              { message: 'Document was not processed in a reasonable amount of time' }
            );
            self.destroy();
          }

          _storytellerApiRequest('/documents/' + resourceId, 'GET').
            then(function(responseData) {
              // success
              var documentResource = responseData.document;

              if (documentResource.status === 'processed') {
                _dispatchFileDone(documentResource);
                self.destroy();
              }
            }, function(reason) {
              // error
              docRequestErrorCount++;

              if (docRequestErrorCount > 2) {
                _emitError(
                  'get_resource',
                  { status: reason.status, message: reason.statusText }
                );

                throw new Error(
                  'FileUploader#_waitForResourceToBeProcessed: Could not get document status (document: {0}, story: {1}) {2} {3} - {4}'.format(
                    resourceId,
                    storyteller.userStoryUid,
                    reason.status,
                    reason.statusText,
                    reason.responseText
                  )
                );
              }
            });
        }, retryInterval);
      }
    }

    function _storytellerApiRequest(path, requestType, requestData) {
      return Promise.resolve(
        $.ajax({
          url: _apiPrefixPath + path,
          type: requestType,
          dataType: 'json',
          headers: {
            'X-Socrata-Host': root.location.host,
            'X-CSRF-Token': storyteller.csrfToken
          },
          data: requestData
        })
      );
    }

  }

  storyteller.FileUploader = FileUploader;

})(window);

