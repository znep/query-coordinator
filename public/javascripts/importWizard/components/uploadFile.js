import React, { PropTypes } from 'react'; // eslint-disable-line no-unused-vars
import * as SharedTypes from '../sharedTypes';
import Upload from 'component-upload';
import * as url from 'url';

type FileName = string

type FileId = string

type FileUpload
	= { type: 'NothingSelected' }
	| { type: 'UploadInProgress', fileName: FileName, progress: UploadProgress }


type UploadProgress
	= { type: 'InProgress', percent: number }
	| { type: 'Failed',  error: string }
	| { type: 'Analyzing' }
	| { type: 'Complete', fileId: string, summary: Summary }


type Summary = {
  headers: number,
  columns: Array<SharedTypes.SourceColumn>,
  locations: Array<{ latitude: number, longitude: number }>,
  sample: Array<Array<string>>,
}


export function initial(): FileUpload {
  return { type: 'NothingSelected' };
}


export function selectFile(file: File) {
  return (dispatch) => {
    const urlAttrs = {
      pathname: '/imports2.txt',
      query: {
        method: 'scan'
      }
    };
    const upload = new Upload(file);
    upload.to(url.format(urlAttrs));
    upload.on('progress', (evt) => {
      console.log('progress', evt);
      if (evt.percent === 100) {
        dispatch(fileUploadAnalyzing());
      } else {
        dispatch(fileUploadProgress(evt.percent));
      }
    });
    upload.on('end', (xhr) => {
      const response = JSON.parse(xhr.responseText);
      dispatch(fileUploadComplete(response.fileId, addColumnIds(response.summary)));
    });
    upload.on('error', (evt) => {
      dispatch(fileUploadError(JSON.stringify(evt)));
    });
    dispatch(fileUploadStart(file));
  };
}


function addColumnIds(summary: Summary): Summary {
  return {
    ...summary,
    columns: summary.columns.map((column, index) => ({...column, index: index}))
  };
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


export function update(upload: FileUpload = initial(), action): FileUpload {
  switch (action.type) {
    case FILE_UPLOAD_START:
      return {
        type: 'UploadInProgress',
        fileName: action.file.name,
        progress: initialUploadProgress()
      };

    case FILE_UPLOAD_PROGRESS:
      return {
        ...upload,
        type: 'UploadInProgress',
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
          error: action.error
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


export function view(props) {
  const { onFileUploadAction, fileUpload, operation } = props;
  const I18nPrefixed = I18n.screens.dataset_new.upload_file;

  function onSelectFile(event) {
    // TODO: can users deselect a file? may need an action for that
    onFileUploadAction(selectFile(event.target.files[0]));
  }

  const fileNameDisplay =
    fileUpload.type === 'UploadInProgress'
      ? fileUpload.fileName
      : I18nPrefixed.no_file_selected;

  return (
    <div className="uploadFilePane">
      {/* TODO: should sometimes say "upload" instead of "import" (another I18n key) */}
      <p className="headline">{ I18n.screens.import_pane.headline_import }</p>
      <div className="uploadFileContainer">
        <div className="uploadFileNameWrapper">
          <input type="text" className="uploadFileName" readOnly="readonly"
                 value={ fileNameDisplay }/>
          <input type="file" onChange={ onSelectFile } />
        </div>
        { (() => {
          switch (fileUpload.type) {
            case 'NothingSelected':
              return null;

            case 'UploadInProgress':
              return renderFileUploadStatus(fileUpload.progress);
          }
        })() }
        <p className="uploadFileFormats">
          <span className="type">
            { (() => {
              switch (operation) {
                case 'UploadData':
                  return I18nPrefixed.supported_blist;
                case 'UploadGeo':
                  return I18nPrefixed.supported_shapefile;
                default:
                  return null;
              }
          })() }
          </span>
        </p>
      </div>
    </div>
  );
}

view.propTypes = {
  onFileUploadAction: PropTypes.func.isRequired,
  fileUpload: PropTypes.object.isRequired,
  operation: PropTypes.string.isRequired
};

export function renderFileUploadStatus(progress: UploadProgress) {
  function withThrobber(text) {
    return (
      <div className="uploadThrobber">
        <span className="icon"></span>
        <span className="text">{ text }</span>
      </div>
    );
  }

  switch (progress.type) {
    case 'InProgress':
      // TODO i18n
      return withThrobber(`${Math.round(progress.percent) }% uploaded`);

    case 'Failed':
      // TODO i18n
      return withThrobber(`Error uploading file: ${ progress.error }`);

    case 'Analyzing':
      return withThrobber(I18n.screens.import_pane.analyzing);

    case 'Complete':
      return null;

    default:
      console.error('unexpected progress type:', progress.type);
      return null;
  }
}
