import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { handleKeyPress } from '../../common/a11yHelpers';
import { isUserAdminOrPublisher } from '../../common/user';

export const PrivateNotice = React.createClass({
  propTypes: {
    view: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      isHidden: true
    };
  },

  componentWillMount() {
    let hasDismissedPrivateNotice = true;

    try {
      const privateNoticesClosed = JSON.parse(
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
      let privateNoticesClosed = JSON.parse(
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
    const { view } = this.props;

    if (this.state.isHidden || !view.isPrivate) {
      return null;
    }

    const manageLink = isUserAdminOrPublisher() ?
      <a href={`${view.gridUrl}?pane=manage`}>
        {I18n.manage_prompt}
      </a> :
      null;

    return (
      <div className="alert info alert-full-width-top private-notice">
        <div className="alert-container">
          {I18n.private_notice}
          {' '}
          {manageLink}
          <span
            className="icon-close-2 alert-dismiss"
            aria-label={I18n.close}
            role="button"
            tabIndex="0"
            onClick={this.onClickDismiss}
            onKeyDown={handleKeyPress(this.onClickDismiss)}></span>
        </div>
      </div>
    );
  }
});

function mapStateToProps(state) {
  return _.pick(state, 'view');
}

export default connect(mapStateToProps)(PrivateNotice);
