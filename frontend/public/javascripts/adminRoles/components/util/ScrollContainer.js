import PropTypes from 'prop-types';
import React from 'react';
import { findDOMNode } from 'react-dom';
import cssModules from 'react-css-modules';
import styles from './scroll-container.module.scss';
import bindAll from 'lodash/fp/bindAll';
import scrollIntoView from 'scroll-into-view';
import { connect } from 'react-redux';
import { scrollToNewRole } from '../../adminRolesSelectors';

/** ScrollView / ScrollElement
 * Inspired by https://codedaily.io/tutorials/8/Build-a-Reusable-Scroll-List-Component-with-Animated-scrollTo-in-React
 *
 */
class ScrollView extends React.Component {
  constructor() {
    super();
    this.elements = {};
    bindAll(['register', 'unregister', 'scrollTo'], this);
  }

  scrollTo(name) {
    const node = findDOMNode(this.elements[name]);
    scrollIntoView(node, {
      time: 500,
      align: {
        left: 1
      },
      validTarget: function(target) {
        return target.getAttribute && target.getAttribute('data-scroll-container') === 'true';
      }
    });
  }

  register(name, ref) {
    this.elements[name] = ref;
  }

  unregister(name) {
    delete this.elements[name];
  }

  getChildContext() {
    return {
      scroll: {
        register: this.register,
        unregister: this.unregister
      }
    };
  }

  render() {
    return React.Children.only(this.props.children);
  }
}
ScrollView.childContextTypes = {
  scroll: PropTypes.object
};

class ScrollElement extends React.Component {
  componentDidMount() {
    this.context.scroll.register(this.props.name, this._element);
  }

  componentWillUnmount() {
    this.context.scroll.unregister(this.props.name);
  }

  render() {
    return React.cloneElement(this.props.children, {
      ref: ref => (this._element = ref)
    });
  }
}

ScrollElement.contextTypes = {
  scroll: PropTypes.object
};

const mapStateToProps = state => ({
  scrollTo: scrollToNewRole(state)
});

class ScrollContainer extends React.Component {
  componentDidUpdate(prevProps) {
    if (prevProps.scrollTo !== this.props.scrollTo) {
      this._scrollView.scrollTo(this.props.scrollTo);
    }
  }

  render() {
    const { children, className } = this.props;

    return (
      <ScrollView ref={ref => (this._scrollView = ref)}>
        <div className={className} styleName="scroll-container" data-scroll-container={true}>
          {React.Children.map(children, child =>
            <ScrollElement name={child.props.name}>
              {child}
            </ScrollElement>
          )}
        </div>
      </ScrollView>
    );
  }
}

export default connect(mapStateToProps)(cssModules(ScrollContainer, styles));
