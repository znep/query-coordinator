(() => {

  const PropTypes = React.PropTypes;
  let componentsNS = blist.namespace.fetch('blist.components');
  let georegionsComponentsNS = blist.namespace.fetch('blist.georegions.components');
  const {
    FormControls,
    FormSelectInput,
    FormTextInput
  } = componentsNS;

  var t = function(str, props) {
    return $.t('screens.admin.georegions.' + str, props);
  };

  georegionsComponentsNS.ConfigureBoundaryForm = React.createClass({
    propType: {
      authenticityToken: PropTypes.string.isRequired,
      id: PropTypes.number.isRequired,
      onClose: PropTypes.func.isRequired,
      onSave: PropTypes.func.isRequired,
      title: PropTypes.string.isRequired
    },
    getInitialState: function() {
      return {
        geometryLabel: '',
        geometryLabelColumns: [],
        isLoading: true,
        name: ''
      };
    },
    componentDidMount: function() {
      const { id } = this.props;

      $.ajax({
        url: `/admin/geo/${id}`,
        type: 'get',
        dataType: 'json',
        complete: () => this.setState({ isLoading: false }),
        success: (response) => {
          const { error, message, success } = response;
          if (success) {
            this.setState({ ...message });
          }
          if (error) {
            // Error!
          }
        }
      });
    },

    handleSave: function() {
      const {
        authenticityToken,
        id,
        onClose,
        onSave
      } = this.props;

      const {
        name,
        geometryLabel
      } = this.state;

      const data = {
        authenticityToken,
        boundary: {
          geometryLabel,
          name
        }
      };

      this.setState({ isLoading: true });
      const handleComplete = () => {
        if (this.isMounted()) {
          this.setState({ isLoading: false });
        }
      };
      const handleSuccess = (response) => {
        if (response.success) {
          handleComplete();
          onSave(response);
          onClose();
        }
      };

      $.ajax({
        contentType: 'application/json',
        url: `/admin/geo/${id}`,
        type: 'put',
        data: JSON.stringify(data),
        dataType: 'json',
        complete: handleComplete,
        success: handleSuccess
      });
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
        name,
        geometryLabel
      } = this.state;
      return !(_.isEmpty(name) || _.isEmpty(geometryLabel));
    },

    render: function() {
      const {
        onClose,
        title
      } = this.props;

      const {
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
              showValidationError={!isLoading && _.isEmpty(name)}
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
              showValidationError={!isLoading && _.isEmpty(geometryLabel)}
              validationError={ t('configure_boundary.boundary_geometry_label_field_error') }
              />

            <FormControls
              saveDisabled={_.isEmpty(name) || _.isEmpty(geometryLabel)}
              onCancel={onClose}
              onSave={this.handleSave}
              />
          </form>
        </div>
      );
    }
  });

})();
