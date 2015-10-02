(() => {

  const PropTypes = React.PropTypes;
  let componentsNS = blist.namespace.fetch('blist.components');
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
        description,
        id,
        initialOption,
        label,
        options,
        required,
        validationError
      } = this.props;

      const {
        dirty,
        value
      } = this.state;

      const className = classNames({ required });
      const showValidationError = required && dirty && _.isEmpty(value);

      return (
        <div className="line">
          <label htmlFor={id} className={className}>{label}</label>
          <div>
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
