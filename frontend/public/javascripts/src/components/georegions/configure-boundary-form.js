import FlashMessage from '../flash-message';
import FormControls from '../form-controls';
import FormSelectInput from '../form-select-input';
import FormTextInput from '../form-text-input';
import Spinner from '../spinner';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

const georegionsNS = blist.namespace.fetch('blist.georegions');

function t(str, props) {
  return $.t('screens.admin.georegions.' + str, props);
}

class ConfigureBoundaryForm extends Component {
  constructor(props) {
    super(props);

    this.state = _.extend({
      backActions: [],
      geometryLabel: '',
      geometryLabelColumns: [],
      isLoading: true,
      isConfigured: false,
      name: ''
    }, this.props.initialState);

    _.bindAll(this, 'handleCancel', 'handleSave', 'handleSubmit');
  }
  componentDidMount() {
    if (!_.isEmpty(this.props.initialState)) {
      return;
    }

    const complete = () => this.setState({ isLoading: false });
    const success = (initialState) => {
      this.setState({
        backActions: [this.props.onCancel],
        boundaryName: initialState.name,
        ...initialState
      });
    };
    const error = (message) => this.setState({ errorMessage: message });
    this.props.fetchInitialState(complete, success, error);
  }
  handleCancel() {
    const { backActions } = this.state;
    const action = backActions.pop();
    this.setState({backActions});
    action();
  }
  handleSave() {
    const { onSave } = this.props;

    const {
      backActions,
      isConfigured,
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
      if (this.isMounted()) { // eslint-disable-line react/no-is-mounted
        this.setState({isLoading: false});
      }
    };
    const error = (message) => this.setState({ errorMessage: message });

    if (isConfigured) {
      this.setState({isLoading: true});
      onSave(boundary, complete, error);
    } else {
      backActions.push(() => this.setState({isConfigured: false}));
      this.setState({backActions, isConfigured: true});
    }

  }

  handleSubmit(event) {
    event.preventDefault();
    if (this.validateForm()) {
      this.handleSave();
    }
  }

  makeFormSelectInputOptions(geometryLabelColumns) {
    return _.map(geometryLabelColumns, ({ id, fieldName, name}) => {
      return {
        key: String(id),
        label: name,
        value: fieldName
      };
    });
  }

  validateRequiredFields() {
    const { requiredFields } = this.props;

    return !_.any(requiredFields, (fieldName) => (_.isEmpty(this.state[fieldName])));
  }

  validateUniqueName() {
    const existingGeoregions = _.get(georegionsNS, 'georegions', []);
    const processingGeoregions = _.get(georegionsNS, 'jobs', []);

    const unavailableGeoregionNames = _(existingGeoregions.concat(processingGeoregions)).
      reject({id: this.props.id}).
      map('name').
      uniq().
      value();

    return !_.contains(unavailableGeoregionNames, this.state.name);
  }

  validateForm() {
    return this.validateRequiredFields() && this.validateUniqueName();
  }

  renderBoundaryNameField() {
    const { name } = this.state;

    const handleChange = (newName) => {
      this.setState({name: newName});
    };

    const contentValidator = () => {
      return {
        valid: this.validateUniqueName(),
        message: t('configure_boundary.boundary_name_unique_error')
      };
    };

    return (
      <FormTextInput
        description={t('configure_boundary.boundary_name_description')}
        id="boundary_name"
        initialValue={name}
        label={t('configure_boundary.boundary_name')}
        onChange={handleChange}
        required
        requiredFieldValidationError={t('configure_boundary.boundary_name_required_field_error')}
        contentValidator={contentValidator} />
    );
  }

  renderFlashMessage() {
    const { errorMessage } = this.state;

    if (!_.isUndefined(errorMessage)) {
      return (
        <FlashMessage messages={[{ type: 'error', message: errorMessage }]} />
      );
    }
  }

  renderFormControls() {
    const { shouldConfirm } = this.props;
    const { isConfigured } = this.state;

    let cancelLabel;
    let saveLabel;
    if (shouldConfirm) {
      cancelLabel = $.t('core.dialogs.back');
      saveLabel = isConfigured ? $.t('core.dialogs.create') : t('configure_boundary.next');
    }

    return (
      <FormControls
        cancelLabel={cancelLabel}
        onCancel={this.handleCancel}
        onSave={this.handleSave}
        saveDisabled={!this.validateForm()}
        saveLabel={saveLabel} />
    );
  }

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
        description={t('configure_boundary.shape_label_description')}
        id="shape_label"
        initialValue={geometryLabel}
        initialOption={"Choose a column..."}
        label={t('configure_boundary.shape_label')}
        onChange={handleChange}
        options={this.makeFormSelectInputOptions(geometryLabelColumns)}
        required
        validationError={t('configure_boundary.boundary_geometry_label_field_error')} />
    );
  }

  render() {
    const { shouldConfirm, title } = this.props;
    const { boundaryName, isConfigured, isLoading } = this.state;

    const confirmation = {
      __html: t('configure_boundary.confirm_html', {boundary_name: boundaryName})
    };

    if (shouldConfirm && isConfigured) {
      return (
        <div>
          <div className="confirmation">
            <h2>{t('configure_boundary.confirm_title')}</h2>
            <img src="/images/admin/geo/spatial-lens-icon.png" alt="" height="200" className="spatial-lens-icon" />
            <div dangerouslySetInnerHTML={confirmation} />
          </div>
          <form className="commonForm" onSubmit={this.handleSubmit}>
            {this.renderFormControls()}
          </form>
        </div>
      );
    } else {
      return (
        <div>
          <Spinner isLoading={isLoading} className="georegion-spinner" />
          <h2>{title}</h2>
          {this.renderFlashMessage()}
          <form className="commonForm" onSubmit={this.handleSubmit}>
            {this.renderBoundaryNameField()}
            {this.renderShapeLabelField()}
            {this.renderFormControls()}
          </form>
        </div>
      );
    }
  }
}

ConfigureBoundaryForm.propTypes = {
  cancelLabel: PropTypes.string,
  fetchInitialState: PropTypes.func.isRequired,
  id: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number]).isRequired,
  initialState: PropTypes.object,
  onCancel: PropTypes.func,
  onClose: PropTypes.func,
  onSave: PropTypes.func.isRequired,
  requiredFields: PropTypes.arrayOf(PropTypes.string),
  saveLabel: PropTypes.string,
  shouldConfirm: PropTypes.bool,
  title: PropTypes.string.isRequired
};

ConfigureBoundaryForm.defaultProps = {
  requiredFields: [],
  shouldConfirm: false
};

export default ConfigureBoundaryForm;
