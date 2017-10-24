import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import cssModules from 'react-css-modules';
import { resultFocusChanged, queryChanged, resultVisibilityChanged } from 'common/autocomplete/actions';
import { Result } from 'common/autocomplete/components/Results/Result';
import styles from 'common/autocomplete/components/Results/results.scss';

// TODO: EN-19403 - Factor out as shared component
export class UserAutocompleteResult extends Result {
  // Returns array of `user.screen_name` & `user.email` prop fragments decorated with <span class="highlight">
  // around the matches specified in the `matches` prop.
  displayTitle() {
    const { user, matches } = this.props;
    const { screen_name, email } = user;

    const displayTitleFragments = [];

    // screen_name match
    const screenNameMatch = matches.find(match => {
      return match.field === 'screen_name';
    });
    if (!_.isUndefined(screenNameMatch)) {
      displayTitleFragments.push(screen_name.substring(0, _.get(screenNameMatch.offsets[0], 'start')));
      screenNameMatch.offsets.forEach((offset, index) => {
        displayTitleFragments.push(
          <span className="highlight" key={`name_${index}`}>
            {screen_name.substring(offset.start, offset.length + offset.start)}
          </span>
        );

        const nextMatch = screenNameMatch.offsets[index + 1];
        const nextMatchStart = nextMatch ? nextMatch.start : undefined;
        displayTitleFragments.push(screen_name.substring(offset.length + offset.start, nextMatchStart));
      });
    } else {
      displayTitleFragments.push(screen_name);
    }

    displayTitleFragments.push(' - ');

    // email match
    const emailMatch = matches.find(match => {
      return match.field === 'email';
    });
    if (!_.isUndefined(emailMatch)) {
      displayTitleFragments.push(email.substring(0, _.get(emailMatch.offsets[0], 'start')));
      emailMatch.offsets.forEach((offset, index) => {
        displayTitleFragments.push(
          <span className="highlight" key={`email_${index}`}>
            {email.substring(offset.start, offset.length + offset.start)}
          </span>
        );

        const nextMatch = emailMatch.offsets[index + 1];
        const nextMatchStart = nextMatch ? nextMatch.start : undefined;
        displayTitleFragments.push(email.substring(offset.length + offset.start, nextMatchStart));
      });
    } else {
      displayTitleFragments.push(email);
    }

    return displayTitleFragments;
  }
}

UserAutocompleteResult.propTypes = {
  onChooseResult: PropTypes.func.isRequired,
  onResultFocusChanged: PropTypes.func.isRequired,
  onQueryChanged: PropTypes.func.isRequired,
  onResultsVisibilityChanged: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
  matches: PropTypes.array.isRequired,
  user: PropTypes.object.isRequired,
  focused: PropTypes.bool.isRequired,
  name: PropTypes.string.isRequired
};

const mapDispatchToProps = dispatch => ({
  onResultFocusChanged: newFocus => {
    dispatch(resultFocusChanged(newFocus));
  },
  onQueryChanged: query => {
    dispatch(queryChanged(query));
  },
  onResultsVisibilityChanged: visible => {
    dispatch(resultVisibilityChanged(visible));
  }
});

const ConnectedUserAutocompleteResult = connect(null, mapDispatchToProps)(
  cssModules(UserAutocompleteResult, styles)
);

export const renderUserAutocompleteResult = (result, index, focused, onChooseResult) => {
  const { matches, user } = result;

  return (
    <ConnectedUserAutocompleteResult
      key={user.id}
      matches={matches}
      name={user.screen_name}
      user={user}
      index={index}
      focused={focused}
      onChooseResult={onChooseResult}
    />
  );
};
