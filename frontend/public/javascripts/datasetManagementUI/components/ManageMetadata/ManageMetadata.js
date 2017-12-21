import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';
import {
  DATASET_FORM_NAME,
  COL_FORM_NAME,
  validateFieldsets,
  validateColumns
} from 'containers/ManageMetadataContainer';
import ManageMetadataSidebar from 'components/ManageMetadataSidebar/ManageMetadataSidebar';
import SubmitButton from 'containers/SubmitButtonContainer';
import styles from './ManageMetadata.scss';

export const SAVED = 'SAVED';
export const UNSAVED = 'UNSAVED';
export const ERRORED = 'ERRORED';
export const INITIALIZED = 'INITIALIZED';

class ManageMetadata extends Component {
  constructor(props) {
    super(props);

    this.state = {
      datasetForm: {
        status: INITIALIZED,
        data: props.datasetMetadata
      },
      columnForm: {
        status: INITIALIZED,
        data: props.outputSchemaColumns
      }
    };

    this.handleDatasetChange = this.handleDatasetChange.bind(this);
    this.handleColumnChange = this.handleColumnChange.bind(this);
    this.handleColumnFormSubmit = this.handleColumnFormSubmit.bind(this);
    this.handleDatasetFormSubmit = this.handleDatasetFormSubmit.bind(this);
  }

  componentWillUnmount() {
    this.props.hideFlash();

    // If the user saves dataset metadata that is invalid, the errors are put into
    // the redux store. This is because the publish button needs to know about these
    // errors to prevent users from publishing a dataset if any errors exist. But
    // this behavior causes a bug if:
    //
    // 1. user attempts to save bad dataset metadata
    // 2. errors get put into the redux store
    // 3. user hits cancel / close modal
    //
    // In this scenario, the form state reverts to the last set of dataset metadata
    // successfully saved to the server, but the errors in the store still describe
    // the erroneous form state the user attempted to save. Re-validating this.props.datasetMetadata
    // here corrects this problem.
    this.props.setFormErrors(DATASET_FORM_NAME, validateFieldsets(this.props.datasetMetadata));

    this.props.setFormErrors(COL_FORM_NAME, validateColumns(this.props.outputSchemaColumns));
  }

  // tedious but updating nested state this way allows for weird fieldset
  // and field names for custom fields; tried using dot-prop and a few other
  // helpers but they would fail for some field/fieldset names
  handleDatasetChange(fieldsetName, fieldName, value) {
    this.props.markFormDirty(DATASET_FORM_NAME);
    this.setState({
      ...this.state,
      datasetForm: {
        status: UNSAVED,
        data: {
          ...this.state.datasetForm.data,
          [fieldsetName]: {
            ...this.state.datasetForm.data[fieldsetName],
            fields: {
              ...this.state.datasetForm.data[fieldsetName].fields,
              [fieldName]: {
                ...this.state.datasetForm.data[fieldsetName].fields[fieldName],
                value: value
              }
            }
          }
        }
      }
    });
  }

  handleColumnChange(columnId, fieldName, value) {
    this.props.markFormDirty(COL_FORM_NAME);
    this.setState({
      ...this.state,
      columnForm: {
        status: UNSAVED,
        data: {
          ...this.state.columnForm.data,
          [columnId]: {
            ...this.state.columnForm.data[columnId],
            [fieldName]: value
          }
        }
      }
    });
  }

  handleColumnFormSubmit(e) {
    e.preventDefault();
    this.props.markFormClean(COL_FORM_NAME);

    return this.props
      .saveColumnMetadata(this.state.columnForm.data, this.props.inputSchemaId)
      .then(() => {
        this.props.showFlash('success', I18n.edit_metadata.save_success, 3500);

        this.setState({
          ...this.state,
          columnForm: {
            ...this.state.columnForm,
            status: SAVED
          }
        });
        this.props.setFormErrors(COL_FORM_NAME, {});
      })
      .catch(err => {
        this.props.showFlash('error', I18n.edit_metadata.validation_error_general);

        this.setState({
          ...this.state,
          columnForm: {
            ...this.state.columnForm,
            status: ERRORED
          }
        });

        this.props.markFormDirty(COL_FORM_NAME);
        this.props.setFormErrors(COL_FORM_NAME, err.errors);
      });
  }

