import { combineReducers } from 'redux';

import view from './view';
import editor from './editor';

export default combineReducers({ view, editor });
