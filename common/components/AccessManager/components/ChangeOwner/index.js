import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import cssModules from 'react-css-modules';

import I18n from 'common/i18n';
import UserSearchResultPropType from 'common/components/UserSearch/UserSearchResultPropType';

import styles from './change-owner.module.scss';
import * as changeOwnerActions from '../../actions/ChangeOwnerActions';
import UserSearch from '../../../UserSearch';
import UserDetails from '../UserDetails';
import SelectedUsersPropType from '../../propTypes/SelectedUsersPropType';
import UserPropType from '../../propTypes/UserPropType';
import ChangeOwnerFooter from './ChangeOwnerFooter';
import { ACCESS_LEVELS } from '../../Constants';
import { findUserWithAccessLevel } from '../../Util';

/**
 * Displays the current owner of the asset,
 * a search box to select a new owner,
 * and a button to confirm/cancel changing the owner.
 */
class ChangeOwner extends Component {
  static propTypes = {
    confirmSelectedOwner: PropTypes.func.isRequired,
    users: PropTypes.arrayOf(UserPropType),

    // UserSearch props, from redux
    addSelectedOwner: PropTypes.func.isRequired,
    currentSearchQuery: PropTypes.string,
    searchResults: PropTypes.arrayOf(UserSearchResultPropType),
    removeSelectedOwner: PropTypes.func.isRequired,
    selectedOwner: SelectedUsersPropType,
    ownerSearchQueryChanged: PropTypes.func.isRequired
  }

  hasSelectedOwner = () => this.props.selectedOwner && this.props.selectedOwner.length >= 1;

  renderCurrentOwner = () => {
    const { users } = this.props;
    const currentOwner = findUserWithAccessLevel(users, ACCESS_LEVELS.CURRENT_OWNER);

    return (
      <div>
        <h3>{I18n.t('shared.site_chrome.access_manager.current_owner')}</h3>
        <hr styleName="separator" />
        <UserDetails user={currentOwner} />
      </div>
    );
  }

  renderChangeOwnerSearch = () => {
    const {
      addSelectedOwner,
      currentSearchQuery,
      removeSelectedOwner,
      searchResults,
      selectedOwner,
      ownerSearchQueryChanged
    } = this.props;

    const userSearchProps = {
      maxSelectedUsers: 1, // can only have one owner
      addSelectedUser: addSelectedOwner,
      currentQuery: currentSearchQuery,
      results: searchResults,
      removeSelectedUser: removeSelectedOwner,
      selectedUsers: selectedOwner,
      userSearchQueryChanged: ownerSearchQueryChanged
    };

    return (
      <div>
        <h3 styleName="section-label">{I18n.t('shared.site_chrome.access_manager.new_owner')}</h3>
        <hr styleName="separator" />

        <div styleName="search-container">
          <UserSearch {...userSearchProps} />
        </div>
      </div>
    );
  }

  render() {
    const {
      confirmSelectedOwner,
      removeSelectedOwner,
      selectedOwner
    } = this.props;

    return (
      <div>
        {this.renderCurrentOwner()}
        {this.renderChangeOwnerSearch()}
        <ChangeOwnerFooter
          confirmSelectedOwner={confirmSelectedOwner}
          selectedOwner={selectedOwner}
          hasSelectedOwner={this.hasSelectedOwner()}
          removeSelectedOwner={removeSelectedOwner} />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  // for UserSearch
  searchResults: state.changeOwner.results ? state.changeOwner.results.results : null,
  currentSearchQuery: state.changeOwner.query,
  selectedOwner: state.changeOwner.selectedOwner,
  users: state.permissions.permissions.users
});

const mapDispatchToProps = dispatch => ({
  confirmSelectedOwner: owner => dispatch(changeOwnerActions.confirmSelectedOwner(owner)),

  // for UserSearch
  addSelectedOwner: searchResult => dispatch(changeOwnerActions.addSelectedOwner(searchResult.user)),
  removeSelectedOwner: user => dispatch(changeOwnerActions.removeSelectedOwner(user)),
  ownerSearchQueryChanged: (event) => dispatch(changeOwnerActions.ownerSearchQueryChanged(event.target.value))
});

export default connect(mapStateToProps, mapDispatchToProps)(cssModules(ChangeOwner, styles));
