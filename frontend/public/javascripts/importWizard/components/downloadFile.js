import React, { PropTypes } from 'react'; // eslint-disable-line no-unused-vars
import * as SharedTypes from '../sharedTypes';
import { FlashMessage } from './flashMessage';
import NavigationControl from './navigationControl';
import formurlencoded from 'form-urlencoded';
import {socrataFetch, authenticityToken, appToken} from '../server';
// import airbrake from '../airbrake';
import {addColumnIndicesToSummary} from '../importUtils';
import * as SaveState from '../saveState';

type FileUrl = string;

type FileDownload
  = { type: 'NothingSelected' }
  | { type: 'NotStarted', url: FileUrl }
  | { type: 'Started', url: FileUrl, fileName: string }
  | { type: 'InProgress', url: FileUrl, message: string }
  | { type: 'Cancelled' }
  | { type: 'Failed', error: string }
  | { type: 'Complete', url: FileUrl, fileId: string, summary: SharedTypes.Summary };


export function renderErrorMessage(fileDownload) {
  if (!fileDownload.error) return;
  return (
    <FlashMessage flashType="error">
      {fileDownload.error}
    </FlashMessage>
  );
}


const FILE_DOWNLOAD_CANCEL = 'FILE_DOWNLOAD_CANCEL';
function fileDownloadCancel() {
  return {
    type: FILE_DOWNLOAD_CANCEL
  };
}

export const FILE_DOWNLOAD_START = 'FILE_DOWNLOAD_START';
function fileDownloadStart() {
  return {
    type: FILE_DOWNLOAD_START
  };
}

export const FILE_DOWNLOAD_PROGRESS = 'FILE_DOWNLOAD_PROGRESS';
function fileDownloadProgress(message: string) {
  return {
    type: FILE_DOWNLOAD_PROGRESS,
    message
  };
}

export const FILE_DOWNLOAD_ERROR = 'FILE_DOWNLOAD_ERROR';
function fileDownloadError(error: string = I18n.screens.import_pane.unknown_error) {
  return {
    type: FILE_DOWNLOAD_ERROR,
    error
  };
}

export const FILE_DOWNLOAD_COMPLETE = 'FILE_DOWNLOAD_COMPLETE';
function fileDownloadComplete(fileId: SharedTypes.FileId, summary: SharedTypes.Summary) {
  return {
    type: FILE_DOWNLOAD_COMPLETE,
    fileId,
    summary
  };
}


const POLL_INTERVAL = 1000;
function pollURL(resp) {
  return (dispatch, getState) => {
    const poll = () => {
      socrataFetch(`/api/imports2.json?method=scanUrl&ticket=${resp.ticket}`, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'X-CSRF-Token': authenticityToken,
          'X-App-Token': appToken,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).then((result) => {
        if (isCancelled(getState())) {
          return;
        }

        switch (result.status) {
          case 202:
            setTimeout(poll, POLL_INTERVAL);
            return result.json().then((response) => {
              dispatch(fileDownloadProgress(response.details.message));
            });
          case 200:
            return result.json().then((response) => {
              const summary = addColumnIndicesToSummary(response.summary);
              dispatch(fileDownloadComplete(response.fileId, summary));
              dispatch(SaveState.save());
            });
          default:
            result.json().then((response) => {
              dispatch(fileDownloadError(response.message));
            });
        }
      });
    };

    dispatch(fileDownloadProgress(resp.details.message));
    poll();
  };
}

