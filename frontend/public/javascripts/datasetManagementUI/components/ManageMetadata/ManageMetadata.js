import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';
import ManageMetadataSidebar from 'components/ManageMetadataSidebar/ManageMetadataSidebar';
import SubmitButton from 'containers/SubmitButtonContainer';
import styles from './ManageMetadata.scss';

class ManageMetadata extends Component {
  constructor() {
    super();

    this.state = {
      datasetForm: {},
      columnForm: {}
    };

    this.handleDatasetChange = this.handleDatasetChange.bind(this);
    this.handleColumnChange = this.handleColumnChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentWillMount() {
    this.setState({
      datasetForm: this.props.datasetMetadata,
      columnForm: this.props.outputSchemaColumns
    });
  }

  componentWillUnmount() {
    this.props.hideFlash();
  }

  // tedious but updating nested state this way allows for weird fieldset
  // and field names for custom fields; tried using dot-prop and a few other
  // helpers but they would fail for some field/fieldset names
  handleDatasetChange(fieldsetName, fieldName, value) {
    this.props.markFormDirty();
    this.setState({
      ...this.state,
      datasetForm: {
        ...this.state.datasetForm,
        [fieldsetName]: {
          ...this.state.datasetForm[fieldsetName],
          fields: {
            ...this.state.datasetForm[fieldsetName].fields,
            [fieldName]: {
              ...this.state.datasetForm[fieldsetName].fields[fieldName],
              value: value
            }
          }
        }
      }
    });
  }

  handleColumnChange(columnId, fieldName, value) {
    // this.props.markFormDirty();
    this.setState({
      ...this.state,
      columnForm: {
        ...this.state.columnForm,
        [columnId]: {
          ...this.state.columnForm[columnId],
          [fieldName]: value
        }
      }
    });
  }

  handleSubmit(e) {
    this.props.markFormClean();
    e.preventDefault();
    this.props
      .saveDatasetMetadata(this.state.datasetForm)
      .then(() => {
        this.props.showFlash('success', I18n.edit_metadata.save_success, 3500);
        this.props.setFormErrors({});
      })
      .catch(err => {
        this.props.markFormDirty();
        this.props.showFlash('error', I18n.edit_metadata.validation_error_general);
        this.props.setFormErrors(err.errors);
      });
  }

  render() {
    const { datasetFormDirty, colFormDirty } = this.props;
    const formDirty = datasetFormDirty || colFormDirty;

    return (
      <div className={styles.manageMetadata}>
        <Modal fullScreen onDismiss={() => this.props.handleModalDismiss(this.props.pathToNewOutputSchema)}>
          <ModalHeader
            title={I18n.metadata_manage.title}
            onDismiss={() => this.props.handleModalDismiss(this.props.pathToNewOutputSchema)} />
          <ModalContent>
            <ManageMetadataSidebar
              params={this.props.params}
              columnsExist={this.props.columnsExist}
              outputSchemaId={this.props.outputSchemaId} />
            {this.props.children &&
              React.cloneElement(this.props.children, {
                fieldsets: this.state.datasetForm,
                columns: this.state.columnForm,
                handleSubmit: this.handleSubmit,
                handleDatasetChange: this.handleDatasetChange,
                handleColumnChange: this.handleColumnChange
              })}
          </ModalContent>
          <ModalFooter>
            <button
              className={styles.button}
              onClick={() => this.props.handleModalDismiss(this.props.pathToNewOutputSchema)}>
              {formDirty ? I18n.common.cancel : I18n.common.done}
            </button>
            <SubmitButton buttonName="submit-dataset-form" formName="datasetForm" />
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

ManageMetadata.propTypes = {
  datasetMetadata: PropTypes.object.isRequired,
  outputSchemaColumns: PropTypes.object.isRequired,
  saveDatasetMetadata: PropTypes.func.isRequired,
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
  children: PropTypes.object
};

export default ManageMetadata;
