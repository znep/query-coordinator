import PropTypes from 'prop-types';
import React, { Component } from 'react';

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
      <div>
        {this.props.children &&
          React.cloneElement(this.props.children, {
            fieldsets: this.state.datasetForm,
            handleSubmit: this.handleSubmit,
            handleDatasetChange: this.handleDatasetChange
          })}
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
  children: PropTypes.object
};

export default ManageMetadata;
