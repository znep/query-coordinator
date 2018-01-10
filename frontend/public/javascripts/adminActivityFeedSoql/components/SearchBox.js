import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { SocrataIcon } from 'common/components/SocrataIcon';
import classNames from 'classnames';

export default class SearchBox extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      focused: false,
      value: props.searchValue || ''
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.searchValue !== this.state.value) {
      this.setState({
        value: nextProps.searchValue || ''
      });
    }
  }

  handleFocusChanged(focused) {
    this.setState({ focused });
  }

  handleChange = (event) => {
    this.setState({ value: event.target.value });
  }

  handleSubmit = (event) => {
    const { value } = this.state;
    this.props.searchCallback(value !== '' ? value : null);
    event.preventDefault();
  }

  render() {
    const { focused, value } = this.state;
    const { placeholder, className } = this.props;

    const inputProps = {
      id: 'search-box',
      className: classNames('search-box-input', { focused }),
      onBlur: () => this.handleFocusChanged(false),
      onChange: this.handleChange,
      onFocus: () => this.handleFocusChanged(true),
      ref: (domNode) => this.domNode = domNode,
      placeholder,
      value
    };

    const iconWrapperProps = {
      className: classNames('search-icon-wrapper', { focused }),
      onClick: () => this.domNode.focus()
    };

    return (
      <div className={className}>
        <form className="form" onSubmit={this.handleSubmit}>
          <div {...iconWrapperProps}>
            <SocrataIcon name="search" />
          </div>
          <label htmlFor="search-box" className="aria-not-displayed">
            {placeholder}
          </label>
          <input {...inputProps} />
        </form>
      </div>
    );
  }
}

SearchBox.propTypes = {
  searchValue: PropTypes.string,
  searchCallback: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string
};
