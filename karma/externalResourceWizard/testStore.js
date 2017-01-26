import externalResourceWizardReducers from 'reducers';

export function getDefaultStore() {
  return redux.createStore(externalResourceWizardReducers);
}
