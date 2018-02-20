import noop from 'lodash/fp/noop';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { applyMiddleware, compose, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import Localization, { DEFAULT_LOCALE } from 'common/i18n/components/Localization';
import ToastNotification from 'common/components/ToastNotification';
import { customConnect, I18nPropType } from 'common/connectUtils';

import LoadingSpinner from '../../adminActivityFeed/components/LoadingSpinner';
import * as Actions from '../actions';
import * as Selectors from '../adminRolesSelectors';
import { LOAD_DATA_FAILURE, LOADING } from '../appStates';
import reducer from '../reducers/RolesAdminReducer';
import sagas from '../sagas';
import EditBar from './EditBar';
import SaveBar from './SaveBar';
import RolesGrid from './grid/RolesGrid';
import EditCustomRoleModal from './modal/EditCustomRoleModal';
import styles from './roles-admin.module.scss';
import AppError from './util/AppError';

const sagaMiddleware = createSagaMiddleware();

const mapStateToProps = (state, { I18n }) => {
  const appState = Selectors.getAppState(state);
  const notificationObj = Selectors.getNotificationFromState(state);
  const notification = notificationObj
    .update('content', content => I18n.t(content, notificationObj.toJS()))
    .toJS();
  return {
    hasLoadDataFailure: appState === LOAD_DATA_FAILURE,
    isLoading: appState === LOADING,
    notification
  };
};

const mapDispatchToProps = {
  loadData: Actions.loadData,
  dismissNotification: Actions.showNotificationEnd
};

class UnstyledRolesAdmin extends Component {
  static propTypes = {
    I18n: I18nPropType,
    hasLoadDataFailure: PropTypes.bool.isRequired,
    isLoading: PropTypes.bool.isRequired,
    notification: PropTypes.object.isRequired,
    dismissNotification: PropTypes.func.isRequired
  };

  componentDidMount() {
    this.props.loadData();
  }

  render() {
    const {
      I18n,
      hasLoadDataFailure,
      isLoading,
      notification,
      dismissNotification
    } = this.props;
    return (
      <div>
        <ToastNotification {...notification} onDismiss={dismissNotification}>
          <span dangerouslySetInnerHTML={{ __html: notification.content }} />
        </ToastNotification>
        {hasLoadDataFailure ? (
          <AppError />
        ) : (
          <div>
            <EditCustomRoleModal />
            <EditBar />
            <div styleName="content">
              <div styleName="description">
                <h2>{I18n.t('screens.admin.roles.index_page.description.title')}</h2>
                <p>{I18n.t('screens.admin.roles.index_page.description.content')}</p>
              </div>
              {isLoading ? (
                <div styleName="loading-spinner">
                  <LoadingSpinner />
                </div>
              ) : (
                <div>
                  <RolesGrid />
                </div>
              )}
            </div>
            <SaveBar />
          </div>
        )}
      </div>
    );
  }
}

const RolesAdmin = customConnect({ mapStateToProps, mapDispatchToProps, styles })(UnstyledRolesAdmin);

const devToolsConfig = {
  actionsBlacklist: ['HOVER_ROW', 'UNHOVER_ROW', 'CHANGE_NEW_ROLE_NAME'],
  name: 'Roles & Permissions Admin'
};

// TODO: standardize redux/react app bootstrapping - EN-22364
const createRolesAdminStore = (serverConfig = {}) => {
  const initialState = Selectors.getInitialState(serverConfig);
  const middleware = [sagaMiddleware];

  const composeEnhancers =
    (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ &&
      window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__(devToolsConfig)) ||
    compose;
  const store = createStore(reducer(noop), initialState, composeEnhancers(applyMiddleware(...middleware)));
  sagaMiddleware.run(sagas);
  return store;
};

const App = ({ store, serverConfig = {} }) => (
  <Localization locale={serverConfig.locale || DEFAULT_LOCALE}>
    <Provider store={store}>
      <RolesAdmin />
    </Provider>
  </Localization>
);

export { UnstyledRolesAdmin, RolesAdmin, createRolesAdminStore };

export default App;
