import React, { PropTypes } from 'react'; // eslint-disable-line no-unused-vars
import * as SharedTypes from '../sharedTypes';
import Upload from 'component-upload';
import * as url from 'url';
import FlashMessage from './flashMessage';
import NavigationControl from './navigationControl';
import { authenticityToken, appToken } from '../server';
import airbrake from '../airbrake';

type FileName = string

type FileId = string

type Summary
  = { // normal tabular
      headers: number,
      columns: Array<SharedTypes.SourceColumn>,
      locations: Array<{ latitude: number, longitude: number }>,
      sample: Array<Array<string>>,
    }
  | { // geo
      totalFeatureCount: number,
      layers: Array<GeoLayer>
    }

type GeoLayer = {
  name: string,
  referenceSystem: string
}

type UploadProgress
	= { type: 'InProgress', percent: number }
	| { type: 'Failed', error: string }
	| { type: 'Analyzing' }
	| { type: 'Complete', fileId: string, summary: Summary }

type FileUpload
	= { type: 'NothingSelected' }
	| { type: 'UploadInProgress', fileName: FileName, progress: UploadProgress }

function scanUrlForOperation(operation: SharedTypes.OperationName) {
  const urlAttrs = { pathname: '/imports2.txt' };
  // TODO: NBE? Blobby?
  // TODO: error handling (extension checking)
  switch (operation) {
    case 'UploadData':
      urlAttrs.query = {
        method: 'scan',
        authenticity_token: authenticityToken,
        app_token: appToken
      };
      break;
    case 'UploadGeospatial':
      urlAttrs.query = {
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
  return (dispatch) => {
    const upload = new Upload(file);
    upload.to(scanUrlForOperation(operation));
    upload.on('progress', (evt) => {
      if (evt.percent === 100) {
        dispatch(fileUploadAnalyzing());
      } else {
        dispatch(fileUploadProgress(evt.percent));
      }
    });
    upload.on('end', (xhr) => {
      let response;
      switch (xhr.status) {
        case 200:
          response = JSON.parse(xhr.responseText);
          dispatch(fileUploadComplete(response.fileId, addColumnIndicesToSummary(response.summary)));
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
    dispatch(fileUploadStart(file));
  };
}


function addColumnIndicesToSummary(summary: Summary): Summary {
  if (summary.columns) {
    return {
      ...summary,
      columns: summary.columns.map((col, idx) => ({ ...col, index: idx }))
    };
  } else {
    return summary;
  }
}


const FILE_UPLOAD_START = 'FILE_UPLOAD_START';
export function fileUploadStart(file: File) {
  return {
    type: FILE_UPLOAD_START,
    file: file
  };
}

const FILE_UPLOAD_PROGRESS = 'FILE_UPLOAD_PROGRESS';
export function fileUploadProgress(percent: number) {
  return {
    type: FILE_UPLOAD_PROGRESS,
    percent: percent
  };
}

const FILE_UPLOAD_ANALYZING = 'FILE_UPLOAD_ANALYZING';
export function fileUploadAnalyzing() {
  return {
    type: FILE_UPLOAD_ANALYZING
  };
}

export const FILE_UPLOAD_COMPLETE = 'FILE_UPLOAD_COMPLETE';
export function fileUploadComplete(fileId: FileId, summary: Summary) {
  return {
    type: FILE_UPLOAD_COMPLETE,
    fileId: fileId,
    summary: summary
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
        progress: initialUploadProgress()
      };

    case FILE_UPLOAD_PROGRESS:
      return {
        ...upload,
        progress: {
          type: 'InProgress',
          percent: action.percent
        }
      };

    case FILE_UPLOAD_ANALYZING:
      return {
        ...upload,
        progress: {
          type: 'Analyzing'
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

    default:
      return upload;
  }
}

// == Upload Progress

export function initialUploadProgress() {
  return { type: 'InProgress', percent: 0 };
}

function renderErrorMessage(fileUpload) {
  if (_.isUndefined(fileUpload) ||
      _.isUndefined(fileUpload.progress) ||
      _.isUndefined(fileUpload.progress.error)) {
    return;
  }
  return <FlashMessage flashType="error" message={fileUpload.progress.error} />;
}

export function view({ onFileUploadAction, fileUpload, operation, goToPrevious }) {
  const I18nPrefixed = I18n.screens.dataset_new.upload_file;

  function onSelectFile(event) {
    // TODO: can users deselect a file? may need an action for that
    onFileUploadAction(selectFile(event.target.files[0], operation));
  }

  const fileNameDisplay =
    _.isUndefined(fileUpload.fileName)
      ? I18nPrefixed.no_file_selected
      : fileUpload.fileName;

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
              <div className="fileUploader-upload-button">
                {I18n.plugins.fileuploader.upload_a_file}
                <input
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
                  case 'UploadData':
                    return I18nPrefixed.supported_blist;
                  case 'UploadGeospatial':
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
        onPrev={goToPrevious}
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

    default:
      console.error('unexpected progress type:', progress.type);
      return null;
  }
}
