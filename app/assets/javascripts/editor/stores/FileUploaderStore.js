import $ from 'jQuery';
import _ from 'lodash';

import Environment from '../../StorytellerEnvironment';
import StorytellerUtils from '../../StorytellerUtils';
import I18n from '../I18n';
import Actions from '../Actions';
import Constants from '../Constants';
import Store from './Store';
import { assetSelectorStore } from './AssetSelectorStore';
import { exceptionNotifier } from '../../services/ExceptionNotifier';

var MAX_FILE_SIZE_BYTES = Constants.MAX_FILE_SIZE_BYTES || (1024 * 1024 * 5);
var API_PREFIX_PATH = '/stories/api/v1';
var CODE = {
  OK: 200
};

export var STATUS = {
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
  ERRORED: 'ERRORED',
  UPLOADING: 'UPLOADING',
  PROCESSING: 'PROCESSING',
  SIGNED: 'SIGNED'
};

export var fileUploaderStore = StorytellerUtils.export(new FileUploaderStore(), 'storyteller.fileUploaderStore');
export default function FileUploaderStore() {
  _.extend(this, new Store());

  var self = this;
  var files = {};

  self.register(function(payload) {
    switch (payload.action) {
      case Actions.URL_UPLOAD:
        uploadUrl(payload);
        break;
      case Actions.FILE_UPLOAD:
        uploadFile(payload);
        break;
      case Actions.FILE_CANCEL:
        cancelFile(payload);
        break;
    }
  });

  self.fileExistsById = function(id) {
    return !_.isEmpty(files[id]);
  };

  self.fileById = function(id) {
    return _.cloneDeep(_.get(files, id, null));
  };

  self.files = function() {
    return _.cloneDeep(files);
  };

  self.filesByStatus = function(status) {
    return _.filter(self.files(), {status: status});
  };

  function cancelFile(payload) {
    StorytellerUtils.assertHasProperty(payload, 'id');
    StorytellerUtils.assert(
      self.fileExistsById(payload.id),
      StorytellerUtils.format(
        'Cannot find a file with the id, {0}.',
        payload.id
      )
    );

    files[payload.id].status = STATUS.CANCELLED;

    self._emitChange();
  }

  function completeFile(id, resource) {
    files[id].status = STATUS.COMPLETED;
    files[id].resource = resource;

    self._emitChange();
  }

  function errorFile(id, message) {
    files[id].status = STATUS.ERRORED;
    files[id].message = message;

    self._emitChange();
  }

  function progressFile(id, progress) {
    files[id].status = STATUS.UPLOADING;
    files[id].progress = progress / files[id].raw.size;

    self._emitChange();
  }

  function waitFile(id) {
    files[id].status = STATUS.PROCESSING;
    self._emitChange();
  }

  function signFile(id, destination) {
    files[id].destination = {
      contentType: destination.content_type,
      url: destination.url
    };

    self._emitChange();
  }

  function uploadFile(payload) {
    StorytellerUtils.assertHasProperties(payload, 'id', 'file');

    StorytellerUtils.assertInstanceOfAny(payload.file, File, Blob);
    StorytellerUtils.assert(_.isString(payload.file.name), 'File not valid; missing name.');
    StorytellerUtils.assert(_.isFinite(payload.file.size), 'File not valid: missing size.');
    StorytellerUtils.assert(_.isString(payload.file.type), 'File not valid: missing type.');

    StorytellerUtils.assert(
      !self.fileExistsById(payload.id),
      StorytellerUtils.format(
        'The file identifier, {0} already exists.',
        payload.id
      )
    );

    files[payload.id] = {
      id: payload.id,
      raw: payload.file,
      progress: 0,
      status: STATUS.ACKNOWLEDGED
    };

    process(files[payload.id]);
    self._emitChange();
  }

  function uploadUrl(payload) {
    StorytellerUtils.assertHasProperties(payload, 'id', 'url');

    StorytellerUtils.assert(
      !self.fileExistsById(payload.id),
      StorytellerUtils.format(
        'The file identifier, {0} already exists.',
        payload.id
      )
    );

    files[payload.id] = {
      id: payload.id,
      progress: 0,
      status: STATUS.ACKNOWLEDGED
    };

    processUrl(files[payload.id], payload.url);
    self._emitChange();
  }

  function processUrl(file, url) {
    var id = file.id;

    saveResource(id, url).
      then(function(resource) {
        if (notCancelled(id)) {
          return waitForResourceToBeProcessed(id, resource);
        } else {
          return Promise.reject();
        }
      }).
      catch(function(error) {
        var message = _.isString(error) ?
          error :
          I18n.t('editor.asset_selector.image_upload.errors.exception');

        errorFile(id, message);

        if (message instanceof Error) {
          exceptionNotifier.notify(error);
        }
      });
  }

  function process(file) {
    var id = file.id;

    getSignedUploadUrl(file).
      then(function(destination) {
        if (notCancelled(id) && hasDestination(destination)) {
          signFile(id, destination);
          return upload(id);
        } else {
          return Promise.reject();
        }
      }).
      then(function(url) {
        if (notCancelled(id)) {
          return saveResource(id, url);
        } else {
          return Promise.reject();
        }
      }).
      then(function(resource) {
        if (notCancelled(id)) {
          return waitForResourceToBeProcessed(id, resource);
        } else {
          return Promise.reject();
        }
      }).
      catch(function(error) {
        var message = _.isString(error) ?
          error :
          I18n.t('editor.asset_selector.image_upload.errors.exception');

        errorFile(id, message);

        if (message instanceof Error) {
          exceptionNotifier.notify(error);
        }
      });
  }

  function getSignedUploadUrl(file) {
    var requestData = {
      upload: { filename: file.raw.name }
    };

    return request('/uploads', 'POST', requestData).
      then(function(data) {
        return data.upload;
      });
  }

  function upload(id) {
    var file = self.fileById(id);

    var isNotValidFileSize = file.raw.size > MAX_FILE_SIZE_BYTES;
    var isNotValidImageType = !_.includes(Constants.VALID_IMAGE_TYPES, file.raw.type);
    var isNotValidFileType = !_.includes(Constants.VALID_FILE_TYPES, file.raw.type);

    if (isNotValidFileSize) {
      return Promise.reject(I18n.t('editor.asset_selector.image_upload.errors.validation_file_size'));
    } else if (isNotValidFileType && isNotValidImageType) {
      return Promise.reject(I18n.t('editor.asset_selector.image_upload.errors.validation_file_type'));
    }

    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();

      xhr.onload = function() {
        if (xhr.status === CODE.OK && notCancelled(file.id)) {
          progressFile(id, file.raw.size);
          return resolve(file.destination.url.split('?')[0]);
        } else if (cancelled(file.id)) {
          return reject(I18n.t('editor.asset_selector.image_upload.errors.cancelled'));
        } else {
          return reject(xhr.onerror());
        }
      };

      xhr.upload.onprogress = function(event) {
        if (event.lengthComputable && notCancelled(file.id)) {
          progressFile(id, event.loaded);
        }
      };

      xhr.onabort = xhr.onerror = function() {
        return new Error(
          StorytellerUtils.format(
            'Failed: {0}, {1}\n{2}',
            file.destination.url,
            parseInt(xhr.status, 10),
            xhr.statusText
          )
        );
      };

      xhr.open('PUT', file.destination.url, true);
      xhr.setRequestHeader('Content-Type', file.destination.contentType);
      xhr.send(file.raw);
    });
  }

  function saveResource(id, url) {
    var requestData;
    var file = self.fileById(id);

    var type = assetSelectorStore.getComponentType();
    var value = assetSelectorStore.getComponentValue();

    if (type === 'image' || type === 'hero' || type === 'author') {
      var cropObjectPath = type === 'author' ? 'image.crop' : 'crop';
      var crop = _.get(value, cropObjectPath, null);
      var gettyImageMatches = url.match(/\/stories\/api\/v1\/getty-images\/(.*)$/);

      requestData = {
        document: {
          'story_uid': Environment.STORY_UID,
          'direct_upload_url': url
        }
      };

      if (file.raw) {
        requestData.document.upload_file_name = file.raw.name;
        requestData.document.upload_content_type = file.raw.type;
        requestData.document.upload_file_size = file.raw.size;
      }

      if (crop) {
        requestData.document = _.merge({}, requestData.document, {
          crop_x: crop.x / 100,
          crop_y: crop.y / 100,
          crop_width: crop.width / 100,
          crop_height: crop.height / 100
        });
      }

      if (gettyImageMatches && gettyImageMatches[1]) {
        requestData.document.getty_image_id = gettyImageMatches[1];
        delete requestData.document.direct_upload_url;
      }
    } else {
      requestData = {
        document: {
          'story_uid': Environment.STORY_UID,
          'direct_upload_url': url,
          'upload_file_name': file.raw.name,
          'upload_content_type': file.raw.type,
          'upload_file_size': file.raw.size
        }
      };
    }

    return request('/documents', 'POST', requestData).
      then(function(data) {
        return data.document;
      });
  }

  function waitForResourceToBeProcessed(id, resource) {
    var resourceId = resource.id;

    return new Promise(function(resolve, reject) {
      waitFile(id);

      if (resource.status === 'processed') {
        completeFile(id, resource);
        resolve(resource);
      } else {
        var errorMessage = I18n.t('editor.asset_selector.image_upload.errors.exception');
        var retryMaxSeconds = Constants.CHECK_DOCUMENT_PROCESSED_MAX_RETRY_SECONDS;
        var docRequestRetryEndTime = new Date();

        docRequestRetryEndTime.setSeconds(docRequestRetryEndTime.getSeconds() + retryMaxSeconds);

        var queryResourceById = function() {
          var passedRetryPeriod = new Date() > docRequestRetryEndTime;

          if (passedRetryPeriod) {
            errorFile(id, I18n.t('editor.asset_selector.image_upload.errors.upload_timeout'));
            return reject();
          }

          request('/documents/' + resourceId, 'GET').
            then(function(responseData) {
              var documentResource = responseData.document;

              if (documentResource.status === 'processed') {
                completeFile(id, documentResource);
                resolve(documentResource);
              } else if (documentResource.status === 'error') {
                errorFile(id, errorMessage);
                reject();
              } else {
                setTimeout(queryResourceById, Constants.CHECK_DOCUMENT_PROCESSED_RETRY_INTERVAL);
              }
            }, function() {
              errorFile(id, errorMessage);
              reject();
            });
        };

        queryResourceById();
      }
    });
  }

  // Helpers

  function hasDestination(destination) {
    return !_.isEmpty(destination);
  }

  function notCancelled(id) {
    return !cancelled(id);
  }

  function cancelled(id) {
    var file = self.fileById(id);
    return file && file.status === STATUS.CANCELLED;
  }

  function request(url, method, data) {
    return Promise.resolve(
      $.ajax({
        url: API_PREFIX_PATH + url,
        type: method,
        dataType: 'json',
        headers: {
          'X-Socrata-Host': window.location.host,
          'X-CSRF-Token': Environment.CSRF_TOKEN
        },
        data: data
      })
    );
  }
}
