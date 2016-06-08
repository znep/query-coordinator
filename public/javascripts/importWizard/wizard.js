import React, { PropTypes } from 'react'; // eslint-disable-line no-unused-vars
import * as SelectType from './components/selectType';
import * as Metadata from './components/metadata';
import * as UploadFile from './components/uploadFile';
import * as ImportColumns from './components/importColumns';
import * as Importing from './components/importing';
import * as Working from './components/working';
import * as Finish from './components/finish';
import * as Server from './server';

import enabledModules from 'enabledModules';


type NewDatasetModel = {
  datasetId: string, // this should never change
  currentPage: PageName,
  operation: OperationName,
  upload: UploadFile.FileUpload,
  transform: ImportColumns.Transform, // only used in UploadData operation
  layers: Array<Layer>,               // only used in UploadGeo operation
  metadata: Metadata.DatasetMetadata
}


type Layer = {
  name: string
}


type PageName
  = 'SelectType'
  | 'SelectUploadType'
  | 'UploadFile'
  | 'ImportColumns'
  | 'Metadata'
  // can't re-enter to the below pages
  | 'Working'
  | 'Importing'
  | 'Finish'


type OperationName
  = 'UploadData'
  | 'UploadBlob'
  | 'ConnectToEsri'
  | 'UploadGeospatial'
  | 'LinkToExternal'
  | 'CreateFromScratch'


// is this even used or is it just the no-args call to the reducer?
export function initialNewDatasetModel(datasetId: string, datasetName: string): NewDatasetModel {
  return {
    datasetId: datasetId,
    currentPage: 'SelectType',
    operation: null, // will be filled in when we click something on the first screen
    upload: UploadFile.initial(),
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
export function chooseOperation(name: OperationName) {
  return {
    type: CHOOSE_OPERATION,
    name: name
  };
}


export function updateOperation(operation: OperationName = null, action): OperationName {
  switch (action.type) {
    case CHOOSE_OPERATION:
      return action.name;
    default:
      return operation;
  }
}

// reducers

export function updateCurrentPage(pageName: PageName = 'SelectType', action): PageName {
  switch (action.type) {
    case CHOOSE_OPERATION:
      switch (action.name) {
        case 'UploadData':
        case 'UploadBlob':
        case 'UploadGeospatial':
          return 'UploadFile'; // TODO: select upload type
        case 'ConnectToEsri':
        case 'LinkToExternal':
        case 'CreateFromScratch':
          return 'Metadata';
        default:
          console.error('invalid operation name:', action.name);
          return pageName;
      }
    case UploadFile.FILE_UPLOAD_COMPLETE:
      return 'ImportColumns';
    case ImportColumns.IMPORT_COLUMNS_NEXT:
      return 'Metadata';
    case Metadata.METADATA_NEXT:
      return 'Working';
    case Working.WORKING_NEXT:
      // TODO: this can be 'Finish' depending on the operation
      return 'Importing';
    case Server.IMPORT_COMPLETE:
      return 'Finish';
    default:
      return pageName;
  }
}

// view


export function view({ state, dispatch }) {
  return (
    <div className="contentBox fixedWidth" id="reactWizard">
      <h1>{ I18n.screens.dataset_new.first_page.header }</h1>
      <div className="newDatasetWizard wizard" aria-live="polite">
        {(() => {
          // only used by SelectType case, but ESLint won't let me put it there
          const onChooseOperation = (operationName) => (
            () => {
              dispatch(chooseOperation(operationName));
            }
          );
          switch (state.currentPage) {
            case 'SelectType':
              return <SelectType.view enabledModules={ enabledModules }
                                      currentDomainMemberCurrentUser={ true }
                                      onChooseOperation={ onChooseOperation } />;

            case 'SelectUploadType':
              return <span>SelectUploadType</span>;

            case 'UploadFile':
              return <UploadFile.view onFileUploadAction={ dispatch }
                                      fileUpload={ state.upload }
                                      operation={ state.operation } />;

            case 'ImportColumns':
              // TODO: assert validity of fileUpload
              return <ImportColumns.view transform={ state.transform }
                                         summary={ state.upload.progress.summary }
                                         fileName={ state.upload.fileName }
                                         dispatch={ dispatch } />;

            case 'Metadata':
              return <Metadata.view metadata={ state.metadata }
                                    onMetadataAction={ dispatch } />;

            case 'Working':
              return <Working.view />;

            case 'Importing':
              return <Importing.view importStatus={ state.importStatus } />;

            case 'Finish':
              return <Finish.view />;

            default:
              console.error('unexpected page:', state.currentPage);
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
