import React, { PropTypes } from 'react'; // eslint-disable-line no-unused-vars
import * as SharedTypes from '../sharedTypes';
import Upload from 'component-upload';
import * as url from 'url';
import FlashMessage from './flashMessage';
import NavigationControl from './navigationControl';
import { authenticityToken, appToken } from '../server';
import airbrake from '../airbrake';
import {addColumnIndicesToSummary} from '../importUtils';
import format from 'stringformat';


type FileName = string

type UploadProgress
  = { type: 'InProgress', percent: number, uploader: Upload }
  | { type: 'Failed', error: string }
  | { type: 'Cancelled' }
  | { type: 'Analyzing', uploader: Upload }
  | { type: 'Complete', fileId: string, summary: SharedTypes.Summary }

type FileUpload
  = { type: 'NothingSelected' }
  | { type: 'UploadInProgress', fileName: FileName, progress: UploadProgress }

function scanUrlForOperation(datasetId: string, operation: SharedTypes.OperationName) {
  const urlAttrs = {
    pathname: '/imports2.txt',
    query: {
      saveUnderViewUid: datasetId
    }
  };
  // TODO: NBE? Blobby?
  // TODO: error handling (extension checking)
  switch (operation) {
    case 'UPLOAD_DATA':
      urlAttrs.query = {
        ...urlAttrs.query,
        method: 'scan',
        authenticity_token: authenticityToken,
        app_token: appToken
      };
      break;
    case 'UPLOAD_GEO':
      urlAttrs.query = {
        ...urlAttrs.query,
        method: 'scanShape',
        authenticity_token: authenticityToken,
        app_token: appToken
      };
      break;
    default:
      console.error('Unexpected / not implemented operation', operation);
  }
  return url.format(urlAttrs);
}


export function selectFile(file: File, operation: SharedTypes.OperationName) {
  return (dispatch, getState) => {
    const upload = new Upload(file);
    upload.to(scanUrlForOperation(getState().datasetId, operation));
    upload.on('progress', (evt) => {
      if (evt.percent === 100) {
        dispatch(fileUploadAnalyzing(upload));
      } else {
        dispatch(fileUploadProgress(evt.percent, upload));
      }
    });
    upload.on('end', (xhr) => {
      let response;
      switch (xhr.status) {
        case 200:
          response = JSON.parse(xhr.responseText);
          dispatch(fileUploadComplete(
            response.fileId,
            addColumnIndicesToSummary(response.summary),
            response.newImportSourceVersion
          ));
          break;
        case 400:
          airbrake.notify({
            error: '400 response received during upload',
            context: { component: 'UploadFile' }
          });
          response = JSON.parse(xhr.responseText);
          dispatch(fileUploadError(response.message));
          break;
        default:
          airbrake.notify({
            error: `Unexpected response received during upload: ${xhr.status}`,
            context: { component: 'UploadFile' }
          });
          dispatch(fileUploadError());
      }
    });
    upload.on('error', (err) => {
      airbrake.notify({
        error: err,
        context: { component: 'UploadFile' }
      });
      dispatch(fileUploadError());
    });
    dispatch(fileUploadStart(file, upload));
  };
}

function cancelUpload({progress}) {
  return (dispatch) => {
    if (progress && progress.uploader) {
      progress.uploader.abort();
    }
    dispatch(fileUploadCancel());
  };
}

const FILE_UPLOAD_CANCEL = 'FILE_UPLOAD_CANCEL';
function fileUploadCancel() {
  return {
    type: FILE_UPLOAD_CANCEL
  };
}

const FILE_UPLOAD_START = 'FILE_UPLOAD_START';
export function fileUploadStart(file: File, uploader) {
  return {
    type: FILE_UPLOAD_START,
    file: file,
    uploader
  };
}

const FILE_UPLOAD_PROGRESS = 'FILE_UPLOAD_PROGRESS';
export function fileUploadProgress(percent: number, uploader) {
  return {
    type: FILE_UPLOAD_PROGRESS,
    percent: percent,
    uploader
  };
}

const FILE_UPLOAD_ANALYZING = 'FILE_UPLOAD_ANALYZING';
export function fileUploadAnalyzing(uploader) {
  return {
    type: FILE_UPLOAD_ANALYZING,
    uploader
  };
}

export const FILE_UPLOAD_COMPLETE = 'FILE_UPLOAD_COMPLETE';
export function fileUploadComplete(fileId: SharedTypes.FileId, summary: SharedTypes.Summary, newImportSourceVersion: number) {
  return {
    type: FILE_UPLOAD_COMPLETE,
    fileId,
    summary,
    newImportSourceVersion
  };
}

const FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR';
export function fileUploadError(error: string) {
  return {
    type: FILE_UPLOAD_ERROR,
    error: error
  };
}

