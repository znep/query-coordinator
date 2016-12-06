import metadataReducer, { getInitialState } from 'reducers/metadata';
import { updateMetadata, openMetadataModal, closeMetadataModal } from 'actions/manageMetadata';

describe('metadata reducer', () => {

  const initialState = getInitialState();

  it('handles UPDATE_METADATA for name', () => {
    const action = updateMetadata('name', 'New Name');
    const newState = metadataReducer(initialState, action);
    expect(newState.name).to.eql('New Name');
  });

  it('handles UPDATE_METADATA for description', () => {
    const action = updateMetadata('description', 'new description');
    const newState = metadataReducer(initialState, action);
    expect(newState.description).to.eql('new description');
  });

  it('handles OPEN_METADATA_MODAL', () => {
    const action = openMetadataModal();
    const newState = metadataReducer(
      {...initialState,
       modalOpen: false },
      action
    );
    expect(newState.modalOpen).to.eql(true);
  });

  it('handles CLOSE_METADATA_MODAL', () => {
    const action = closeMetadataModal();
    const newState = metadataReducer(
      {...initialState,
       modalOpen: true },
      action
    );
    expect(newState.modalOpen).to.eql(false);
  });

});
