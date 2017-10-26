import PropTypes from 'prop-types';
import React from 'react';

// If the recently opened accordion pane is out of viewport then the first
// scrollview in it's parents will be scrolled to the accordion pane.

// `ScrollView` component and `Scrolls` component wrapper implemented to
// encapsulate scrolling api in component hierarchy. `ScrollView` creates a
// context variable called `scroll` to provide scrolling functionality
// which is accessible by the children components, and the `Scrolls`
// wrapper is there for accessing this api over properties and hiding
// context details (like how redux's `connect` does it).

//* *Scroll API**
// - `scroll.horizontal(value)` - sets `view.scrollLeft = value`
// - `scroll.vertical(value)` - sets `view.scrollTop = value`
// - `scroll.toView(element)` - scroll to make element visible

//* *Example**
// ```javascript
// // itemView.js
// import {Scrolls} from './shared/Scroll';

// class ItemView extends React.Component {
  // componentDidUpdate() {
    // this.props.scroll.toView(this.refs.view);
  // }

  // render() {
    // return <div ref="view">Some content</div>;
  // }
// }

// export default Scrolls(ItemView);
// ```

// ```javascript
// // main.js
// import {ScrollView} from './shared/Scroll';
// import ItemView from 'itemView';

// // If no ScrollView ancestor found, scroll api functions will be _.noop
// ReactDOM.render(
  // <ScrollView>
    // <ItemView />
  // </ScrollView>
// , document.getElementById('root'));
// ```

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
