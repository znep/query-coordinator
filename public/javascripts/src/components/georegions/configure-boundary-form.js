(() => {

  const PropTypes = React.PropTypes;
  let componentsNS = blist.namespace.fetch('blist.components');
  let georegionsComponentsNS = blist.namespace.fetch('blist.georegions.components');
  const {
    FlashMessage,
    FormControls,
    FormSelectInput,
    FormTextInput
  } = componentsNS;

  var t = function(str, props) {
    return $.t('screens.admin.georegions.' + str, props);
  };

  georegionsComponentsNS.ConfigureBoundaryForm = React.createClass({
    propType: {
      allowPrimaryKeySelection: PropTypes.bool,
      authenticityToken: PropTypes.string.isRequired,
      id: PropTypes.number.isRequired,
      fetchInitialState: PropTypes.func.isRequired,
      onBack: PropTypes.func,
      onClose: PropTypes.func,
      onSave: PropTypes.func.isRequired,
      title: PropTypes.string.isRequired,
      initialState: PropTypes.object,
      requiredFields: PropTypes.arrayOf(PropTypes.string)
    },
    getDefaultProps: function() {
      return {
        allowPrimaryKeySelection: false,
        requiredFields: []
      };
    },
    getInitialState: function() {
      return _.extend({
        geometryLabel: '',
        geometryLabelColumns: [],
        isLoading: true,
        name: ''
      }, this.props.initialState);
    },
    componentDidMount: function() {
      if (!_.isEmpty(this.props.initialState)) {
        return;
      }
      const complete = () => this.setState({ isLoading: false });
      const success = (initialState) => this.setState({ ...initialState });
      const error = (message) => this.setState({ errorMessage: message });
      this.props.fetchInitialState(complete, success, error);
    },

    handleSave: function() {
      const {
        onSave
      } = this.props;

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
          this.setState({ isLoading: false });
        }
      };
      const error = (message) => this.setState({ errorMessage: message });

      this.setState({ isLoading: true });

      onSave(boundary, complete, error);
    },

    handleSubmit: function(event) {
      event.preventDefault();
      if (this.validateForm()) {
        this.handleSave();
      }
    },

    makeFormSelectInputOptions: function(geometryLabelColumns) {
      return _.map(geometryLabelColumns, ({ id, fieldName, name}) => {
        return {
          key: String(id),
          label: name,
          value: fieldName
        };
      });
    },

    validateForm: function() {
      const {
        requiredFields
      } = this.props;

      return !_.any(requiredFields, (fieldName) => (_.isEmpty(this.state[fieldName])));
    },

    renderKeySelector: function() {
      const { allowPrimaryKeySelection } = this.props;
      const {
        primaryKey,
        primaryKeyColumns,
      } = this.state;

      if(allowPrimaryKeySelection) {
        return (
          <FormSelectInput
            description={ t('configure_boundary.primary_key_column_description') }
            id="shape_label"
            initialValue={primaryKey}
            initialOption={"Choose a column..."}
            label={ t('configure_boundary.primary_key_column') }
            onChange={ (primaryKey) => { this.setState({ primaryKey }) } }
            options={this.makeFormSelectInputOptions(primaryKeyColumns)}
            required={true}
            validationError={ t('configure_boundary.primary_key_column_missing_field_error') }
            />
        )
      }
    },

    render: function() {
      const {
        cancelLabel,
        onCancel,
        saveLabel,
        title
      } = this.props;

      const {
        errorMessage,
        geometryLabel,
        geometryLabelColumns,
        isLoading,
        name
      } = this.state;

      const spinnerStyle = {
        display: isLoading ? 'block' : 'none'
      };

      return (
        <div>
          <div className="georegion-spinner" style={spinnerStyle}>
            <img src="/stylesheets/images/common/BrandedSpinner.gif" />
          </div>

          <h2>{title}</h2>

          <div>{_.isUndefined(errorMessage) ? null : <FlashMessage messages={[{ type: 'error', message: errorMessage }]} />}</div>

          <form
            className="commonForm"
            onSubmit={this.handleSubmit}
            >
            <FormTextInput
              description={ t('configure_boundary.boundary_name_description') }
              id="boundary_name"
              initialValue={name}
              label={ t('configure_boundary.boundary_name') }
              onChange={ (name) => this.setState({ name }) }
              required={true}
              validationError={ t('configure_boundary.boundary_name_required_field_error') }
              />

            <FormSelectInput
              description={ t('configure_boundary.shape_label_description') }
              id="shape_label"
              initialValue={geometryLabel}
              initialOption={"Choose a column..."}
              label={ t('configure_boundary.shape_label') }
              onChange={ (geometryLabel) => { this.setState({ geometryLabel }) } }
              options={this.makeFormSelectInputOptions(geometryLabelColumns)}
              required={true}
              validationError={ t('configure_boundary.boundary_geometry_label_field_error') }
              />

            {this.renderKeySelector()}

            <FormControls
              cancelLabel={cancelLabel}
              saveDisabled={!this.validateForm()}
              onCancel={onCancel}
              onSave={this.handleSave}
              saveLabel={saveLabel}
              />
          </form>
        </div>
      );
    }
  });

})();
