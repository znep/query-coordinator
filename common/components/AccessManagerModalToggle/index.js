import React, { Component } from 'react';
import { Provider } from 'react-redux';
import values from 'lodash/values';

import createStore from './AccessManagerStore';
import ViewPropType from '../AccessManager/propTypes/ViewPropType';
import UserPropType from '../AccessManager/propTypes/UserPropType';
import AccessManager from '../AccessManager/components/AccessManager';
import { fetchPermissions } from '../AccessManager/actions/PermissionsActions';
import { showAccessManager } from '../AccessManager/actions/UiActions';
import { MODES } from '../AccessManager/Constants';

/**
 * This component wraps the AccessManager in a redux store and provider.
 *
 * It also adds a "window.socrata.showAccessManager" function that,
 * when called, dispatches an action to show the modal.
 *
 * Main motiviation behind this is to be able to throw the access manager onto any
 * page and have it be summoned by a function.
 *
 * Note that, if a page is already using React/Redux, it is preferred
 * that the AccessManager be imported directly and to add its reducer/sagas to the existing store.
 */
class AccessManagerModalToggle extends Component {
  static propTypes = {
    currentUser: UserPropType.isRequired,
    view: ViewPropType.isRequired
  }

  constructor(props) {
    super(props);

    const {
      currentUser,
      view
    } = props;

    this.store = createStore({
      ui: {
        errors: [],
        visible: false,
        footer: {}
      },
      permissions: {
        currentUser,
        permissions: null,
        view
      }
    });
  }

  componentDidMount() {
    // immediately fetch permissions when the component is loaded
    // the saga will grab them in the background, so hopefully by the time
    // the user opens the modal they will have been fetched!
    this.store.dispatch(fetchPermissions());

    // shove a function onto window.socrata that shows the access manager
    if (!window.socrata) {
      window.socrata = {};
    }

    window.socrata.showAccessManager = (mode, refreshPageOnSave = false) => {
      if (!values(MODES).includes(mode)) {
        console.error(`Unknown Access Manager mode: ${mode}`);
      } else {
        this.store.dispatch(showAccessManager(refreshPageOnSave, mode));
      }
    };
  }

  render() {
    return (
      <Provider store={this.store}>
        <AccessManager />
      </Provider>
    );
  }
}

export default AccessManagerModalToggle;
