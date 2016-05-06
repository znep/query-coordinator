import $ from 'jQuery';
import _ from 'lodash';

import Environment from '../StorytellerEnvironment';
import StorytellerUtils from '../StorytellerUtils';
import Actions from './Actions';
import Constants from './Constants';
import { dispatcher } from './Dispatcher';
import { exceptionNotifier } from '../services/ExceptionNotifier';

export var fileUploader = StorytellerUtils.export(new FileUploader(), 'storyteller.fileUploader');
export default function FileUploader() {

  var _apiPrefixPath = '/stories/api/v1';

  var _cancelled = false;
  var _uploadedPercent;
  var _file;
  var _getDocInterval = null;
  var _xhr = null;

  var validFileTypes = [ /image\/.*/, /text\/html/ ];
  var options = {};

  var self = this;

  /**
   * Uploads a file to the storyteller app.
   *
   * Emits actions:
   *   FILE_UPLOAD_PROGRESS
   *   FILE_UPLOAD_ERROR
   *   FILE_UPLOAD_DONE
   *
   * These actions can be customized using options `progressAction`,
   * `errorAction`, and `doneAction` * if you need to dispatch
   * different actions instead.
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
   * @param {Object} opts - options for overriding actions
   */
  this.upload = function(file, opts) {
    $.extend(options, opts || {});

    StorytellerUtils.assert(!_.isUndefined(file.name), 'File not valid: missing name.');
    StorytellerUtils.assert(!_.isUndefined(file.size), 'File not valid: missing size.');
    StorytellerUtils.assert(!_.isUndefined(file.type), 'File not valid: missing type.');

    var maxFileSizeBytes = Constants.MAX_FILE_SIZE_BYTES || (1024 * 1024 * 5);

    _file = file;

    if (_file.size > maxFileSizeBytes) {
      _emitError('validation_file_size', { message: 'File size too large' });
      return;
    }

    var isValidFileType = _.some(_.invoke(validFileTypes, 'test', _file.type));
    if (!isValidFileType) {
      _emitError('validation_file_type', { message: 'Invalid file type.' });
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
        exceptionNotifier.notify(error);
        self.cancel();
      });
  };

  /**
   * Aborts uploads in progress and any intervals we have set to poll document
   * processing progress.
   */
  this.cancel = function() {
    _cancelled = true;

    if (_xhr !== null) {
      _xhr.abort();
    }

    if (_getDocInterval !== null) {
      clearInterval(_getDocInterval);
    }

    _uploadedPercent = null;
    _file = null;
    _getDocInterval = null;
    _xhr = null;
  };

  // Private methods

  function _cancelled() {

    // If the _file is null, either we cancelled
    // or there isn't an upload happening right now.
    return _.isNull(_file);
  }

  function _emitProgress(progressBytes) {
    if (!_cancelled) {
      _uploadedPercent = progressBytes / _file.size;

      dispatcher.dispatch({
        action: options.progressAction || Actions.FILE_UPLOAD_PROGRESS,
        percentLoaded: _uploadedPercent
      });
    }
  }

  function _emitError(errorStep, reason) {
    var errorReportingLabel = 'FileUploader#_emitError';
    dispatcher.dispatch({
      action: options.errorAction || Actions.FILE_UPLOAD_ERROR,
      error: {
        step: errorStep,
        reason: reason
      },
      errorReporting: {
        message: StorytellerUtils.format(
          '{0}: {1} - {2} (story: {3}, status: {4})',
          errorReportingLabel,
          errorStep,
          reason.message,
          Environment.STORY_UID,
          reason.status || ''
        ),
        label: errorReportingLabel
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
            StorytellerUtils.format(
              'FileUploader#_getSignedUploadUrl: Could not create upload (story: {0}, filename: {1}) {2} {3} - {4}',
              Environment.STORY_UID,
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
    StorytellerUtils.assertIsOneOfTypes(uploadUrl, 'string');
    StorytellerUtils.assertIsOneOfTypes(contentType, 'string');

    return new Promise(function(resolve, reject) {
      _xhr = new XMLHttpRequest();

      function onFail() {
        if (!_cancelled) {
          _emitError(
            'upload_file',
            { status: parseInt(_xhr.status, 10), message: _xhr.statusText }
          );
          reject(
            new Error(
              StorytellerUtils.format('Failed to upload file to {0}', uploadUrl)
            )
          );
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

      if (!_cancelled) {
        _xhr.send(_file instanceof File ? _file : _file.body);
      }
    });
  }

  function _saveResource(downloadUrl) {
    var requestData = {
      document: {
        'story_uid': Environment.STORY_UID,
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
            StorytellerUtils.format(
              'FileUploader#_saveResource: Could not create document (story: {0}) {1} {2} - {3}',
              Environment.STORY_UID,
              reason.status,
              reason.statusText,
              reason.responseText
            )
          );
        }
      );
  }

  function _dispatchFileDone(resource) {
    if (!_cancelled) {
      dispatcher.dispatch({
        action: options.doneAction || Actions.FILE_UPLOAD_DONE,
        documentId: resource.id,
        url: resource.url
      });
    }
  }

  function _waitForResourceToBeProcessed(resource) {
    var resourceId = resource.id;

    if (resource.status === 'processed') {
      _dispatchFileDone(resource);
      self.cancel();
    } else {

      var retryInterval = Constants.CHECK_DOCUMENT_PROCESSED_RETRY_INTERVAL || 1000;
      var retryMaxSeconds = Constants.CHECK_DOCUMENT_PROCESSED_MAX_RETRY_SECONDS || 30;
      var docRequestRetryEndTime = new Date();
      docRequestRetryEndTime.setSeconds(docRequestRetryEndTime.getSeconds() + retryMaxSeconds);

      // Poll document endpoint until it is 'processed'
      var queryResourceById = function() {

        if (new Date() > docRequestRetryEndTime) {
          _emitError(
            'get_resource',
            { message: 'Document was not processed in a reasonable amount of time' }
          );
          self.cancel();
        }

        _storytellerApiRequest('/documents/' + resourceId, 'GET').
          then(function(responseData) {
            // success
            var documentResource = responseData.document;

            if (documentResource.status === 'processed') {
              _dispatchFileDone(documentResource);
              self.cancel();
            } else {
              setTimeout(queryResourceById, retryInterval);
            }
          }, function(reason) {
            _emitError(
              'get_resource',
              { status: reason.status, message: reason.statusText }
            );

            throw new Error(
              StorytellerUtils.format(
                'FileUploader#_waitForResourceToBeProcessed: Could not get document status (document: {0}, story: {1}) {2} {3} - {4}',
                resourceId,
                Environment.STORY_UID,
                reason.status,
                reason.statusText,
                reason.responseText
              )
            );
          }).catch(function() {
            self.cancel();
          });
      };

      queryResourceById();
    }
  }

  function _storytellerApiRequest(path, requestType, requestData) {
    return Promise.resolve(
      $.ajax({
        url: _apiPrefixPath + path,
        type: requestType,
        dataType: 'json',
        headers: {
          'X-Socrata-Host': window.location.host,
          'X-CSRF-Token': Environment.CSRF_TOKEN
        },
        data: requestData
      })
    );
  }
}
