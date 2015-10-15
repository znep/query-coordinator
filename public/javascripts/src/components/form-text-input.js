(() => {

  const PropTypes = React.PropTypes;
  let componentsNS = blist.namespace.fetch('blist.components');
  const { FormInput } = componentsNS;
  const { classNames } = blist.namespace.fetch('blist.components.utils');

  componentsNS.FormTextInput = React.createClass({
    propTypes: {
      description: PropTypes.string,
      id: PropTypes.string.isRequired,
      initialValue: PropTypes.string,
      label: PropTypes.string.isRequired,
      onChange: PropTypes.func,
      required: PropTypes.bool,
      validationError: PropTypes.string
    },
    getDefaultProps: function() {
      return {
        description: '',
        validationError: '',
        initialValue: '',
        onBlur: _.noop,
        onChange: _.noop,
        required: false
      };
    },
    getInitialState: function() {
      return {
        dirty: false,
        value: this.props.initialValue
      };
    },
    componentWillReceiveProps: function(nextProps) {
      if (this.state.value === '' && this.props.initialValue !== nextProps.initialValue) {
        this.setState({ value: nextProps.initialValue });
      }
    },
    handleChange: function() {
      const { onChange } = this.props;
      const input = this.refs.input;
      const value = input.value;
      this.setState({ dirty: true, value: value });
      onChange(value);
    },
    handleBlur: function() {
      this.setState({ dirty: true });
    },
    render: function() {
      const {
        id,
        required,
        ...props
      } = this.props;

      const {
        dirty,
        value
      } = this.state;

      const className = classNames({ required });

      const showValidationError = required && dirty && _.isEmpty(value);

      const formInputProps = {
        id,
        required,
        showValidationError,
        ...props
      };

      return (
        <FormInput {...formInputProps}>
          <input
            className={className}
            id={id}
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            ref="input"
            type="text"
            value={value}
            />
        </FormInput>
      );
    }
  });

})();
