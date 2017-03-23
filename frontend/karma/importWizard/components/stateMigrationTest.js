import { migrateState } from 'stateMigration';

describe('migrateState', function() {

  it('migrates from version 0 to version 1', () =>  {
    const state = {
      datasetId: "meow-meow",
      metadata: {
        contents: {
          license: {
            sourceLink: null
          }
        }
      }
    };

    const migratedState = migrateState(state);
    expect(migratedState.metadata.contents.license.sourceLink).to.eql('');
    expect(migratedState.datasetId).to.eql('meow-meow');
  })
})
