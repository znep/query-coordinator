import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { handleKeyPress } from '../../common/a11yHelpers';
import CopyButton from './CopyButton';

class ResourceToggle extends Component {
  constructor(props) {
    super(props);

    this.state = {
      resourceType: props.types.filter(type => type.defaultType)[0]
    };
  }

  onFocusInput(event) {
    event.target.select();
  }

  onSubmit(event) {
    event.preventDefault();
  }

  setResourceType(resourceType) {
    this.setState({ resourceType });
  }

  renderDropdownLink(type, index) {
    const triggerAction = this.setResourceType.bind(this, type);
    const linkProps = {
      role: 'menuitem',
      href: '',
      className: 'option',
      onMouseUp: triggerAction,
      onKeyDown: handleKeyPress(triggerAction)
    };

    return (
      <li key={index}>
        {/* These links have empty hrefs so browsers let you tab to them */}
        <a {...linkProps}>{type.label}</a>
      </li>
    );
  }

  renderResourceToggle() {
    const { resourceType } = this.state;
    const { types } = this.props;

    const dropdownOptions = _.map(types, this.renderDropdownLink.bind(this));

    return (
      <span className="input-group-btn">
        <div
          className="dropdown btn btn-sm btn-default resource-toggle"
          data-orientation="bottom"
          data-selectable
          data-dropdown
          tabIndex="0">
          <span aria-hidden>{resourceType.label}</span>
          <span className="socrata-icon-arrow-down" role="presentation" />
          <ul role="menu" aria-label={I18n.resource_type} className="dropdown-options">
            {dropdownOptions}
          </ul>
        </div>
      </span>
    );
  }

  render() {
    const { resourceType } = this.state;
    const { title, section } = this.props;

    const urlProps = {
      'aria-labelledby': 'endpoint',
      className: 'endpoint-input text-input text-input-sm',
      type: 'text',
      value: resourceType.url,
      onFocus: this.onFocusInput,
      readOnly: true
    };

    return (
      <div className="endpoint">
        <h6 id="endpoint" className="title">
          {title}
        </h6>

        <form onSubmit={this.onSubmit}>
          <span className="input-group">
            <input {...urlProps} />
            {this.renderResourceToggle()}
            <CopyButton section={section} />
          </span>
        </form>
      </div>
    );
  }
}

ResourceToggle.propTypes = {
  types: PropTypes.arrayOf(PropTypes.object).isRequired,
  title: PropTypes.string.isRequired,
  section: PropTypes.string.isRequired
};

export default ResourceToggle;
