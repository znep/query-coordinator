import PropTypes from 'prop-types';
import React, { Component } from 'react';
import cssModules from 'react-css-modules';
import styles from './roles-admin.scss';
import SaveBar from './SaveBar';
import EditBar from './EditBar';
import { applyMiddleware, bindActionCreators, compose, createStore } from 'redux';
import thunk from 'redux-thunk';
import { connect, Provider } from 'react-redux';
import noop from 'lodash/fp/noop';
import reducer from '../reducers/RolesAdminReducer';
import EditCustomRoleModal from './modal/EditCustomRoleModal';
import { LOAD_DATA_FAILURE, LOADING } from '../appStates';
import { loadData, showNotification } from '../actions';
import LoadingSpinner from '../../adminActivityFeed/components/LoadingSpinner';
import Notification from './util/Notification';
import AppError from './util/AppError';
import RolesGrid from './grid/RolesGrid';
import { getAppState, getInitialState, getNotificationFromState } from '../selectors';
import Localization, { connectLocalization } from 'common/components/Localization';

const renderWithLocalization = ({ translations, locale, localePrefix }, children) => {
  return (
    <Localization
      translations={translations}
      locale={locale || 'en'}
      localePrefix={localePrefix}
      returnKeyForNotFound={true}
    >
      {children}
    </Localization>
  );
};

const mapStateToProps = (state, { localization: { translate } }) => {
  const appState = getAppState(state);
  const notificationObj = getNotificationFromState(state);
  const notification = notificationObj
    .update('content', content => translate(content, notificationObj.toJS()))
    .toJS();
  return {
    hasLoadDataFailure: appState === LOAD_DATA_FAILURE,
    isLoading: appState === LOADING,
    notification
  };
};

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      loadData,
      dismissNotification: showNotification.end
    },
    dispatch
  );

class UnstyledRolesAdmin extends Component {
  componentDidMount() {
    this.props.loadData();
  }

  render() {
    const {
      hasLoadDataFailure,
      isLoading,
      notification,
      dismissNotification,
      localization: { translate }
    } = this.props;
    return (
      <div>
        <Notification {...notification} onDismiss={dismissNotification} canDismiss />
        {hasLoadDataFailure
          ? <AppError />
          : <div>
              <EditCustomRoleModal />
              <EditBar />
              <div styleName="content">
                <div styleName="description">
                  <h2>
                    {translate('screens.admin.roles.index_page.description.title')}
                  </h2>
                  <p>
                    {translate('screens.admin.roles.index_page.description.content')}
                  </p>
                </div>
                {isLoading
                  ? <div styleName="loading-spinner">
                      <LoadingSpinner />
                    </div>
                  : <div>
                      <RolesGrid />
                    </div>}
              </div>
              <SaveBar />
            </div>}
      </div>
    );
  }
}

UnstyledRolesAdmin.propTypes = {
  hasLoadDataFailure: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  notification: PropTypes.object.isRequired,
  dismissNotification: PropTypes.func.isRequired
};

const RolesAdmin = connectLocalization(
  connect(mapStateToProps, mapDispatchToProps)(cssModules(UnstyledRolesAdmin, styles))
);

const createRolesAdminStore = (serverConfig = {}) => {
  const initialState = getInitialState(serverConfig);
  const middleware = [thunk];
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
  return createStore(reducer(noop), initialState, composeEnhancers(applyMiddleware(...middleware)));
};

const App = ({store, serverConfig = {}}) =>
  renderWithLocalization(
    serverConfig,
    <Provider store={store}>
      <RolesAdmin />
    </Provider>
  );

export { UnstyledRolesAdmin, RolesAdmin, createRolesAdminStore };

export default App;
