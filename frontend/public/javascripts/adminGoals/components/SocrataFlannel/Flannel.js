import _ from 'lodash';
import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames/bind';

import './Flannel.scss';

const mobileBreakpoint = 420;
const padding = 10;

class SocrataFlannel extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      lastFocusedItem: null,
      style: {
        left: 0,
        top: 0
      },
      className: 'flannel',
      id: _.uniqueId('flannel-')
    };

    _.bindAll(this, [
      'onWindowKeyUp',
      'positionFlannel',
      'onOuterClick'
    ]);
  }

  componentDidMount() {
    this.positionFlannel();

    $(window).on('resize.flannel.socrata', this.positionFlannel);
    $(window).on('keyup.flannel.socrata', this.onWindowKeyUp);
    $(document.body).on('click.flannel.socrata', this.onOuterClick);

    // Store last focused on element
    this.setState({ lastFocusedItem: document.querySelector(':focus') });
  }

  componentWillUnmount() {
    $(window).off('resize.flannel.socrata', this.positionFlannel);
    $(window).off('keyup.flannel.socrata', this.onWindowKeyUp);
    $(document.body).off('click.flannel.socrata', this.onOuterClick);

    // Return focus to the last previously focused on element
    if (this.state.lastFocusedItem) {
      this.state.lastFocusedItem.focus();
    }
  }

  // Catch ESC key to close flannel.
  onWindowKeyUp(event) {
    var key = event.which || event.keyCode;

    // ESC
    if (key === 27) {
      this.props.closeFlannel();
    }
  }

  // Catch body clicks to close flannel.
  onOuterClick(event) {
    const flannel = this.refs.flannel;
    const hoverable = this.props.hoverable;
    let node = event.target;

    if (node === hoverable || flannel.classList.contains('flannel-hidden')) {
      return;
    }

    while (node.parentElement) {
      if (node.id === this.state.id) {
        return;
      }
      node = node.parentElement;
    }

    this.props.closeFlannel();
  }

  // Positions flannel according to hoverable element.
  positionFlannel() {
    const flannel = this.refs.flannel;

    const hoverable = ReactDOM.findDOMNode(this.props.hoverable);
    let node = hoverable;
    let className;

    let left = 0;
    let top = 0;

    const flannelWidth = flannel.getBoundingClientRect().width;
    const bodyWidth = document.body.offsetWidth; // Without scrollbar
    const windowWidth = window.innerWidth; // With scrollbar

    if (windowWidth <= mobileBreakpoint) {
      document.body.classList.add('modal-open');
      this.setState({
        style: {
          left: 0,
          top: 0
        }
      });

      return;
    }

    do {
      left += node.offsetLeft;
      top += node.offsetTop;
    } while ((node = node.offsetParent) !== null);

    left = left + hoverable.offsetWidth / 2;
    top = top + hoverable.offsetHeight + padding;

    if (left + flannelWidth > bodyWidth && windowWidth > mobileBreakpoint) {
      className = classNames('flannel', {
        'flannel-left': true,
        'flannel-right': false
      });
      left -= flannelWidth;
    } else {
      className = classNames('flannel', {
        'flannel-left': false,
        'flannel-right': true
      });
    }

    this.setState({
      className,
      style: {
        left: left + 'px',
        top: top + 'px'
      }
    });
  }

  render() {
    const { id, style, className } = this.state;

    return (
      <div id={ id } className={ classNames(className, this.props.className) } ref="flannel" style={  style }>
        { this.props.children }
      </div>
    );
  }
}

export default SocrataFlannel;
