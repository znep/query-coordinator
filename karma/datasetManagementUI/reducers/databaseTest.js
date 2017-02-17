import dbReducer from 'reducers/database';
import * as Actions from 'actions/database';

describe('reducers/database', () => {

  it('handles BATCH', () => {
    const initialDB = {};
    const operations = [
      Actions.createTable('my_table'),
      Actions.insertStarted('my_table', {id: 1, ego: 2, super_ego: 3}),
      Actions.insertSucceeded('my_table', {id: 1, ego: 2, super_ego: 3}),
      Actions.edit('my_table', {id: 1, ego: 5}),
      Actions.updateStarted('my_table', {id: 1, ego: 5}),
      Actions.updateSucceeded('my_table', {id: 1, ego: 5}),
      Actions.insertFromServer('my_table', {id: 2, ego: 77, super_ego: 88})
    ];
    const database = dbReducer(initialDB, Actions.batch(operations));
    const savedAt = database.my_table[0].__status__.savedAt;
    expect(new Date()).to.be.at.least(savedAt);
    expect(database).to.deep.equal({
      my_table: [
        {
          __status__: {
            savedAt: savedAt,
            type: "SAVED"
          },
          ego: 5,
          id: 1,
          super_ego: 3
        },
        {
          __status__: {
            savedAt: "ON_SERVER",
            type: "SAVED"
          },
          ego: 77,
          id: 2,
          super_ego: 88
        }
      ]
    });
  });

  it('handles EDIT', () => {
    const oldRecord = {
      id: 0,
      ego: 0,
      super_ego: 0,
      __status__: {
        savedAt: 'ON_SERVER',
        type: 'SAVED'
      }
    };

    const initialDB = {
      my_table: [oldRecord]
    };

    const updates = {id: 0, ego: 3, super_ego: 7};

    const beforeUpdate = new Date();
    const database = dbReducer(initialDB, Actions.edit('my_table', updates));

    const editedRecord = database.my_table[0];
    const dirtiedAt = editedRecord.__status__.dirtiedAt;
    expect(dirtiedAt).to.be.at.least(beforeUpdate);

    expect(database).to.deep.equal({
      my_table: [{
        __status__: {
          type: 'DIRTY',
          dirtiedAt,
          oldRecord
        },
        id: 0,
        ego: 3,
        super_ego: 7
      }]
    });
  });

  it('handles EDIT_IMMUTABLE', () => {
    const oldRecord = {
      id: 0,
      ego: 0,
      super_ego: 0,
      __status__: {
        savedAt: 'ON_SERVER',
        type: 'SAVED'
      }
    };

    const initialDB = {
      my_table: [oldRecord]
    };

    const updates = {id: 0, ego: 3, super_ego: 7};

    const beforeUpdate = new Date();
    const database = dbReducer(initialDB, Actions.editImmutable('my_table', updates));

    const editedRecord = database.my_table[0];
    const dirtiedAt = editedRecord.__status__.dirtiedAt;
    expect(dirtiedAt).to.be.at.least(beforeUpdate);

    expect(database).to.deep.equal({
      my_table: [{
        __status__: {
          type: 'DIRTY_IMMUTABLE',
          dirtiedAt,
          oldRecord
        },
        id: 0,
        ego: 3,
        super_ego: 7
      }]
    });
  });

  it('handles REVERT_EDITS', () => {
    const initialDB = {
      my_table: [
        {
          __status__: {
            type: 'DIRTY_IMMUTABLE',
            dirtiedAt: new Date,
            oldRecord: {
              id: 0,
              ego: 0,
              super_ego: 0
            }
          },
          id: 0,
          ego: 3,
          super_ego: 7
        }
      ]
    };

    const database = dbReducer(initialDB, Actions.revertEdits('my_table', 0));

    expect(database).to.deep.equal({
      my_table: [{
        __status__: {
          type: 'SAVED',
          savedAt: 'ON_SERVER'
        },
        id: 0,
        ego: 0,
        super_ego: 0
      }]
    });
  });

  it('handles INSERT_FROM_SERVER', () => {
    const initialDB = {
      my_table: []
    };

    const newRecord = {id: 0, ego: 3, super_ego: 7};

    expect(dbReducer(initialDB, Actions.insertFromServer('my_table', newRecord))).to.deep.equal({
      my_table: [{
        ...newRecord,
        __status__: {
          savedAt: 'ON_SERVER',
          type: 'SAVED'
        }
      }]
    });
  });

  it('handles INSERT_STARTED', () => {
    const initialDB = {
      my_table: []
    };
    const newRecord = {id: 0, ego: 3, super_ego: 7};
    const database = dbReducer(initialDB, Actions.insertStarted('my_table', newRecord));
    const startedAt = database.my_table[0].__status__.startedAt;
    expect(new Date()).to.be.at.least(startedAt);
    expect(database).to.deep.equal({
      my_table: [{
        __status__: {
          type: 'INSERTING',
          newRecord,
          startedAt
        },
        id: 0,
        ego: 3,
        super_ego: 7
      }]
    });
  });

  it('handles INSERT_SUCCEEDED', () => {
    const newRecord = {id: 0, ego: 3, super_ego: 7};
    const initialDB = {
      my_table: [{
        __status__: {
          type: 'INSERTING',
          startedAt: new Date(),
          newRecord: newRecord
        },
        id: 0,
        ego: 3,
        super_ego: 7
      }]
    };

    const action = Actions.insertSucceeded('my_table', newRecord);
    const database = dbReducer(initialDB, action);
    const savedAt = database.my_table[0].__status__.savedAt;
    expect(database).to.deep.equal({
      my_table: [{
        __status__: {
          type: 'SAVED',
          savedAt: savedAt
        },
        id: 0,
        ego: 3,
        super_ego: 7
      }]
    });
  });

  it('handles INSERT_FAILED', () => {
    const newRecord = {id: 0, ego: 3, super_ego: 7};
    const initialDB = {
      my_table: [{
        __status__: {
          type: 'INSERTING',
          startedAt: new Date(),
          newRecord: newRecord
        },
        id: 0,
        ego: 3,
        super_ego: 7
      }]
    };

    const beforeFailed = new Date();
    const error = 'o noes';
    const action = Actions.insertFailed('my_table', newRecord, error);
    const database = dbReducer(initialDB, action);
    const failedAt = database.my_table[0].__status__.failedAt;
    expect(failedAt).to.be.at.least(beforeFailed);
    expect(database).to.deep.equal({
      my_table: [{
        __status__: {
          type: 'INSERT_FAILED',
          failedAt,
          error,
          newRecord
        },
        id: 0,
        ego: 3,
        super_ego: 7
      }]
    });
  });

  it('handles UPDATE_STARTED', () => {
    const initialDB = {
      my_table: [{
        __status__: {
          type: 'DIRTY',
          oldRecord: {id: 0, ego: 3, super_ego: 0},
          dirtiedAt: new Date()
        },
        id: 0,
        ego: 3,
        super_ego: 7
      }]
    };

    const updates = {id: 0, super_ego: 7};

    const beforeUpdate = new Date();

    const database = dbReducer(initialDB, Actions.updateStarted('my_table', updates));
    const startedAt = database.my_table[0].__status__.startedAt;

    expect(startedAt).to.be.at.least(beforeUpdate);

    expect(database).to.deep.equal({
      my_table: [{
        __status__: {
          type: 'UPDATING',
          percentCompleted: 0,
          updates,
          startedAt
        },
        id: 0,
        ego: 3,
        super_ego: 7
      }]
    });
  });

  it('handles UPDATE_SUCCEEDED', () => {
    const initialDB = {
      my_table: [{
        __status__: {
          type: 'UPDATING',
          percentCompleted: 0,
          updates: {id: 0, super_ego: 7},
          startedAt: new Date()
        },
        id: 0,
        ego: 3,
        super_ego: 7
      }]
    };

    const updated = {id: 0, ego: 3, super_ego: 7};

    const beforeSuccess = new Date();

    const database = dbReducer(initialDB, Actions.updateSucceeded('my_table', updated));
    const savedAt = database.my_table[0].__status__.savedAt;
    expect(savedAt).to.be.at.least(beforeSuccess);

    expect(database).to.deep.equal({
      my_table: [{
        __status__: {
          type: 'SAVED',
          savedAt
        },
        ...updated
      }]
    });
  });

  it('handles UPDATE_FROM_SERVER', () => {
    const initialDB = {
      my_table: [{
        id: 0,
        ego: 0,
        super_ego: 0,
        __status__: {
          savedAt: 'ON_SERVER',
          type: 'SAVED'
        }
      }]
    };

    const updates = {id: 0, ego: 3, super_ego: 7};
    const action = Actions.updateFromServer('my_table', updates);

    expect(dbReducer(initialDB, action)).to.deep.equal({
      my_table: [{
        id: 0,
        ego: 3,
        super_ego: 7,
        __status__: {
          savedAt: 'ON_SERVER',
          type: 'SAVED'
        }
      }]
    });
  });

  it('handles UPDATE_PROGRESS', () => {
    const startedAt = new Date();

    const initialDB = {
      my_table: [{
        __status__: {
          type: 'UPDATING',
          percentCompleted: 0,
          updates: {id: 0, super_ego: 7},
          startedAt
        },
        id: 0,
        ego: 3,
        super_ego: 7
      }]
    };

    const updates = {id: 0, super_ego: 7};
    expect(dbReducer(initialDB, Actions.updateProgress('my_table', updates, 42))).to.deep.equal({
      my_table: [{
        __status__: {
          type: 'UPDATING',
          percentCompleted: 42,
          updates,
          startedAt
        },
        id: 0,
        ego: 3,
        super_ego: 7
      }]
    });
  });

  it('handles UPDATE_FAILED', () => {
    const startedAt = new Date();

    const initialDB = {
      my_table: [{
        __status__: {
          type: 'UPDATING',
          percentCompleted: 0,
          updates: {id: 0, super_ego: 7},
          startedAt
        },
        id: 0,
        ego: 3,
        super_ego: 7
      }]
    };

    const error = 'The cigar is just a cigar';
    const updates = {id: 0, super_ego: 7};

    const beforeUpdate = new Date();
    const database = dbReducer(initialDB, Actions.updateFailed('my_table', updates, error));
    const failedAt = database.my_table[0].__status__.failedAt;

    expect(failedAt).to.be.at.least(beforeUpdate);

    expect(database).to.deep.equal({
      my_table: [{
        __status__: {
          type: 'UPDATE_FAILED',
          updates,
          error,
          failedAt
        },
        id: 0,
        ego: 3,
        super_ego: 7
      }]
    });
  });

  it('handles CREATE_TABLE', () => {
    const emptyDB = {};
    expect(dbReducer(emptyDB, Actions.createTable('my_table'))).to.deep.equal({
      my_table: []
    });
  });

  it('Throws on invalid table name', () => {
    const initialDB = {};
    const badInsert = () =>
      dbReducer(initialDB, Actions.insertStarted('missingTable', {}));

    expect(badInsert).to.throw(ReferenceError);
  });
});
