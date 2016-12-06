import dataReducer, { getInitialState } from 'reducers/data';
import { openDataModal, closeDataModal } from 'actions/manageData';

describe('data reducer', () => {

  const initialState = getInitialState();

  it('handles OPEN_DATA_MODAL', () => {
    const action = openDataModal();
    const newState = dataReducer(
      {...initialState,
       modalOpen: false },
      action
    );
    expect(newState.modalOpen).to.eql(true);
  });

  it('handles CLOSE_DATA_MODAL', () => {
    const action = closeDataModal();
    const newState = dataReducer(
      {...initialState,
       modalOpen: true },
      action
    );
    expect(newState.modalOpen).to.eql(false);
  });

});
