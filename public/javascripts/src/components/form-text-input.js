(() => {

  const PropTypes = React.PropTypes;
  let componentsNS = blist.namespace.fetch('blist.components');
  const { classNames } = blist.namespace.fetch('blist.components.utils');

  componentsNS.FormTextInput = React.createClass({
    propTypes: {
      description: PropTypes.string,
      id: PropTypes.string.isRequired,
      initialValue: PropTypes.string,
      label: PropTypes.string.isRequired,
      onBlur: PropTypes.func,
      onChange: PropTypes.func,
      required: PropTypes.bool,
      showValidationError: PropTypes.bool,
      validationError: PropTypes.string
    },
    getDefaultProps: function() {
      return {
        description: '',
        validationError: '',
        initialValue: '',
        onBlur: _.noop,
        onChange: _.noop,
        required: false,
        showValidationError: false
      };
    },
    getInitialState: function() {
      return {
        value: this.props.initialValue
      };
    },
    componentWillReceiveProps: function(nextProps) {
      if (this.state.value === '' && this.props.initialValue !== nextProps.initialValue) {
        this.setState({ value: nextProps.initialValue });
      }
    },
    handleChange: function() {
      const input = React.findDOMNode(this.refs.input);
      const value = input.value;
      this.setState({value});
      this.props.onChange(value);
    },
    render: function() {
      const {
        description,
        id,
        label,
        onBlur,
        required,
        showValidationError,
        validationError
        } = this.props;

      const {
        value
      } = this.state;

      const className = classNames({ required });

      return (
        <div className="line">
          <label htmlFor={id} className={className}>{label}</label>

          <div>
            <input
              className={className}
              defaultValue={this.props.value}
              id={id}
              onBlur={onBlur}
              onChange={this.handleChange}
              ref="input"
              type="text"
              value={value}
              />
            <p>{description}</p>
            <label
              className="error"
              htmlFor={id}
              generated="true"
              >
              {showValidationError ? validationError : ''}&nbsp;
            </label>
          </div>
        </div>
      );
    }
  });

})();
