import sinon from 'sinon';
import { expect, assert } from 'chai';
import _ from 'lodash';
import { Simulate } from 'react-addons-test-utils';
import { getStoreWithOutputSchema } from '../data/storeWithOutputSchema';
import ReadyToImport from 'components/ReadyToImport';
import * as Selectors from 'selectors';
import {
  insertFromServer, insertMultipleFromServer, updateFromServer
} from 'actions/database';
import { normal } from 'lib/displayState';

/* eslint-disable new-cap */
describe('components/ReadyToImport', () => {

  const store = getStoreWithOutputSchema();
  const storeDb = store.getState().db;
  const spy = sinon.spy();
  // rendering unconnected version so we can pass in a spy instead of
  // going through mapDispatchToProps
  const props = {
    db: storeDb,
    outputSchema: _.values(storeDb.output_schemas)[0],
    readyToImport: {
      modalVisible: false,
      modalIndex: 0
    }
  };

  it('renders without the modal', () => {
    const element = renderComponentWithStore(ReadyToImport, props, store);
    assert.isNull(element.querySelector('.modalInception'));
  });

  it('renders the modal when clicked', () => {
    const element = renderComponentWithStore(ReadyToImport, props, store);
    Simulate.click(element.querySelector('.helpModalIcon'));
    assert.isNotNull(element.querySelector('.modalInception'));
  });

  function classesOf(el) {
    return Array.from(el.classList.entries()).map(([_, c]) => c);
  }

  it('can page through the modal', () => {
    const element = renderComponentWithStore(ReadyToImport, props, store);
    Simulate.click(element.querySelector('.helpModalIcon'));
    assert.isNotNull(element.querySelector('.modalInception'));

    assert.include(classesOf(element.querySelectorAll('.dot')[0]), 'dotSelected');
    assert.notInclude(classesOf(element.querySelectorAll('.dot')[1]), 'dotSelected');
    assert.notInclude(classesOf(element.querySelectorAll('.dot')[2]), 'dotSelected');

    Simulate.click(element.querySelector('.nextButton'));
    assert.notInclude(classesOf(element.querySelectorAll('.dot')[0]), 'dotSelected');
    assert.include(classesOf(element.querySelectorAll('.dot')[1]), 'dotSelected');
    assert.notInclude(classesOf(element.querySelectorAll('.dot')[2]), 'dotSelected');

    Simulate.click(element.querySelector('.nextButton'));
    assert.notInclude(classesOf(element.querySelectorAll('.dot')[0]), 'dotSelected');
    assert.notInclude(classesOf(element.querySelectorAll('.dot')[1]), 'dotSelected');
    assert.include(classesOf(element.querySelectorAll('.dot')[2]), 'dotSelected');

    Simulate.click(element.querySelector('.nextButton'));
    assert.isNull(element.querySelector('.modalInception'));
  });

});
