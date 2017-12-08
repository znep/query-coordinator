import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Link } from 'react-router';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';
import * as Links from 'links/links';
import styles from 'pages/ManageMetadata/ManageMetadata.scss';
import otherstyles from 'components/MetadataContent/MetadataContent.scss';

const datasetMetadataEnabled = !window.serverConfig.featureFlags.usaid_features_enabled;

const Sidebar = ({ params, outputSchemaId, columnsExist }) => {
  return (
    <div className={otherstyles.sidebar}>
      {datasetMetadataEnabled ? (
        <Link
          to={Links.datasetMetadataForm(params)}
          className={otherstyles.tab}
          activeClassName={otherstyles.selected}>
          {I18n.metadata_manage.dataset_metadata_label}
        </Link>
      ) : (
        <span className={otherstyles.disabled}>{I18n.metadata_manage.dataset_metadata_label}</span>
      )}
      {columnsExist ? (
        <Link
          to={Links.columnMetadataForm(params, outputSchemaId)}
          className={otherstyles.tab}
          activeClassName={otherstyles.selected}>
          {I18n.metadata_manage.column_metadata_label}
        </Link>
      ) : (
        <span className={otherstyles.disabled} title={I18n.home_pane.sidebar.no_columns_msg}>
          {I18n.metadata_manage.column_metadata_label}
        </span>
      )}
    </div>
  );
};

Sidebar.propTypes = {
  params: PropTypes.object.isRequired,
  outputSchemaId: PropTypes.number.isRequired,
  columnsExist: PropTypes.bool.isRequired
};

class ManageMetadata extends Component {
  constructor() {
    super();

    this.state = {
      datasetForm: {},
      columnForm: {}
    };

    this.handleDatasetChange = this.handleDatasetChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentWillMount() {
    this.setState({
      datasetForm: this.props.datasetMetadata,
      columnForm: this.props.outputSchemaColumns
    });
  }

  // tedious but updating nested state this way allows for weird fieldset
  // and field names for custom fields; tried using dot-prop and a few other
  // helpers but they would fail for some field/fieldset names
  handleDatasetChange(fieldsetName, fieldName, value) {
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

  handleSubmit(e) {
    e.preventDefault();
    this.props
      .saveDatasetMetadata(this.state.datasetForm)
      .then(() => {
        this.props.showFlash('success', 'saved ok');
        this.props.setFormErrors({});
      })
      .catch(err => {
        this.props.showFlash('error', 'messed up!');
        this.props.setFormErrors(err.errors);
      });
  }

  render() {
    return (
      <div className={styles.manageMetadata}>
        <Modal fullScreen>
          <ModalHeader title={I18n.metadata_manage.title} />
          <ModalContent>
            <Sidebar
              params={this.props.params}
              columnsExist={this.props.columnsExist}
              outputSchemaId={this.props.outputSchemaId} />
            {this.props.children &&
              React.cloneElement(this.props.children, {
                fieldsets: this.state.datasetForm,
                handleSubmit: this.handleSubmit,
                handleDatasetChange: this.handleDatasetChange
              })}
          </ModalContent>
          <ModalFooter>
            <button>hey</button>
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
  outputSchemaId: PropTypes.number,
  columnsExist: PropTypes.bool,
  params: PropTypes.object.isRequired,
  children: PropTypes.object
};

export default ManageMetadata;
