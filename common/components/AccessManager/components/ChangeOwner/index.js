import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import cssModules from 'react-css-modules';

import I18n from 'common/i18n';
import UserSearch from 'common/components/UserSearch';
import UserSearchResultPropType from 'common/components/UserSearch/UserSearchResultPropType';

import { ACCESS_LEVELS } from 'common/components/AccessManager/Constants';
import { findUserWithAccessLevel } from 'common/components/AccessManager/Util';

import * as changeOwnerActions from 'common/components/AccessManager/actions/ChangeOwnerActions';
import * as uiActions from 'common/components/AccessManager/actions/UiActions';

import SelectedUsersPropType from 'common/components/AccessManager/propTypes/SelectedUsersPropType';
import UserPropType from 'common/components/AccessManager/propTypes/UserPropType';

import UserDetails from 'common/components/AccessManager/components/UserDetails';

import styles from './change-owner.module.scss';

/**
 * Displays the current owner of the asset,
 * a search box to select a new owner,
 * and a button to confirm/cancel changing the owner.
 */
class ChangeOwner extends Component {
  static propTypes = {
    saveInProgress: PropTypes.bool,
    users: PropTypes.arrayOf(UserPropType),
    addSelectedOwner: PropTypes.func.isRequired,
    currentSearchQuery: PropTypes.string,
    searchResults: PropTypes.arrayOf(UserSearchResultPropType),
    removeSelectedOwner: PropTypes.func.isRequired,
    selectedOwner: SelectedUsersPropType,
    ownerSearchQueryChanged: PropTypes.func.isRequired,
    setConfirmButtonDisabled: PropTypes.func.isRequired
  }

  static defaultProps = {
    saveInProgress: false
  }

  static updateConfirmButton = (props) => {
    const {
      selectedOwner,
      setConfirmButtonDisabled
    } = props;

    setConfirmButtonDisabled(!selectedOwner || selectedOwner.length !== 1);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.selectedOwner !== this.props.selectedOwner) {
      ChangeOwner.updateConfirmButton(nextProps);
    }
  }

  renderCurrentOwner = () => {
    const { users } = this.props;
    const currentOwner = findUserWithAccessLevel(users, ACCESS_LEVELS.CURRENT_OWNER);

    return (
      <div styleName="current-owner-label">
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
    const { saveInProgress } = this.props;
    return (
      <div>
        {this.renderCurrentOwner()}
        {!saveInProgress && this.renderChangeOwnerSearch()}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  saveInProgress: state.ui.saveInProgress,

  // for UserSearch
  searchResults: state.changeOwner.results ? state.changeOwner.results.results : null,
  currentSearchQuery: state.changeOwner.query,
  selectedOwner: state.changeOwner.selectedOwner,
  users: state.permissions.permissions.users
});

const mapDispatchToProps = dispatch => ({
  addSelectedOwner: searchResult => dispatch(changeOwnerActions.addSelectedOwner(searchResult.user)),
  removeSelectedOwner: user => dispatch(changeOwnerActions.removeSelectedOwner(user)),
  ownerSearchQueryChanged: event => dispatch(changeOwnerActions.ownerSearchQueryChanged(event.target.value)),
  setConfirmButtonDisabled: disabled => dispatch(uiActions.setConfirmButtonDisabled(disabled))
});

export default connect(mapStateToProps, mapDispatchToProps)(cssModules(ChangeOwner, styles));
