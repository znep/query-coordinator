import * as ReduxImmutable from 'redux-immutablejs';
import * as Downloads from './downloads';
import * as Loading from './loading';

export default ReduxImmutable.combineReducers({
  downloads: Downloads.reducer,
  loading: Loading.reducer
});
