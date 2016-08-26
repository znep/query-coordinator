import React from 'react';
import classNames from 'classnames';

export var Picklist = React.createClass({
  propTypes: {
    disabled: React.PropTypes.bool,
    value: React.PropTypes.string,
    options: React.PropTypes.arrayOf(
      React.PropTypes.shape({
        title: React.PropTypes.string,
        value: React.PropTypes.string,
        group: React.PropTypes.string
      })
    ),
    onSelection: React.PropTypes.func
  },

  getDefaultProps() {
    return {
      disabled: false,
      options: [],
      onSelection: () => {},
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
    const hasRenderFunction = typeof option.render === 'function';
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
    const { disabled, options, displayTrueWidthOptions } = this.props;
    const classes = classNames('picklist', {
      'picklist-true-width': displayTrueWidthOptions,
      'picklist-disabled': disabled
    });

    const attributes = {
      ref: ref => this.picklist = ref,
      className: classes,
      onMouseOver: this.onMouseOverOptions
    };

    const header = (groupName, key) => (
      <div className="picklist-group-header" key={key}>{groupName}</div>
    );

    const separator = (key) => (
      <div className="picklist-separator" key={key} />
    );

    options.forEach((option, index) => {
      const previousOption = options[index - 1];
      const differentGroup = previousOption && previousOption.group !== option.group;

      if (differentGroup) {
        renderedOptions.push(separator(`${option.group}-separator`));
        renderedOptions.push(header(option.group, `${option.group}-header`));
      } else if (index === 0 && option.group) {
        renderedOptions.push(header(option.group, `${option.group}-header`));
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
