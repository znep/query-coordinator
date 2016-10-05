import React, { PropTypes } from 'react';

import * as SelectType from './components/selectType';
import * as Metadata from './components/metadata';
import * as UploadFile from './components/uploadFile';
import * as DownloadFile from './components/downloadFile';
import * as ConnectToEsri from './components/connectToEsri';
import * as ImportColumns from './components/importColumns';
import * as Importing from './components/importing';
import * as Working from './components/working';
import * as Finish from './components/finish';
import * as Server from './server';
import * as ImportShapefile from './components/importShapefile';
import * as SharedTypes from './sharedTypes';
import * as SelectUploadType from './components/selectUploadType';
import * as SaveState from './saveState';
import * as ImportStatus from './importStatus';
import enabledModules from 'enabledModules';

type Layer = {
  name: string
}

type PageName
  = 'SelectType'
  | 'SelectUploadType'
  | 'UploadFile'
  | 'DownloadFile'
  | 'ImportColumns'
  | 'ImportShapefile'
  | 'Metadata'
  // can't re-enter to the below pages
  | 'Working'
  | 'Importing'
  | 'Finish'


type Navigation = {
  operation: SharedTypes.OperationName,
  page: PageName,
  path: Array<PageName>
}


type NewDatasetModel = {
  datasetId: string,                  // this should never change
  lastSavedVersion: string,
  navigation: Navigation,
  upload: UploadFile.FileUpload,
  download: DownloadFile.FileDownload,
  connectToEsri: ConnectToEsri.EsriState,
  transform: ImportColumns.Transform,               // only used in UPLOAD_DATA operation
  layers: Array<Layer>,               // only used in UploadGeo operation
  metadata: Metadata.DatasetMetadata,
  importStatus: Server.ImportStatus
}


function initialNavigation() {
  return {
    page: 'SelectType',
    path: [],
    operation: null
  };
}

function navigationGivenISS(navigation, importStatus) {
  var page = ImportStatus.isInProgress(importStatus) ? 'Importing' : navigation.page;
  page = ImportStatus.isComplete(importStatus) ? 'Finish' : page;
  page = ImportStatus.hasFailed(importStatus) ? 'Metadata' : page;
  return {
    ...navigation,
    page
  };
}

export function initialNewDatasetModel(initialView, importSource: SaveState.ImportSource, issActivities): NewDatasetModel {
  // ImportStatus is special; it's stored in ISS and the
  // importStatus in the redux state gets populated from that
  const importStatus = ImportStatus.initialImportStatus(issActivities);
  if (importSource && importSource.state) {
    try {
      var state = JSON.parse(importSource.state);

      // Metadata is special; it's stored on the view and the
      // metadata in the view takes precedence over whatever is in the
      // redux state
      state.metadata = initialMetadata(initialView);
      state.importStatus = importStatus;
      state.lastSavedVersion = importSource.version;

      // To determine the actual page to be at, we need the current navigation state
      // in addition to the current import's status. If the ISS event says the import
      // is running or is complete
      state.navigation = navigationGivenISS(state.navigation, state.importStatus);
      return state;
    } catch (e) {
      console.error('Failed to parse saved state!', e);
    }
  }

  const initial = {
    datasetId: initialView.id,
    lastSavedVersion: 0,
    navigation: initialNavigation(),
    upload: {},
    download: {},
    connectToEsri: {},
    transform: null,
    layers: null,
    metadata: initialMetadata(initialView),
    importStatus: importStatus
  };
  return initial;
}

function initialMetadata(initialView) {
  if (_.has(initialView, 'metadata')) {
    return Server.coreViewToModel(initialView);
  } else {
    return Metadata.emptyForName(initialView.name);
  }
}

// actions
const CHOOSE_OPERATION = 'CHOOSE_OPERATION';
export function chooseOperation(name: SharedTypes.OperationName) {
  return {
    type: CHOOSE_OPERATION,
    name: name
  };
}

const GO_TO_PAGE = 'GO_TO_PAGE';
export function goToPage(page) {
  return {
    type: GO_TO_PAGE,
    page
  };
}

const GO_TO_PREVIOUS_PAGE = 'GO_TO_PREVIOUS_PAGE';
export function goToPreviousPage(page) {
  return {
    type: GO_TO_PREVIOUS_PAGE,
    page
  };
}

const GO_TO_PREVIOUS = 'GO_TO_PREVIOUS';
export function goToPrevious() {
  return {
    type: GO_TO_PREVIOUS
  };
}