  handleDatasetFormSubmit(e) {
    e.preventDefault();
    this.props.markFormClean(DATASET_FORM_NAME);

    return this.props
      .saveDatasetMetadata(this.state.datasetForm.data)
      .then(() => {
        this.props.showFlash('success', I18n.edit_metadata.save_success, 3500);

        this.setState({
          ...this.state,
          datasetForm: {
            ...this.state.datasetForm,
            status: SAVED
          }
        });
        this.props.setFormErrors(DATASET_FORM_NAME, {});
      })
      .catch(err => {
        this.props.showFlash('error', I18n.edit_metadata.validation_error_general);

        this.setState({
          ...this.state,
          datasetForm: {
            ...this.state.datasetForm,
            status: ERRORED
          }
        });

        this.props.markFormDirty(DATASET_FORM_NAME);
        this.props.setFormErrors(DATASET_FORM_NAME, err.errors);
      });
  }

  render() {
    const { datasetFormDirty, colFormDirty, params } = this.props;
    const formDirty = datasetFormDirty || colFormDirty;
    const onColumnTab = !!params.outputSchemaId;

    return (
      <div className={styles.manageMetadata}>
        <Modal fullScreen onDismiss={() => this.props.handleModalDismiss(this.props.pathToNewOutputSchema)}>
          <ModalHeader
            title={I18n.metadata_manage.title}
            onDismiss={() => this.props.handleModalDismiss(this.props.pathToNewOutputSchema)} />
          <ModalContent>
            <ManageMetadataSidebar
              params={this.props.params}
              hideFlash={this.props.hideFlash}
              columnsExist={this.props.columnsExist}
              outputSchemaId={this.props.outputSchemaId}
              datasetFormStatus={this.state.datasetForm.status}
              columnFormStatus={this.state.columnForm.status} />
            {this.props.children &&
              React.cloneElement(this.props.children, {
                fieldsets: this.state.datasetForm.data,
                columns: this.state.columnForm.data,
                handleDatasetChange: this.handleDatasetChange,
                handleColumnChange: this.handleColumnChange,
                handleDatasetFormSubmit: this.handleDatasetFormSubmit,
                handleColumnFormSubmit: this.handleColumnFormSubmit
              })}
          </ModalContent>
          <ModalFooter>
            <button
              className={styles.button}
              onClick={() => this.props.handleModalDismiss(this.props.pathToNewOutputSchema)}>
              {formDirty ? I18n.common.cancel : I18n.common.done}
            </button>
            <SubmitButton
              buttonName={onColumnTab ? 'submit-column-form' : 'submit-dataset-form'}
              formName={onColumnTab ? 'columnForm' : 'datasetForm'} />
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

ManageMetadata.propTypes = {
  datasetMetadata: PropTypes.object.isRequired,
  outputSchemaColumns: PropTypes.object.isRequired,
  saveDatasetMetadata: PropTypes.func,
  saveColumnMetadata: PropTypes.func,
  setFormErrors: PropTypes.func.isRequired,
  showFlash: PropTypes.func.isRequired,
  hideFlash: PropTypes.func.isRequired,
  outputSchemaId: PropTypes.number,
  columnsExist: PropTypes.bool,
  params: PropTypes.object.isRequired,
  handleModalDismiss: PropTypes.func.isRequired,
  markFormDirty: PropTypes.func.isRequired,
  markFormClean: PropTypes.func.isRequired,
  pathToNewOutputSchema: PropTypes.string,
  datasetFormDirty: PropTypes.bool,
  colFormDirty: PropTypes.bool,
  inputSchemaId: PropTypes.number,
  children: PropTypes.object
};

export default ManageMetadata;
