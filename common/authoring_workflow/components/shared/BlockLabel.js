import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { factories } from 'common/components';

export default class BlockLabel extends React.Component {
  getFlyoutName() {
    return `${_.kebabCase(this.props.title)}-flyout`;
  }

  componentDidMount() {
    if (this.props.description) {
      new factories.FlyoutFactory(this.element);
    }
  }

  renderFlyout() {
    const { description } = this.props;

    return (
      <div id={this.getFlyoutName()} className="flyout flyout-hidden flyout-block-label">
        <section className="flyout-content">
          {description}
        </section>
      </div>
    );
  }

  render() {
    const { title, htmlFor, description } = this.props;

    const helpIcon = description ? (
      <span className="icon-question" data-flyout={this.getFlyoutName()} />
    ) : null;

    const flyout = description ? this.renderFlyout() : null;

    return (
      <div ref={(el) => this.element = el}>
        <label className="block-label" htmlFor={htmlFor}>
          {title}
          {helpIcon}
        </label>
        {flyout}
      </div>
    );
  }
}

BlockLabel.propTypes = {
  title: PropTypes.string.isRequired,
  htmlFor: PropTypes.string,
  description: PropTypes.string
};
