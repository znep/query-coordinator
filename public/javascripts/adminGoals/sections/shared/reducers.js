import * as ReduxImmutable from 'redux-immutablejs';
import * as Downloads from './downloads';

export default ReduxImmutable.combineReducers({
  downloads: Downloads.reducer
});