export function update(upload: FileUpload = {}, action): FileUpload {
  switch (action.type) {
    case FILE_UPLOAD_START:
      return {
        fileName: action.file.name,
        progress: initialUploadProgress(action.uploader)
      };

    case FILE_UPLOAD_PROGRESS:
      return {
        ...upload,
        progress: {
          type: 'InProgress',
          percent: action.percent,
          uploader: action.uploader
        }
      };

    case FILE_UPLOAD_ANALYZING:
      return {
        ...upload,
        progress: {
          type: 'Analyzing',
          uploader: action.uploader
        }
      };

    case FILE_UPLOAD_COMPLETE:
      return {
        ...upload,
        progress: {
          type: 'Complete',
          fileId: action.fileId,
          summary: action.summary
        }
      };

    case FILE_UPLOAD_ERROR:
      return {
        ...upload,
        progress: {
          type: 'Failed',
          error: _.isUndefined(action.error)
            ? I18n.screens.import_pane.problem_importing
            : action.error
        }
      };

    case FILE_UPLOAD_CANCEL:
      return {
        ...upload,
        fileName: null,
        progress: {
          type: 'Cancelled'
        }
      };

    default:
      return upload;
  }
}

// == Upload Progress

export function initialUploadProgress(uploader) {
  return { type: 'InProgress', percent: 0, uploader };
}

function renderErrorMessage(fileUpload) {
  if (_.isUndefined(fileUpload) ||
      _.isUndefined(fileUpload.progress) ||
      _.isUndefined(fileUpload.progress.error)) {
    return;
  }

  var display = fileUpload.progress.error;
  try {
    // core wraps errors from upstream services...so...double parse!
    const {error: translatable} = JSON.parse(display);
    if (translatable) {
      const template = I18n.screens.dataset_new.errors[translatable.reason];
      display = format(template, translatable.params);
    }
  } catch (e) {
    // we have a million services that don't return errors like this
  }

  return <FlashMessage flashType="error" message={display} />;
}

export function view({ onFileUploadAction, fileUpload, operation, goToPrevious }) {
  const I18nPrefixed = I18n.screens.dataset_new.upload_file;

  function isInProgress() {
    return _.get(fileUpload, 'progress.type', 'nope') === 'InProgress';
  }

  function onSelectFile(event) {
    // TODO: can users deselect a file? may need an action for that
    if ( event.target.files.length > 0 ) {
      onFileUploadAction(selectFile(event.target.files[0], operation));
    }
  }

  function onClickPrevious() {
    onFileUploadAction(cancelUpload(fileUpload));
    goToPrevious();
  }

  const fileNameDisplay =
    _.isUndefined(fileUpload.fileName)
      ? I18nPrefixed.no_file_selected
      : fileUpload.fileName;

  const uploadButtonState = ['fileUploader-upload-button'];
  if (isInProgress()) {
    uploadButtonState.push('disabled');
  }

  return (
    <div>
      <div className="uploadFilePane">
        {renderErrorMessage(fileUpload)}
        {/* TODO: should sometimes say "upload" instead of "import" (another I18n key) */}
        <p className="headline">{I18n.screens.import_pane.headline_import}</p>
        <div className="uploadFileContainer">
          <div className="uploadFileNameWrapper">
            <input
              type="text"
              className="uploadFileName valid"
              readOnly="readonly"
              value={fileNameDisplay} />
          </div>
          <div
            className="buttonWrapper uploadFileButtonWrapper">
            <div className="fileUploader-uploader" >
              <div className={uploadButtonState.join(' ')}>
                {I18n.plugins.fileuploader.upload_a_file}
                <input
                  disabled={isInProgress()}
                  type="file"
                  name="file"
                  onChange={onSelectFile} />
              </div>
            </div>
          </div>
          {/* TODO: help text when things go wrong */}
          {(() => {
            if (!_.isUndefined(fileUpload.progress) &&
                fileUpload.progress !== 'Failed') {
              return renderFileUploadStatus(fileUpload.progress);
            }
          })()}

          <p className="uploadFileFormats blist">
            <span className="type type-blist">
              {(() => {
                switch (operation) {
                  case 'UPLOAD_DATA':
                    return I18nPrefixed.supported_blist;
                  case 'UPLOAD_GEO':
                    return I18nPrefixed.supported_shapefile;
                  default:
                    console.error('unknown operation', operation);
                    return null;
                }
              })()}
            </span>
          </p>
        </div>
      </div>
      <NavigationControl
        onPrev={onClickPrevious}
        cancelLink="/profile" />
    </div>
  );
}

view.propTypes = {
  onFileUploadAction: PropTypes.func.isRequired,
  fileUpload: PropTypes.object.isRequired,
  operation: PropTypes.string.isRequired,
  goToPrevious: PropTypes.func.isRequired
};

export function renderFileUploadStatus(progress: UploadProgress) {
  function withThrobber(text) {
    return (
      <div className="uploadThrobber">
        <span className="icon"></span>
        <span className="text">{text}</span>
      </div>
    );
  }

  switch (progress.type) {
    case 'InProgress':
      // TODO i18n
      return withThrobber(`${Math.round(progress.percent)}% uploaded`);

    case 'Failed':
      return null;

    case 'Analyzing':
      return withThrobber(I18n.screens.import_pane.analyzing);

    case 'Complete':
      return null;

    case 'Cancelled':
      return null;

    default:
      console.error('unexpected progress type:', progress.type);
      return null;
  }
}
