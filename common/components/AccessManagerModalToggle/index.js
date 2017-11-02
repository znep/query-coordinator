import React, { Component } from 'react';
import { Provider } from 'react-redux';
import I18n from '../../i18n';
import createStore from './AccessManagerStore';
import ConfigPropType from '../AccessManager/propTypes/ConfigPropType';
import AccessManager from '../AccessManager/components/AccessManager';
import { fetchPermissions, showAccessManager } from '../AccessManager/actions/AccessManagerActions';

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
    config: ConfigPropType.isRequired
  }

  constructor(props) {
    super(props);

    this.store = createStore({
      accessManager: {
        visible: false,
        headerText: I18n.t('shared.site_chrome.access_manager.header.title'),
        headerSubtitle: I18n.t('shared.site_chrome.access_manager.header.subtitle'),
        assetUid: props.config.assetUid,
        permissions: null,
        errors: []
      }
    });
  }

  componentDidMount() {
    this.store.dispatch(fetchPermissions());

    // shove a function onto window.socrata that shows the access manager
    if (!window.socrata) {
      window.socrata = {};
    }

    window.socrata.showAccessManager = () => {
      this.store.dispatch(showAccessManager());
    };
  }

  render() {
    const { config } = this.props;

    return (
      <Provider store={this.store}>
        <AccessManager config={config} />
      </Provider>
    );
  }
}

export default AccessManagerModalToggle;
