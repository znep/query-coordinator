import { assert } from 'chai';
import PublishButton from 'components/PublishButton';
import { getStoreWithOutputSchema } from '../data/storeWithOutputSchema';
import { getDefaultStore } from '../testStore';
import {
  upsertFromServer, upsertMultipleFromServer, updateFromServer
} from 'actions/database';

const defaultProps = {};

describe('"Publish Dataset" button and flyout', () => {

  it('is disabled when there is no output schema', () => {
    const store = getDefaultStore();
    const element = renderComponentWithStore(PublishButton, defaultProps, store);
    assert.equal(element.querySelector('button').disabled, true);
    assert.equal(element.querySelectorAll('.flyout .notChecked').length, 1); // metadata satisfied, data not
  });

  it('is disabled when the upload is in progress', () => {
    const store = getStoreWithOutputSchema();
    store.dispatch(updateFromServer('transforms', {
      id: 1,
      contiguous_rows_processed: 2
    }));
    store.dispatch(updateFromServer('transforms', {
      id: 2,
      contiguous_rows_processed: 3
    }));
    const element = renderComponentWithStore(PublishButton, defaultProps, store);
    assert.equal(element.querySelector('button').disabled, true);
    assert.equal(element.querySelectorAll('.flyout .notChecked').length, 1); // metadata satisfied, data not
  });

  it('is disabled when the upload is done but not all columns have caught up', () => {
    const store = getStoreWithOutputSchema();
    store.dispatch(updateFromServer('input_schemas', {
      id: 4,
      total_rows: 50
    }));
    store.dispatch(updateFromServer('transforms', {
      id: 1,
      contiguous_rows_processed: 2
    }));
    store.dispatch(updateFromServer('transforms', {
      id: 2,
      contiguous_rows_processed: 3
    }));
    const element = renderComponentWithStore(PublishButton, defaultProps, store);
    assert.equal(element.querySelector('button').disabled, true);
    assert.equal(element.querySelectorAll('.flyout .notChecked').length, 1); // metadata satisfied, data not
  });

  it('is enabled when the upload is done and all columns have caught up', () => {
    const store = getStoreWithOutputSchema();
    store.dispatch(updateFromServer('input_schemas', {
      id: 4,
      total_rows: 50
    }));
    store.dispatch(updateFromServer('transforms', {
      id: 1,
      contiguous_rows_processed: 50
    }));
    store.dispatch(updateFromServer('transforms', {
      id: 2,
      contiguous_rows_processed: 50
    }));
    const element = renderComponentWithStore(PublishButton, defaultProps, store);
    assert.equal(element.querySelector('button').disabled, false);
    assert.equal(element.querySelectorAll('.flyout .notChecked').length, 0); // metadata & data satisfied
  });

  it('is disabled when metadata is invalid', () => {
    const oldCustomMetadata = window.initialState.customMetadata;
    window.initialState.customMetadata = [
      {
        name: 'A fieldset with a required field',
        fields: [
          { name: 'my field', required: true }
        ]
      }
    ];
    const store = getDefaultStore();
    const element = renderComponentWithStore(PublishButton, defaultProps, store);
    assert.equal(element.querySelector('button').disabled, true);
    assert.equal(element.querySelectorAll('.flyout .notChecked').length, 2); // neither satisfied
    window.initialState.customMetadata = oldCustomMetadata;
  });

});
