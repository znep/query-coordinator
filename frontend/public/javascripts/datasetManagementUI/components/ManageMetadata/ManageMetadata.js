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
  }

  componentWillMount() {
    this.setState({
      datasetForm: this.props.datasetMetadata,
      columnForm: this.props.outputSchemaColumns
    });
  }

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

  render() {
    return (
      <div>
        {this.props.children &&
          React.cloneElement(this.props.children, {
            fieldsets: this.state.datasetForm,
            handleDatasetChange: this.handleDatasetChange
          })}
      </div>
    );
  }
}

ManageMetadata.propTypes = {
  datasetMetadata: PropTypes.object.isRequired,
  outputSchemaColumns: PropTypes.object.isRequired,
  children: PropTypes.object
};

export default ManageMetadata;
