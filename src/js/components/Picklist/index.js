import _ from 'lodash';
import React from 'react';
import classNames from 'classnames';

export const Picklist = React.createClass({
  propTypes: {
    // Disables option selection
    disabled: React.PropTypes.bool,
    // Sets the initial value when provided
    value: React.PropTypes.string,
    options: React.PropTypes.arrayOf(
      React.PropTypes.shape({
        // Used to render the option title
        title: React.PropTypes.string,
        // Used for value comparisons during selection.
        value: React.PropTypes.string.isRequired,
        // Used to visually group similar options.
        // This value is UI text and should be human-friendly.
        group: React.PropTypes.string,
        // Receives the relevant option and
        // must return a DOM-renderable value.
        render: React.PropTypes.func
      })
    ),
    // Calls a function after user selection.
    onSelection: React.PropTypes.func
  },

  getDefaultProps() {
    return {
      disabled: false,
      options: [],
      onSelection: _.noop,
      value: null
    };
  },

  getInitialState() {
    return {
      selectedOption: null
    };
  },

  componentWillMount() {
    this.setSelectedOption(this.props);
  },

  componentDidMount() {
    this.setScrollPosition();
  },

  componentWillReceiveProps(nextProps) {
    this.setSelectedOption(nextProps);
  },

  onClickOption(selectedOption, event) {
    event.stopPropagation();
    this.props.onSelection(selectedOption);
    this.setState({ selectedOption });
  },

  onMouseDownOption(event) {
    event.preventDefault();
  },

  setSelectedOption(props) {
    const { options, value } = props;
    const selectedOption = _.find(options, { value });

    this.setState({ selectedOption });
  },

  setScrollPosition() {
    if (this.state.selectedOption) {
      const picklistTop = this.picklist.getBoundingClientRect().top;
      const picklistOption = this.picklist.querySelector('.picklist-option-selected');
      const picklistOptionTop = picklistOption.getBoundingClientRect().top;

      this.picklist.scrollTop = picklistOptionTop - picklistTop;
    }
  },

  renderOption(option, index) {
    const hasRenderFunction = _.isFunction(option.render);
    const onClickOptionBound = this.onClickOption.bind(this, option);
    const classes = classNames('picklist-option', {
      'picklist-option-selected': this.state.selectedOption === option
    });

    const attributes = {
      className: classes,
      onClick: onClickOptionBound,
      onMouseDown: this.onMouseDownOption,
      key: index
    };

    const content = hasRenderFunction ?
      option.render(option) :
      <span className="picklist-title" key={index}>{option.title}</span>;

    return (
      <div {...attributes}>
        {content}
      </div>
    );
  },

  render() {
    const renderedOptions = [];
    const { disabled, options } = this.props;
    const attributes = {
      ref: ref => this.picklist = ref,
      className: classNames('picklist', {
        'picklist-disabled': disabled
      })
    };

    const header = (group) => (
      <div className="picklist-group-header" key={`${group}-separator`}>{group}</div>
    );

    const separator = (group) => (
      <div className="picklist-separator" key={`${group}-header`} />
    );

    options.forEach((option, index) => {
      const { group } = option;
      const previousOption = options[index - 1];
      const differentGroup = previousOption && previousOption.group !== group;

      if (differentGroup) {
        renderedOptions.push(separator(group));
        renderedOptions.push(header(group));
      } else if (index === 0 && group) {
        renderedOptions.push(header(group));
      }

      renderedOptions.push(this.renderOption(option, index));
    });

    return (
      <div {...attributes}>
        {renderedOptions}
      </div>
    );
  }
});

export default Picklist;
