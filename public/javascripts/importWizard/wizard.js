import React, { PropTypes } from 'react'; // eslint-disable-line no-unused-vars
import * as SelectType from './components/selectType';
import * as Metadata from './components/metadata';
import * as UploadFile from './components/uploadFile';

import enabledModules from 'enabledModules';


type NewDatasetModel = {
  datasetId: string, // this should never change
  currentPage: PageName,
  operation: OperationName,
  upload: UploadFile.FileUpload,
  // transform: Array<ImportColumns.ResultColumn>, // only used in UploadData operation
  layers: Array<Layer>,                         // only used in UploadGeo operation
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


type OperationName
  = 'UploadData'
  | 'UploadBlob'
  | 'ConnectToEsri'
  | 'UploadGeospatial'
  | 'LinkToExternal'
  | 'CreateFromScratch'


export function initialNewDatasetModel(datasetId: string, datasetName: string): NewDatasetModel {
  return {
    datasetId: datasetId,
    currentPage: 'SelectType',
    operation: null, // will be filled in when we click something on the first screen
    upload: UploadFile.initial(),
    transform: null,
    layers: null,
    metadata: Metadata.emptyForName(datasetName)
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
        case 'ConnectToEsri': // TODO what is this actually supposed to go to?
        case 'LinkToExternal':
        case 'CreateFromScratch':
          return 'Metadata';
        default:
          console.error('invalid operation name:', action.name);
          return pageName;
      }
    default:
      return pageName;
  }
}

// view


export function view(props) {
  const { state, dispatch } = props;

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
              {/* TODO: call ImportColumns component */}
              return <span>ImportColumns</span>;

            case 'Metadata':
              return <Metadata.view metadata={ state.metadata }
                                    onMetadataAction={ (action) => { dispatch(action); } } />;
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
