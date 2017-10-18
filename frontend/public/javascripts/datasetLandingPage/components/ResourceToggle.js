import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import CopyButton from './CopyButton';
import Dropdown from 'common/components/Dropdown';

class ResourceToggle extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedResourceUrl: props.types.filter(type => type.defaultType)[0].url
    };
  }

  onFocusInput(event) {
    event.target.select();
  }

  onSubmit(event) {
    event.preventDefault();
  }

  renderResourceToggle() {
    const { types } = this.props;
    const { selectedResourceUrl } = this.state;

    const props = {
      onSelection: selected => this.setState({ selectedResourceUrl: selected.value }),
      options: _.map(types, type => ({ title: type.label, value: type.url })),
      size: 'small',
      placeholder: types.find(opt => opt.url === selectedResourceUrl).label
    };

    return <Dropdown {...props} />;
  }

  render() {
    const { selectedResourceUrl } = this.state;
    const { title, section, onClickCopy } = this.props;

    const urlProps = {
      'aria-labelledby': 'endpoint',
      className: 'endpoint-input text-input text-input-sm',
      type: 'text',
      value: selectedResourceUrl,
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
            <CopyButton section={section} onClickCopy={onClickCopy} />
          </span>
        </form>
      </div>
    );
  }
}

ResourceToggle.propTypes = {
  onClickCopy: PropTypes.func.isRequired,
  types: PropTypes.arrayOf(PropTypes.object).isRequired,
  title: PropTypes.string.isRequired,
  section: PropTypes.string.isRequired
};

export default ResourceToggle;
