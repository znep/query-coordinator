import metadataReducer, { getInitialState } from 'reducers/metadata';
import { updateMetadata } from 'actions/manageMetadata';

describe('metadata reducer', () => {

  window.initialState = {
    view: {
      name: 'Initial Name',
      description: 'initial description'
    }
  };
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

});
