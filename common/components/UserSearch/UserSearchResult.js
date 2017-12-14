import React, { Component } from 'react';
import PropTypes from 'prop-types';

import I18n from 'common/i18n';

import UserSearchResultPropType from './UserSearchResultPropType';
import HighlightedResultText from './HighlightedResultText';

/**
 * Passed to the multiselect to register a single user search result.
 * Handles highlighting the matches from cetera autocomplete.
 */
class UserSearchResult extends Component {
  static propTypes = {
    index: PropTypes.number.isRequired,
    result: UserSearchResultPropType.isRequired
  };

  render() {
    const { result } = this.props;
    const { user, matches } = result;
    const { screen_name: screenName, email } = user;

    // if we have screen_name and email, then this is a user who
    // has registered and we can display them as such
    if (screenName && email) { // eslint-disable-line camelcase
      return (
        <div>
          <div className="user-search-result-name">
            <HighlightedResultText
              text={screenName}
              fieldName="screen_name"
              matches={matches} />
          </div>
          <div className="user-search-result-email">
            <HighlightedResultText
              text={email}
              fieldName="email"
              matches={matches} />
          </div>
        </div>
      );
    } else {
      // else this is an unregistered user and we only have their email
      // (most likely, the email has been entered into the search box)
      return (
        <div>
          <div className="user-search-result-name">
            {email}
          </div>
          <div className="user-search-result-email">
            <em>{I18n.t('shared.site_chrome.access_manager.unregistered_user_search_result')}</em>
          </div>
        </div>
      );
    }
  }
}

export default UserSearchResult;
