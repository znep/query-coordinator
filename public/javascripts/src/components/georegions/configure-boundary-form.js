import FlashMessage from '../flash-message';
import FormControls from '../form-controls';
import FormSelectInput from '../form-select-input';
import FormTextInput from '../form-text-input';
import Spinner from '../spinner';
import React, { PropTypes } from 'react';

function t(str, props) {
  return $.t('screens.admin.georegions.' + str, props);
}

const ConfigureBoundaryForm = React.createClass({
  propTypes: {
    allowPrimaryKeySelection: PropTypes.bool,
    authenticityToken: PropTypes.string.isRequired,
    cancelLabel: PropTypes.string.isRequired,
    fetchInitialState: PropTypes.func.isRequired,
    id: PropTypes.number.isRequired,
    initialState: PropTypes.object,
    onBack: PropTypes.func,
    onCancel: PropTypes.func,
    onClose: PropTypes.func,
    onSave: PropTypes.func.isRequired,
    requiredFields: PropTypes.arrayOf(PropTypes.string),
    saveLabel: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired
  },
  getDefaultProps() {
    return {
      allowPrimaryKeySelection: false,
      requiredFields: []
    };
  },
  getInitialState() {
    return _.extend({
      geometryLabel: '',
      geometryLabelColumns: [],
      isLoading: true,
      name: ''
    }, this.props.initialState);
  },
  componentDidMount() {
    if (!_.isEmpty(this.props.initialState)) {
      return;
    }

    const complete = () => this.setState({ isLoading: false });
    const success = (initialState) => this.setState({...initialState});
    const error = (message) => this.setState({ errorMessage: message });
    this.props.fetchInitialState(complete, success, error);
  },
  handleSave() {
    const { onSave } = this.props;

    const {
      geometryLabel,
      name,
      primaryKey
    } = this.state;

    const boundary = {
      geometryLabel,
      name,
      primaryKey
    };

    const complete = () => {
      if (this.isMounted()) {
        this.setState({isLoading: false});
      }
    };
    const error = (message) => this.setState({ errorMessage: message });

    this.setState({isLoading: true});

    onSave(boundary, complete, error);
  },

  handleSubmit(event) {
    event.preventDefault();
    if (this.validateForm()) {
      this.handleSave();
    }
  },

  makeFormSelectInputOptions(geometryLabelColumns) {
    return _.map(geometryLabelColumns, ({ id, fieldName, name}) => {
      return {
        key: String(id),
        label: name,
        value: fieldName
      };
    });
  },

  validateForm() {
    const { requiredFields } = this.props;

    return !_.any(requiredFields, (fieldName) => (_.isEmpty(this.state[fieldName])));
  },

  renderKeySelector() {
    const { allowPrimaryKeySelection } = this.props;
    const {
      primaryKey,
      primaryKeyColumns
    } = this.state;

    const handleChange = (key) => {
      this.setState({primaryKey: key});
    };

    if (allowPrimaryKeySelection) {
      return (
        <FormSelectInput
          description={ t('configure_boundary.primary_key_column_description') }
          id="shape_label"
          initialValue={primaryKey}
          initialOption={"Choose a column..."}
          label={ t('configure_boundary.primary_key_column') }
          onChange={handleChange}
          options={this.makeFormSelectInputOptions(primaryKeyColumns)}
          required
          validationError={ t('configure_boundary.primary_key_column_missing_field_error') }
          />
      );
    }
  },

  renderBoundaryNameField() {
    const { name } = this.state;

    const handleChange = (newName) => {
      this.setState({name: newName});
    };

    return (
      <FormTextInput
        description={ t('configure_boundary.boundary_name_description') }
        id="boundary_name"
        initialValue={name}
        label={ t('configure_boundary.boundary_name') }
        onChange={handleChange}
        required
        validationError={ t('configure_boundary.boundary_name_required_field_error') }
        />
    );
  },

  renderFlashMessage() {
    const { errorMessage } = this.state;

    if (!_.isUndefined(errorMessage)) {
      return (
        <FlashMessage messages={[{ type: 'error', message: errorMessage }]}/>
      );
    }
  },

  renderFormControls() {
    const {
      cancelLabel,
      onCancel,
      saveLabel
    } = this.props;

    return (
      <FormControls
        cancelLabel={cancelLabel}
        saveDisabled={!this.validateForm()}
        onCancel={onCancel}
        onSave={this.handleSave}
        saveLabel={saveLabel}
        />
    );
  },

  renderShapeLabelField() {
    const {
      geometryLabel,
      geometryLabelColumns
    } = this.state;

    const handleChange = (newGeometryLabel) => {
      this.setState({geometryLabel: newGeometryLabel});
    };

    return (
      <FormSelectInput
        description={ t('configure_boundary.shape_label_description') }
        id="shape_label"
        initialValue={geometryLabel}
        initialOption={"Choose a column..."}
        label={ t('configure_boundary.shape_label') }
        onChange={handleChange}
        options={this.makeFormSelectInputOptions(geometryLabelColumns)}
        required
        validationError={ t('configure_boundary.boundary_geometry_label_field_error') }
        />
    );
  },

  render() {
    const { title } = this.props;
    const { isLoading } = this.state;

    return (
      <div>
        <Spinner isLoading={isLoading} className="georegion-spinner" />
        <h2>{title}</h2>
        {this.renderFlashMessage()}
        <form className="commonForm" onSubmit={this.handleSubmit}>
          {this.renderBoundaryNameField()}
          {this.renderShapeLabelField()}
          {this.renderKeySelector()}
          {this.renderFormControls()}
        </form>
      </div>
    );
  }
});

export default ConfigureBoundaryForm;
