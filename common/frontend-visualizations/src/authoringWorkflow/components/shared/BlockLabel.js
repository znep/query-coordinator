import _ from 'lodash';
import React from 'react';

import Styleguide from 'socrata-components';

export default class BlockLabel extends React.Component {
  getFlyoutName() {
    return `${_.kebabCase(this.props.title)}-flyout`;
  }

  componentDidMount() {
    if (this.props.description) {
      new Styleguide.factories.FlyoutFactory(this.element);
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
  title: React.PropTypes.string.isRequired,
  htmlFor: React.PropTypes.string,
  description: React.PropTypes.string
};
