import _ from 'lodash';
import classNames from 'classnames';
import cssModules from 'react-css-modules';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import Picklist from 'common/components/Picklist';
import { positionPicklist } from 'common/components/Dropdown/helper';

import styles from './index.module.scss';

/**
  InputDropDown.
  Displays a input text box and a dropdown on textbox focus. On input textbox
  value change, it fires 'onInputChange' callback to be handled by parent components,
  to retrieve search results/... for displaying as typeahead options in the picklist

  Props:
  @prop options       - to list the values in dropdown
  @prop onSelect      - called when a value is selected from the picklist
  @prop value         - currently selected value
  @prop isLoading     - true/false. If true, shows a loading spinner next the input text box.
  @prop onInputChange - called when the input in the textbox changes.
  @prop placeholder   - placeholder for the textbox.
  @prop listId        - id for picklist
*/
class InputDropDownMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showDropDown: false,
      selectedOption: this.getSelectedOption(props)
    };
  }

  componentDidMount() {
    // Adding listeners to check dropdown focus
    document.addEventListener('mousedown', this.handleClickOutside);
    document.addEventListener('scroll', this.handleClickOutside);
    document.addEventListener('wheel', this.handleClickOutside);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      selectedOption: this.getSelectedOption(nextProps)
    });
  }

  componentWillUpdate(nextProps, nextState) {
    if (nextState.showDropDown && !nextProps.isLoading) {
      // Setting dropdown position on open
      const picklistOptions = { displayTrueWidthOptions: true, showOptionsBelowHandle: true };
      positionPicklist(this.optionsRef, this.dropDownRef, picklistOptions);
    }
  }

  componentWillUnmount() {
    // Removing listeners
    document.removeEventListener('mousedown', this.handleClickOutside);
    document.removeEventListener('scroll', this.handleClickOutside);
    document.removeEventListener('wheel', this.handleClickOutside);
  }

  onBlur = (event) => {
    this.setState({ showDropDown: false });
  }

  onInputClick = () => {
    this.setState({ showDropDown: true });
  };

  onOptionSelect = (option) => {
    this.props.onSelect(option);
    this.setState({ showDropDown: false });
  };

  onInputValueChange = (value) => {
    this.props.onInputChange(value);
    this.setState({ showDropDown: true });
  }

  getSelectedOption = (props) => {
    const { value, options } = props;
    return _.find(options, { value }) || null;
  };

  handleClickOutside = (e) => {
    // ignore clicks on the component itself
    if (!this.dropDownRef.contains(e.target)) {
      this.setState({ showDropDown: false });
    }
  }

  renderInputType() {
    const { onInputChange, placeholder, value } = this.props;
    const { selectedOption } = this.state;
    const inputValue = _.get(selectedOption, 'title', value);
    return (
      <input
        styleName="small"
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onClick={this.onInputClick}
        onChange={(event) => this.onInputValueChange(event.target.value)}
        onBlur={() => this.onBlur()} />
    );
  }

  renderPickList() {
    const { listId, options } = this.props;
    const { selectedOption, showDropDown } = this.state;
    const picklistProps = {
      id: listId,
      options: options,
      onSelection: this.onOptionSelect,
      ref: ref => this.picklistRef = ref,
      size: 'small',
      value: selectedOption
    };

    const classes = classNames(
      'onclick-dropdown-menu small',
      { 'hidden': (_.isEmpty(options) || !showDropDown) }
    );

    return (
      <div ref={ref => this.optionsRef = ref} styleName={classes}>
        <Picklist {...picklistProps} />
      </div>
    );

  }

  render() {
    const { isLoading } = this.props;
    const { showDropDown } = this.state;

    return (
      <div
        styleName="input-dropdown-button"
        ref={ref => this.dropDownRef = ref}
        className="input-drop-down">
        <div styleName="input-container">
          {this.renderInputType()}
          {isLoading ? <span styleName="input-loading" /> : null}
        </div>
        {this.renderPickList()}
      </div>
    );
  }
}

InputDropDownMenu.defaultProps = {
  isLoading: false,
  options: [],
  placeholder: '',
  value: '',
  onInputChange: _.noop,
  onSelect: _.noop
};

InputDropDownMenu.propTypes = {
  isLoading: PropTypes.bool,
  options: PropTypes.array,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onInputChange: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired
};

export default cssModules(InputDropDownMenu, styles, { allowMultiple: true });
