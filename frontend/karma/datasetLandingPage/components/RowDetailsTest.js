import { expect, assert } from 'chai';
import RowDetails from 'datasetLandingPage/components/RowDetails';
import { getDefaultStore } from '../testStore';

describe('components/RowDetails', () => {

  // rest of the tests have moved to karma/common/rowDetails/components/RowDetailsTest
  // this is just testing mapStateToProps

  it('renders an element', () => {
    window.initialState = {
      view: {
        columns: [],
        rowLabel: 'row',
        rowCount: 62
      }
    };

    const store = getDefaultStore();
    const element = renderComponentWithStore(RowDetails, {}, store);

    assert.isNotNull(element);

    delete window.initialState;
  });

});
