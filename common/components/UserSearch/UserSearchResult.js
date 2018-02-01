import React, { Component } from 'react';
import PropTypes from 'prop-types';

import FeatureFlags from 'common/feature_flags';
import I18n from 'common/i18n';
import SocrataIcon from 'common/components/SocrataIcon';

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

  renderEmail = (isTeam, screenName, email, matches) => {
    if (isTeam) {
      // team has no email
      return null;
    } else if (screenName) {
      // if we have a screen name, we have an actual user and not
      // just a share to an email address
      return (
        <HighlightedResultText
          text={email}
          fieldName="email"
          matches={matches} />
      );
    } else {
      // else lack of screen name means this is an unregistered user
      return (
        <em>
          {I18n.t('shared.site_chrome.access_manager.unregistered_user_search_result')}
        </em>
      );
    }
  }

  render() {
    const teamsEnabled = FeatureFlags.value('enable_teams');

    const { result } = this.props;
    const { user, team, matches } = result;
    const entity = user ? user : team;
    const { screen_name: screenName, email } = entity;
    const isTeam = team || false;

    const nameContent = screenName ?
      // if we have a screen name, we have an actual user
      (<HighlightedResultText
        text={screenName}
        fieldName="screen_name"
        matches={matches} />) :
      // else we have a share to just an email
      email;

    return (
      <div className="user-search-result-container">
        {/* We only show icons if teams are enabled... */}
        {teamsEnabled && (<SocrataIcon name={isTeam ? 'team' : 'user'} className="user-search-result-icon" />)}
        <div className="user-search-result-content">
          <div className="user-search-result-name">
            {nameContent}
          </div>
          <div className="user-search-result-email">
            {this.renderEmail(isTeam, screenName, email, matches)}
          </div>
        </div>
      </div>
    );
  }
}

export default UserSearchResult;
