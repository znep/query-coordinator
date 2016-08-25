import React, { PropTypes } from 'react';

import * as SelectType from './components/selectType';
import * as Metadata from './components/metadata';
import * as UploadFile from './components/uploadFile';
import * as DownloadFile from './components/downloadFile';
import * as ImportColumns from './components/importColumns';
import * as Importing from './components/importing';
import * as Working from './components/working';
import * as Finish from './components/finish';
import * as Server from './server';
import * as ImportShapefile from './components/importShapefile';
import * as SharedTypes from './sharedTypes';
import * as SelectUploadType from './components/selectUploadType';
import * as SaveState from './saveState';
import {addColumnIndicesToSummary} from './importUtils';

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
  transform: ImportColumns.Transform,               // only used in UPLOAD_DATA operation
  layers: Array<Layer>,               // only used in UploadGeo operation
  metadata: Metadata.DatasetMetadata,
  importStatus: Server.ImportStatus
}

const initialNavigation: Navigation = {
  page: 'SelectType',
  path: [],
  operation: null // will be filled in when we click something on the first screen
};


export function initialNewDatasetModel(initialView, importSource: SaveState.ImportSource): NewDatasetModel {
  const initial = {
    datasetId: initialView.id,
    lastSavedVersion: _.get(importSource, 'version', null),
    navigation: initialNavigation,
    upload: {},
    download: {},
    transform: null,
    layers: null,
    metadata: initialMetadata(initialView),
    importStatus: Server.initialImportStatus()
  };
  const rawOperation = _.get(importSource, 'importMode', null);
  const operation = rawOperation ? rawOperation.toUpperCase() : null;
  switch (operation) {
    case 'CREATE_FROM_SCRATCH':
      return {
        ...initial,
        navigation: {
          operation: operation,
          path: ['SelectType'],
          page: 'Metadata'
        }
      };

    case 'UPLOAD_DATA':
      if (importSource.scanResults) {
        const sourceColumnsWithIndices = addColumnIndicesToSummary(importSource.scanResults);
        const defaultTranslation = ImportColumns.initialTranslation(sourceColumnsWithIndices);
        const resultColumns = _.get(importSource, 'translation.content.columns', defaultTranslation);
        const resultColumnsWithTranslations = resultColumns.map((resultColumn) => ({
          ...resultColumn,
          transforms: _.defaultTo(resultColumn.transforms, [])
        }));
        return {
          ...initial,
          navigation: {
            operation: operation,
            path: ['SelectType', 'SelectUploadType', 'UploadFile'],
            page: 'ImportColumns'
          },
          upload: {
            fileName: importSource.fileName,
            progress: {
              type: 'Complete',
              fileId: importSource.fileId,
              summary: sourceColumnsWithIndices
            }
          },
          transform: {
            defaultColumns: defaultTranslation,
            columns: resultColumnsWithTranslations,
            numHeaders: _.get(importSource, 'translation.content.numHeaders', importSource.scanResults.headers),
            sample: importSource.scanResults.sample
          }
        };
      } else {
        return {
          ...initial,
          navigation: {
            operation: operation,
            path: ['SelectType'],
            page: 'SelectUploadType'
          }
        };
      }

    case null:
      return initial;

    default:
      console.log('trying to reenter to', operation);
      return initial;
  }
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
  return (dispatch, getState) => {
    const version = getState().lastSavedVersion;
    const datasetId = getState().datasetId;
    dispatch({
      type: CHOOSE_OPERATION,
      name: name
    });
    SaveState.saveOperation(datasetId, version, name).then((newImportSource) => {
      dispatch(SaveState.stateSaved(newImportSource));
    }).catch(() => {
      console.error('already airbraked');
    });
  };
}


const GO_TO_PAGE = 'GO_TO_PAGE';
export function goToPage(page) {
  return {
    type: GO_TO_PAGE,
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
          const onChooseOperation = (operationName) => (
            () => {
              dispatch(chooseOperation(operationName));
            }
          );

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
                  goToPage={(page) => dispatch(goToPage(page))}
                  goToPrevious={() => dispatch(goToPrevious())} />
              );

            case 'UploadFile':
              return (
                <UploadFile.view
                  onFileUploadAction={dispatch}
                  fileUpload={state.upload}
                  operation={state.navigation.operation}
                  goToPrevious={() => dispatch(goToPrevious())} />
              );

            case 'DownloadFile':
              return (
                <DownloadFile.view
                  onFileDownloadAction={dispatch}
                  fileDownload={state.download}
                  operation={state.navigation.operation}
                  goToPrevious={() => dispatch(goToPrevious())} />
              );

            case 'ImportColumns':
              // TODO: assert validity of fileUpload
              return (
                <ImportColumns.view
                  transform={state.transform}
                  fileName={state.upload.fileName}
                  sourceColumns={state.upload.progress.summary.columns}
                  dispatch={dispatch}
                  goToPage={(page) => dispatch(goToPage(page))}
                  goToPrevious={() => dispatch(goToPrevious())} />
              );
            case 'ImportDownloaded':
              return (
                <ImportColumns.view
                  transform={state.transform}
                  fileName={state.download.fileName}
                  sourceColumns={state.download.summary.columns}
                  dispatch={dispatch}
                  goToPage={(page) => dispatch(goToPage(page))}
                  goToPrevious={() => dispatch(goToPrevious())} />
              );
            case 'ImportShapefile':
              return (
                <ImportShapefile.view
                  layers={state.layers}
                  fileName={state.upload.fileName}
                  dispatch={dispatch}
                  goToPage={(page) => dispatch(goToPage(page))}
                  goToPrevious={() => dispatch(goToPrevious())} />
              );

            case 'Metadata':
              return (
                <Metadata.view
                  metadata={state.metadata}
                  onMetadataAction={dispatch}
                  operation={state.navigation.operation}
                  importError={state.importStatus.error}
                  goToPrevious={() => dispatch(goToPrevious())} />
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
