(() => {

  const PropTypes = React.PropTypes;
  let componentsNS = blist.namespace.fetch('blist.components');

  const FormSelectInputOptionPropType = PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired
  });

  componentsNS.FormSelectInput = React.createClass({
    propTypes: {
      label: PropTypes.string.isRequired,
      id: PropTypes.string.isRequired,
      initialOption: PropTypes.string,
      initialValue: PropTypes.string,
      onBlur: PropTypes.func,
      onChange: PropTypes.func,
      options: PropTypes.arrayOf(FormSelectInputOptionPropType),
      required: PropTypes.bool,
      showValidationError: PropTypes.bool,
      validationError: PropTypes.string
    },
    getDefaultProps: function() {
      return {
        onBlur: _.noop,
        onChange: _.noop,
        options: [],
        initialValue: '',
        required: false,
        showValidationError: false
      }
    },
    getInitialState: function() {
      return {
        value: this.props.initialValue
      }
    },
    componentWillReceiveProps: function(nextProps) {
      if (this.state.value === '' && this.props.initialValue !== nextProps.initialValue) {
        this.setState({ value: nextProps.initialValue });
      }
    },
    handleChange: function() {
      const { value } = React.findDOMNode(this.refs.select);
      this.setState({ value });
      this.props.onChange(value);
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
        description,
        id,
        initialOption,
        label,
        options,
        showValidationError,
        validationError
      } = this.props;
      const { value } = this.state;

      return (
        <div className="line">
          <label htmlFor={id}>{label}</label>
          <div>
            <select
              id={id}
              onChange={this.handleChange}
              ref="select"
              value={value}
              >
              {initialOption ? (<option value="">{initialOption}</option>) : null}
              {this.renderOptions(options)}
            </select>
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
