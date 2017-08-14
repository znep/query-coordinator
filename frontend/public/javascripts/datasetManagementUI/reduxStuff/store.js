import { createStore, compose } from 'redux';
import rootReducer from 'reduxStuff/reducers/rootReducer';
import middleware from 'reduxStuff/middleware';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export default createStore(rootReducer, composeEnhancers(middleware));
