import PropTypes from 'prop-types';
import React, { Children } from 'react';
import { SocrataIcon } from 'common/components/SocrataIcon';
import bindAll from 'lodash/fp/bindAll';

export class DropdownItem extends React.Component {
  render() {
    const { children, onClick } = this.props;

    return (
      <li className="dropdown-button-item">
        <button type="button" className="btn btn-transparent" onClick={onClick}>
          {children}
        </button>
      </li>
    );
  }
}

DropdownItem.propTypes = {
  children: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
};

class DropdownButton extends React.Component {
  constructor() {
    super();
    this.state = {
      showDropdown: false
    };
    bindAll(['hideDropdown', 'toggleDropdown', 'toggleDocumentMouseDown', 'onMouseDown'], this);
  }

  componentDidMount() {
    this.toggleDocumentMouseDown(true);
  }

  componentWillUnmount() {
    this.toggleDocumentMouseDown(false);
  }

  onMouseDown(ev) {
    if (!(this.dropdownRef === ev.target || this.dropdownRef.contains(ev.target))) {
      this.setState({ showDropdown: false });
    }
  }

  toggleDocumentMouseDown(isMounted) {
    window.document[isMounted ? 'addEventListener' : 'removeEventListener']('mousedown', this.onMouseDown);
  }

  hideDropdown() {
    this.setState({ showDropdown: false });
  }

  toggleDropdown() {
    this.setState({ showDropdown: !this.state.showDropdown });
  }

  render() {
    const { children } = this.props;
    const { showDropdown } = this.state;

    const buttonClass = `btn btn-transparent kebab-button${showDropdown ? ' selected' : ''}`;
    const childItems = Children.map(children, child => {
      return React.cloneElement(child, { onClick: () => { this.hideDropdown(); child.props.onClick(); }});
    });

    return (
      <div className="dropdown-button" ref={ref => (this.dropdownRef = ref)}>
        <button
          className={buttonClass}
          onClick={() => this.setState({ showDropdown: !showDropdown })}>
          <SocrataIcon name="kebab" />
        </button>
        {showDropdown &&
        <ul className="dropdown-button-actions">
          {childItems}
        </ul>}
      </div>
    );
  }
}

DropdownButton.propTypes = {
  children: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired
};

export default DropdownButton;
