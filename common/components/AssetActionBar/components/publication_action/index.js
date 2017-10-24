import PropTypes from 'prop-types';
import React, { Component } from 'react';
import I18n from 'common/i18n';
import moment from 'moment';

class PublicationAction extends React.Component {
  constructor(props) {
    super(props);

    this.i18n_scope = 'shared.components.asset_action_bar.components.publication_action';
  }

  calendarTime(time) {
    return moment(time).
      locale(I18n.locale).
      calendar().
      // I'm so sorry; this is horrible.
      // moment's locale files specify that these are capitalized in several languages.
      // But, while we want to lowercase in English definitely, it's less clear how to handle
      // every other language. However, it's likely that the meridian should be uppercase.
      // So. Fingers crossed. This function should probably turn into something complicated
      // and horrendous if we need it to.
      toLowerCase().
      replace('am', 'AM').
      replace('pm', 'PM');
  }

  renderLastSaved() {
    const { lastSaved, publicationState } = this.props;

    const lastSavedText = I18n.t(`${publicationState}.last_saved`, {
      scope: this.i18n_scope,
      when: this.calendarTime(lastSaved)
    });

    return (
      <div className="last-saved">
        {lastSavedText}
      </div>
    );
  }

  renderActions() {
    const { publicationState } = this.props;
    const actionText = I18n.t(`${publicationState}.primary_action_text`, {
      scope: this.i18n_scope
    });

    let actions = [
      <button className="btn btn-primary btn-dark" key="primary-action">
        {actionText}
      </button>
    ];

    // TODO:
    // I have no idea how `draft_old` versus `draft_new` is decided yet.
    // Once that's figured out, these key names will likely change.
    if (publicationState === 'draft_old') {
      actions.push(<button className="btn" key="revert-action">
        {I18n.t('draft_old.revert_published', { scope: this.i18n_scope })}
      </button>);
      actions.push(<button className="btn" key="view-action">
        {I18n.t('draft_old.view_published', { scope: this.i18n_scope })}
      </button>);
    }

    return actions;
  }

  render() {
    return (
      <div className="publication-action">
        {this.renderLastSaved()}
        {this.renderActions()}
      </div>
    );
  }
}

PublicationAction.propTypes = {
  // lastSaved: PropTypes.date // or something
};

// TODO: There are no defaultProps; there is only testery!
PublicationAction.defaultProps = {
  lastSaved: moment().subtract(1, 'day').valueOf(),
  publicationState: 'pending'
};

export default PublicationAction;
