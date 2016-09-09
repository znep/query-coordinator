import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

export var PrivateNotice = React.createClass({
  propTypes: {
    view: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      isHidden: true
    };
  },

  componentWillMount() {
    var hasDismissedPrivateNotice = true;

    try {
      var privateNoticesClosed = JSON.parse(
        window.sessionStorage.getItem('dismissedPrivateNotices')
      );
      hasDismissedPrivateNotice = privateNoticesClosed[this.props.view.id];
    } catch (e) {
      hasDismissedPrivateNotice = false;
    }

    this.setState({
      isHidden: hasDismissedPrivateNotice
    });
  },

  onClickDismiss() {
    try {
      var privateNoticesClosed = JSON.parse(
        window.sessionStorage.getItem('dismissedPrivateNotices')
      );
      privateNoticesClosed = privateNoticesClosed || {};
      privateNoticesClosed[this.props.view.id] = true;
      window.sessionStorage.setItem(
        'dismissedPrivateNotices',
        JSON.stringify(privateNoticesClosed)
      );
    } finally {
      this.setState({
        isHidden: true
      });
    }
  },

  render() {
    var { view } = this.props;

    if (this.state.isHidden || !view.isPrivate) {
      return null;
    }

    return (
      <div className="alert info alert-full-width-top private-notice">
        <div className="alert-container">
          {I18n.private_notice}
          {' '}
          <a
            href={`${view.gridUrl}?pane=manage`}
            target="_blank">
            {I18n.manage_prompt}
          </a>
          <span className="icon-close-2 alert-dismiss" onClick={this.onClickDismiss}></span>
        </div>
      </div>
    );
  }
});

function mapStateToProps(state) {
  return _.pick(state, 'view');
}

export default connect(mapStateToProps)(PrivateNotice);