export function scanURL(url) {
  return (dispatch, getState) => {
    dispatch(fileDownloadStart());
    socrataFetch(`/api/imports2.json?method=scanUrl&saveUnderViewUid=${getState().datasetId}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formurlencoded({
        url
      })
    }).then((result) => {
      if (isCancelled(getState())) {
        return;
      }


      switch (result.status) {
        case 202:
          return result.json().then((resp) => {
            dispatch(pollURL(resp));
          });
        case 200:
          return result.json().then((resp) => {
            const summary = addColumnIndicesToSummary(resp.summary);
            dispatch(fileDownloadComplete(resp.fileId, summary));
            dispatch(SaveState.save());
          });
        default:
          return result.json().then((resp) => {
            dispatch(fileDownloadError(resp.message));
          });
      }
    });
  };
}

function isCancelled(state) {
  return state.download.type === 'Cancelled';
}


const URL_UPDATE = 'URL_UPDATE';
export function urlUpdate(url: FileUrl) {
  return {
    type: URL_UPDATE,
    url: url
  };
}

export function update(download: FileDownload = {}, action): FileDownload {
  switch (action.type) {
    case URL_UPDATE:
      return {
        ...download,
        type: 'NotStarted',
        url: action.url,
        fileName: _.last(action.url.split('/'))
      };
    case FILE_DOWNLOAD_START:
      return {
        ...download,
        error: null,
        type: 'Started'
      };
    case FILE_DOWNLOAD_PROGRESS:
      return {
        ...download,
        type: 'InProgress',
        message: action.message
      };

    // This is a string because of circular dependencies.
    // When a file upload completes, we want to wipe out the download
    // state, because we're not doing a download anymore
    case 'FILE_UPLOAD_COMPLETE':
      return {};
    case FILE_DOWNLOAD_COMPLETE:
      return {
        ...download,
        type: 'Complete',
        url: download.url,
        fileId: action.fileId,
        summary: action.summary,
        fileName: download.fileName
      };
    case FILE_DOWNLOAD_ERROR:
      return {
        ...download,
        type: 'Failed',
        error: _.isUndefined(action.error) || action.error === 'Internal error'
          ? I18n.screens.import_pane.problem_importing
          : action.error
      };
    case FILE_DOWNLOAD_CANCEL:
      return {
        ...download,
        url: null,
        fileName: null,
        type: 'Cancelled'
      };
    default:
      return download;
  }
}


const I18nPrefixed = I18n.screens.dataset_new.crossload;


function loader(fileDownload) {
  if (fileDownload.type === 'Started' || fileDownload.type === 'InProgress') {
    return (
      <div className="uploadThrobber">
        <span className="icon"></span>
        <span className="text">{I18nPrefixed.downloading}</span>
        <br></br>
        <p>{fileDownload.message}</p>
      </div>
    );
  }
}

export function view({ onFileDownloadAction, fileDownload, goToPrevious }) {

  function onDoneTyping(event) {
    onFileDownloadAction(urlUpdate(event.target.value));
  }

  function onImportClicked() {
    onFileDownloadAction(scanURL(fileDownload.url));
  }

  function onPreviousClicked() {
    onFileDownloadAction(fileDownloadCancel());
    goToPrevious();
  }

  return (
    <div>
      <div className="crossloadFilePane">
        {renderErrorMessage(fileDownload)}
        {/* TODO: should sometimes say "upload" instead of "import" (another I18n key) */}
        <p className="headline">{I18nPrefixed.headline}</p>

        <div className="crossloadUrlContainer">
          <div className="crossloadUrlWrapper">
            <input
              type="text"
              name="crossload_url"
              className="crossloadUrl required textPrompt prompt"
              title="{I18nPrefixed.url_prompt}"
              onBlur={onDoneTyping} />
          </div>
          <div className="crossloadUrlButtonWrapper">
            <a
              className="button crossloadUrlButton"
              onClick={onImportClicked} >
              {I18nPrefixed.import}
            </a>
          </div>
          {loader(fileDownload)}
          <p className="uploadFileFormats">
            {I18nPrefixed.supported}
          </p>
          <div className="importErrorHelpText">
            {I18n.screens.dataset_new.import_help}
          </div>
        </div>
      </div>
      <NavigationControl
        onPrev={onPreviousClicked}
        cancelLink="/profile" />
    </div>
  );
}

view.propTypes = {
  onFileDownloadAction: PropTypes.func.isRequired,
  fileDownload: PropTypes.object.isRequired,
  goToPrevious: PropTypes.func.isRequired
};
