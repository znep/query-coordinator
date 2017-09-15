import PropTypes from 'prop-types';
import React from 'react';

export default class ScrollView extends React.Component {
  constructor(props) {
    super(props);

    this.scrollHorizontally = this.scrollHorizontally.bind(this);
    this.scrollVertically = this.scrollVertically.bind(this);
    this.scrollToView = this.scrollToView.bind(this);
  }

  getChildContext() {
    return {
      scroll: {
        horizontal: this.scrollHorizontally,
        vertical: this.scrollVertically,
        toView: this.scrollToView
      }
    };
  }

  scrollHorizontally(to) {
    if (!this.refs.view) {
      return;
    }

    this.refs.view.scrollLeft = to;
  }

  scrollVertically(to) {
    if (!this.refs.view) {
      return;
    }

    this.refs.view.scrollTop = to;
  }

  scrollToView(targetView) {
    if (!this.refs.view) {
      return;
    }

    const view = this.refs.view;
    const height = view.offsetHeight;
    const targetY = targetView.offsetTop - view.offsetTop;
    const targetHalfHeight = targetView.offsetHeight / 2;
    const scrolledY = targetY - view.scrollTop;

    if (scrolledY < 0 || scrolledY + targetHalfHeight >= height) {
      view.scrollTop = targetY - targetHalfHeight;
    }
  }

  render() {
    return <div {...this.props} ref="view">{this.props.children}</div>;
  }
}

ScrollView.childContextTypes = {
  scroll: PropTypes.shape({
    horizontal: PropTypes.func,
    vertical: PropTypes.func,
    toView: PropTypes.func
  })
};
