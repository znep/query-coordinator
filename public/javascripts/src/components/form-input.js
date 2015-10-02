(() => {

  const PropTypes = React.PropTypes;
  let componentsNS = blist.namespace.fetch('blist.components');
  const { classNames } = blist.namespace.fetch('blist.components.utils');

  componentsNS.FormInput = React.createClass({
    propTypes: {
      description: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      id: PropTypes.string.isRequired,
      required: PropTypes.bool,
      showValidationError: PropTypes.bool,
      validationError: PropTypes.string
    },
    getDefaultProps: function() {
      return {
        required: false,
        showValidationError: false
      }
    },
    render: function() {
      const {
        children,
        description,
        id,
        label,
        required,
        showValidationError,
        validationError
      } = this.props;

      const className = classNames({ required });

      return (
        <div className="line">
          <label htmlFor={id} className={className}>{label}</label>
          <div>
            {children}
            <p>{description}</p>
            <label
              className="error"
              htmlFor={id}
              generated="true"
              >
              {showValidationError ? validationError : ''}
            </label>
          </div>
        </div>
      );
    }
  });

})();