export function updateNavigation(navigation: Navigation = initialNavigation, action): Navigation {
  let nextPage = navigation.page;
  switch (action.type) {
    case CHOOSE_OPERATION:
      switch (action.name) {
        case 'UPLOAD_DATA':
          nextPage = 'SelectUploadType';
          break;
        case 'UPLOAD_BLOB':
        case 'UPLOAD_GEO':
          nextPage = 'UploadFile'; // TODO: select upload type
          break;
        case 'CONNECT_TO_ESRI': // TODO what is this actually supposed to go to?
          nextPage = 'ConnectToEsri';
          break;
        case 'LINK_EXTERNAL':
        case 'CREATE_FROM_SCRATCH':
          nextPage = 'Metadata';
          break;
        default:
          console.error('invalid operation name:', action.name);
      }
      return {
        operation: action.name,
        page: nextPage,
        path: [...navigation.path, navigation.page]
      };

    case UploadFile.FILE_UPLOAD_COMPLETE:
      switch (navigation.operation) {
        case 'UPLOAD_DATA':
          nextPage = 'ImportColumns';
          break;
        case 'UPLOAD_GEO':
          nextPage = 'ImportShapefile';
          break;
        case 'UPLOAD_BLOB':
          nextPage = 'Metadata';
          break;
        default:
          console.error('invalid action FILE_UPLOAD_COMPLETE for operation:', navigation.operation);
      }
      return {
        ...navigation,
        page: nextPage,
        path: [...navigation.path, navigation.page]
      };
    case DownloadFile.FILE_DOWNLOAD_COMPLETE:
      return {
        ...navigation,
        page: 'ImportDownloaded',
        path: [...navigation.path, navigation.page]
      };
    case GO_TO_PAGE:
      return {
        ...navigation,
        page: action.page,
        path: [...navigation.path, navigation.page]
      };
    case GO_TO_PREVIOUS_PAGE: {
      const idx = navigation.path.indexOf(action.page);
      if (idx !== -1) {
        return {
          ...navigation,
          page: action.page,
          path: navigation.path.slice(0, idx)
        };
      } else {
        console.error('GO_TO_PREVIOUS_PAGE called with invalid page', action.page);
        return navigation;
      }
    }
    case GO_TO_PREVIOUS:
      return {
        ...navigation,
        page: navigation.path[navigation.path.length - 1],
        path: navigation.path.slice(0, -1)
      };

    default:
      return navigation;
  }
}


// view

export function view({ state, dispatch }) {
  return (
    <div className="contentBox fixedWidth" id="reactWizard">
      <h1>{I18n.screens.dataset_new.first_page.header}</h1>
      <div className="newDatasetWizard wizard" aria-live="polite">
        {(() => {
          // only used by SelectType case, but ESLint won't let me put it there
          const onChooseOperation = (operationName) => {
            return () => {
              dispatch(chooseOperation(operationName));
              dispatch(SaveState.save());
            };
          };

          const onPage = (page) => {
            dispatch(goToPage(page));
            dispatch(SaveState.save());
          };

          const onPrevious = () => {
            dispatch(goToPrevious());
            dispatch(SaveState.save());
          };

          switch (state.navigation.page) {
            case 'SelectType':
              return (
                <SelectType.view
                  enabledModules={enabledModules}
                  currentDomainMemberCurrentUser
                  onChooseOperation={onChooseOperation} />
              );

            case 'SelectUploadType':
              return (
                <SelectUploadType.view
                  chooseDataSource={onPage}
                  goToPrevious={onPrevious} />
              );

            case 'UploadFile':
              return (
                <UploadFile.view
                  dispatch={dispatch}
                  fileUpload={state.upload}
                  operation={state.navigation.operation}
                  goToPrevious={onPrevious} />
              );

            case 'DownloadFile':
              return (
                <DownloadFile.view
                  onFileDownloadAction={dispatch}
                  fileDownload={state.download}
                  operation={state.navigation.operation}
                  goToPrevious={onPrevious} />
              );
            case 'ConnectToEsri':
              return (
                <ConnectToEsri.view
                  goToPrevious={onPrevious}
                  connectToEsri={state.connectToEsri}
                  goToPage={onPage}
                  dispatch={dispatch} />
              );

            case 'ImportColumns':
              // TODO: assert validity of fileUpload
              return (
                <ImportColumns.view
                  transform={state.transform}
                  fileName={(() => {
                    if (!_.isUndefined(state.upload.fileName)) {
                      return state.upload.fileName;
                    } else if (!_.isUndefined(state.download.fileName)) {
                      return state.download.fileName;
                    } else {
                      console.error('Error: no fileName found', state);
                    }
                  })()}
                  sourceColumns={state.upload.progress.summary.columns}
                  dispatch={dispatch}
                  goToPage={onPage}
                  goToPrevious={onPrevious} />
              );
            case 'ImportDownloaded':
              return (
                <ImportColumns.view
                  transform={state.transform}
                  fileName={state.download.fileName}
                  sourceColumns={state.download.summary.columns}
                  dispatch={dispatch}
                  goToPage={onPage}
                  goToPrevious={onPrevious} />
              );
            case 'ImportShapefile':
              return (
                <ImportShapefile.view
                  layers={state.layers}
                  fileName={state.upload.fileName}
                  dispatch={dispatch}
                  goToPage={onPage}
                  goToPrevious={onPrevious} />
              );

            case 'Metadata':
              return (
                <Metadata.view
                  metadata={state.metadata}
                  onMetadataAction={dispatch}
                  operation={state.navigation.operation}
                  importError={state.importStatus.error}
                  goToPrevious={onPrevious} />
              );

            case 'Working':
              return <Working.view />;

            case 'Importing':
              return (
                <Importing.view
                  importStatus={state.importStatus}
                  operation={state.navigation.operation}
                  onNotifyMe={() => dispatch(Server.addNotificationInterest())} />
              );

            case 'Finish':
              return (
                <Finish.view
                  datasetId={state.datasetId} />
              );

            default:
              console.error('Unknown page', state.navigation.page);

          }
        })()}
      </div>
    </div>
  );
}

view.propTypes = {
  state: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
};
