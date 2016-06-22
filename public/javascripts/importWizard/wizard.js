import React, { PropTypes } from 'react';
import * as SelectType from './components/selectType';
import * as Metadata from './components/metadata';
import * as UploadFile from './components/uploadFile';
import * as ImportColumns from './components/importColumns';
import * as Importing from './components/importing';
import * as Working from './components/working';
import * as Finish from './components/finish';
import * as Server from './server';
import * as ImportShapefile from './components/importShapefile';
import * as SharedTypes from './sharedTypes';
import * as SelectUploadType from './components/selectUploadType';

import enabledModules from 'enabledModules';

type Layer = {
  name: string
}

type PageName
  = 'SelectType'
  | 'SelectUploadType'
  | 'UploadFile'
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
  navigation: Navigation,
  upload: UploadFile.FileUpload,
  transform: ImportColumns.Transform,               // only used in UploadData operation
  layers: Array<Layer>,               // only used in UploadGeo operation
  metadata: Metadata.DatasetMetadata
}

const initialNavigation: Navigation = {
  page: 'SelectType',
  path: ['SelectType'],
  operation: null // will be filled in when we click something on the first screen
};

// is this even used or is it just the no-args call to the reducer?
export function initialNewDatasetModel(datasetId: string, datasetName: string): NewDatasetModel {
  return {
    datasetId: datasetId,
    navigation: initialNavigation,
    upload: {},
    transform: null,
    layers: null,
    metadata: Metadata.emptyForName(datasetName),
    importStatus: Server.initialImportStatus()
  };
}


// TODO: read this stuff from server-dumped state
export const fakeInitialModel = initialNewDatasetModel('fake-fake', 'Chicago Crimes');


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

export function updateNavigation(navigation = initialNavigation: Navigation, action): Navigation {

  let nextPage = navigation.page;
  switch (action.type) {
    case CHOOSE_OPERATION:
      switch (action.name) {
        case 'UploadData':
          nextPage = 'SelectUploadType';
          break;
        case 'UploadBlob':
        case 'UploadGeospatial':
          nextPage = 'UploadFile'; // TODO: select upload type
          break;
        case 'ConnectToEsri': // TODO what is this actually supposed to go to?
        case 'LinkToExternal':
        case 'CreateFromScratch':
          nextPage = 'Metadata';
          break;
        default:
          console.error('invalid operation name:', action.name);
      }

      return {
        operation: action.name,
        page: nextPage,
        path: [...navigation.path, nextPage]
      };

    case UploadFile.FILE_UPLOAD_COMPLETE:
      switch (navigation.operation) {
        case 'UploadData':
          nextPage = 'ImportColumns';
          break;
        case 'UploadGeospatial':
          nextPage = 'ImportShapefile';
          break;
        case 'UploadBlob':
          nextPage = 'Metadata';
          break;
        default:
          console.error('invalid action FILE_UPLOAD_COMPLETE for operation:', navigation.operation);
      }
      return {
        ...navigation,
        page: nextPage,
        path: [...navigation.path, nextPage]
      };

    case GO_TO_PAGE:
      return {
        ...navigation,
        page: action.page,
        path: [...navigation.path, action.page]
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
                  goToPage={(page) => dispatch(goToPage(page))} />
              );

            case 'UploadFile':
              return (
                <UploadFile.view
                  onFileUploadAction={dispatch}
                  fileUpload={state.upload}
                  operation={state.navigation.operation} />
              );

            case 'ImportColumns':
              // TODO: assert validity of fileUpload
              return (
                <ImportColumns.view
                  transform={state.transform}
                  fileName={state.upload.fileName}
                  dispatch={dispatch}
                  goToPage={(page) => dispatch(goToPage(page))} />
              );

            case 'ImportShapefile':
              return (
                <ImportShapefile.view
                  layers={state.layers}
                  fileName={state.upload.fileName}
                  dispatch={dispatch}
                  goToPage={(page) => dispatch(goToPage(page))} />
              );

            case 'Metadata':
              return (
                <Metadata.view
                  metadata={state.metadata}
                  onMetadataAction={(action) => {dispatch(action);}}
                  importError={state.importStatus.error} />
              );

            case 'Working':
              return <Working.view />;

            case 'Importing':
              return (
                <Importing.view
                  importStatus={state.importStatus}
                  operation={state.navigation.operation} />
              );

            case 'Finish':
              return <Finish.view />;

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
