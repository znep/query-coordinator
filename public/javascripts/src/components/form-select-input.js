(() => {

  const PropTypes = React.PropTypes;
  let componentsNS = blist.namespace.fetch('blist.components');
  const { FormInput } = componentsNS;
  const { classNames } = blist.namespace.fetch('blist.components.utils');

  const FormSelectInputOptionPropType = PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired
  });

  componentsNS.FormSelectInput = React.createClass({
    propTypes: {
      description: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      id: PropTypes.string.isRequired,
      initialOption: PropTypes.string,
      initialValue: PropTypes.string,
      onBlur: PropTypes.func,
      onChange: PropTypes.func,
      options: PropTypes.arrayOf(FormSelectInputOptionPropType),
      required: PropTypes.bool,
      validationError: PropTypes.string
    },
    getDefaultProps: function() {
      return {
        onBlur: _.noop,
        onChange: _.noop,
        options: [],
        initialValue: '',
        required: false
      }
    },
    getInitialState: function() {
      return {
        dirty: false,
        value: this.props.initialValue
      }
    },
    componentWillReceiveProps: function(nextProps) {
      if (this.state.value === '' && this.props.initialValue !== nextProps.initialValue) {
        this.setState({ value: nextProps.initialValue });
      }
    },
    handleChange: function() {
      const { onChange } = this.props;
      const { value } = React.findDOMNode(this.refs.select);
      this.setState({ dirty: true, value: value });
      onChange(value);
    },
    renderOptions: function(columns = []) {
      return _.map(columns, ({key, label, value}) => {
        return (
          <option key={key} value={value}>{label}</option>
        );
      });
    },
    render: function() {
      const {
        id,
        initialOption,
        options,
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
          <select
            className={className}
            id={id}
            onChange={this.handleChange}
            ref="select"
            value={value}
            >
            {initialOption ? (<option value="">{initialOption}</option>) : null}
            {this.renderOptions(options)}
          </select>
        </FormInput>
      );
    }
  });

})();
