import _ from 'lodash';
import dbReducer from 'reducers/database';
import * as Actions from 'actions/database';
import { statusSavedOnServer } from 'lib/database/statuses';

describe('reducers/database', () => {

  it('handles BATCH', () => {
    const initialDB = {};
    const operations = [
      Actions.createTable('my_table'),
      Actions.insertStarted('my_table', { ego: 2, super_ego: 3 }),
      Actions.insertSucceeded('my_table', { ego: 2, super_ego: 3 }, { id: 1 }),
      Actions.edit('my_table', { id: 1, ego: 5 }),
      Actions.updateStarted('my_table', { id: 1, ego: 5 }),
      Actions.updateSucceeded('my_table', { id: 1, ego: 5 }),
      Actions.insertFromServer('my_table', { id: 2, ego: 77, super_ego: 88 })
    ];
    const database = dbReducer(initialDB, Actions.batch(operations));
    const savedAt = _.values(database.my_table)[0].__status__.savedAt;
    expect(new Date()).to.be.at.least(savedAt);
    expect(database).to.deep.equal({
      my_table: {
        1: {
          __status__: {
            savedAt: savedAt,
            type: "SAVED"
          },
          ego: 5,
          id: 1,
          super_ego: 3
        },
        2: {
          __status__: {
            savedAt: "ON_SERVER",
            type: "SAVED"
          },
          ego: 77,
          id: 2,
          super_ego: 88
        }
      }
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
      my_table: { 0: oldRecord }
    };

    const updates = { id: 0, ego: 3, super_ego: 7 };

    const beforeUpdate = new Date();
    const database = dbReducer(initialDB, Actions.edit('my_table', updates));

    const editedRecord = database.my_table[0];
    const dirtiedAt = editedRecord.__status__.dirtiedAt;
    expect(dirtiedAt).to.be.at.least(beforeUpdate);

    expect(database).to.deep.equal({
      my_table: {
        0: {
          __status__: {
            type: 'DIRTY',
            dirtiedAt,
            oldRecord
          },
          id: 0,
          ego: 3,
          super_ego: 7
        }
      }
    });
  });

  it('handles nested datastructure EDIT', () => {
    const oldRecord = {
      id: 0,
      tags: [{id: 1, name: 'one'}, {id: 2, name: 'two'}],
      __status__: {
        savedAt: 'ON_SERVER',
        type: 'SAVED'
      }
    };

    const initialDB = {
      my_table: { 0: oldRecord }
    };

    const updates = {id:0, tags: [{id: 1, name: 'one'}]};

    const beforeUpdate = new Date();
    const database = dbReducer(initialDB, Actions.edit('my_table', updates));

    const editedRecord = database.my_table[0];
    const dirtiedAt = editedRecord.__status__.dirtiedAt;
    expect(dirtiedAt).to.be.at.least(beforeUpdate);

    expect(database).to.deep.equal({
      my_table: {
        0: {
          __status__: {
            type: 'DIRTY',
            dirtiedAt,
            oldRecord
          },
          tags: [{id: 1, name: 'one'}],
          id: 0
        }
      }
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
      my_table: { 0: oldRecord }
    };

    const updates = { id: 0, ego: 3, super_ego: 7 };

    const beforeUpdate = new Date();
    const database = dbReducer(initialDB, Actions.editImmutable('my_table', updates));

    const editedRecord = database.my_table[0];
    const dirtiedAt = editedRecord.__status__.dirtiedAt;
    expect(dirtiedAt).to.be.at.least(beforeUpdate);

    expect(database).to.deep.equal({
      my_table: {
        0: {
          __status__: {
            type: 'DIRTY_IMMUTABLE',
            dirtiedAt,
            oldRecord
          },
          id: 0,
          ego: 3,
          super_ego: 7
        }
      }
    });
  });

  it('handles REVERT_EDITS', () => {
    const initialDB = {
      my_table: {
        0: {
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
      }
    };

    const database = dbReducer(initialDB, Actions.revertEdits('my_table', 0));

    expect(database).to.deep.equal({
      my_table: {
        0: {
          __status__: {
            type: 'SAVED',
            savedAt: 'ON_SERVER'
          },
          id: 0,
          ego: 0,
          super_ego: 0
        }
      }
    });
  });

  describe('INSERT_FROM_SERVER', () => {

    it('handles if record doesn\'t exist', () => {
      const initialDB = {
        my_table: {}
      };

      const newRecord = { id: 0, ego: 3, super_ego: 7 };

      expect(dbReducer(initialDB, Actions.insertFromServer('my_table', newRecord))).to.deep.equal({
        my_table: {
          0: {
            ...newRecord,
            __status__: {
              savedAt: 'ON_SERVER',
              type: 'SAVED'
            }
          }
        }
      });
    });

    it('throws if record already exists', () => {
      const initialDB = {
        my_table: {
          0: { ego: 5, super_ego: 7 }
        }
      };

      const newRecord = { id: 0, ego: 3, super_ego: 7 };

      const badInsert = () =>
        dbReducer(initialDB, Actions.insertFromServer('my_table', newRecord));

      expect(badInsert).to.throw(ReferenceError);
    });

    it('does nothing if record with that id exists but `options.ifNotExists`', () => {
      // even if you supply different attributes
      const initialDB = {
        my_table: {
          0: {
            __status__: statusSavedOnServer,
            id: 0,
            ego: 5,
            super_ego: 7
          }
        }
      };

      const newRecord = { id: 0, ego: 3, super_ego: 7 };
      const action = Actions.insertFromServer('my_table', newRecord, { ifNotExists: true });
      expect(dbReducer(initialDB, action)).to.deep.equal({
        my_table: {
          0: {
            __status__: statusSavedOnServer,
            id: 0,
            ego: 5,
            super_ego: 7
          }
        }
      });
    });

  });

  // TODO: insertMultipleFromServer

  it('handles INSERT_FROM_SERVER_IF_NOT_EXISTS', () => {
    const initialDB = {
      my_table: {}
    };

    const newRecord = { id: 0, ego: 3, super_ego: 7 };

    expect(dbReducer(initialDB, Actions.insertFromServerIfNotExists('my_table', newRecord))).to.deep.equal({
      my_table: {
        0: {
          ...newRecord,
          __status__: {
            savedAt: 'ON_SERVER',
            type: 'SAVED'
          }
        }
      }
    });
  });

  it('handles INSERT_STARTED', () => {
    const initialDB = {
      my_table: {}
    };
    const newRecord = { ego: 3, super_ego: 7 };

    const database = dbReducer(initialDB, Actions.insertStarted('my_table', newRecord));
    const startedAt = _.values(database.my_table)[0].__status__.startedAt;
    expect(new Date()).to.be.at.least(startedAt);
    const insertedRecord = _.values(database.my_table)[0];
    expect(_.omit(insertedRecord, 'id')).to.deep.equal({
      __status__: {
        type: 'INSERTING',
        startedAt
      },
      ego: 3,
      super_ego: 7
    });
    expect(_.startsWith(insertedRecord.id, 'saving-')).to.be.true;
  });

  it('handles INSERT_SUCCEEDED', () => {
    const additional = { id: 0, additional: 8 };
    const newRecord = {
      ego: 3,
      super_ego: 7
    };
    const initialDB = {
      my_table: {
        'saving-2348761234-asdfkjlj-324234': {
          __status__: {
            type: 'INSERTING',
            startedAt: new Date(),
            newRecord
          },
          id: 'saving-2348761234-asdfkjlj-324234',
          ego: 3,
          super_ego: 7
        }
      }
    };

    const action = Actions.insertSucceeded('my_table', newRecord, additional);
    const database = dbReducer(initialDB, action);
    const savedAt = _.values(database.my_table)[0].__status__.savedAt;
    expect(database).to.deep.equal({
      my_table: {
        0: {
          __status__: {
            type: 'SAVED',
            savedAt: savedAt
          },
          id: 0,
          ego: 3,
          super_ego: 7,
          additional: 8
        }
      }
    });
  });

  it('handles INSERT_FAILED', () => {
    const newRecord = { ego: 3, super_ego: 7 };
    const initialDB = {
      my_table: {
        'saving-some-uuid': {
          __status__: {
            type: 'INSERTING',
            startedAt: new Date()
          },
          id: 'saving-some-uuid',
          ego: 3,
          super_ego: 7
        }
      }
    };

    const beforeFailed = new Date();
    const error = 'o noes';
    const action = Actions.insertFailed('my_table', newRecord, error);
    const database = dbReducer(initialDB, action);
    const failedAt = _.values(database.my_table)[0].__status__.failedAt;
    expect(failedAt).to.be.at.least(beforeFailed);
    expect(database).to.deep.equal({
      my_table: {
        'saving-some-uuid': {
          __status__: {
            type: 'INSERT_FAILED',
            failedAt,
            error,
            newRecord
          },
          id: 'saving-some-uuid',
          ego: 3,
          super_ego: 7
        }
      }
    });
  });

  it('handles UPDATE_STARTED', () => {
    const initialDB = {
      my_table: {
        0: {
          __status__: {
            type: 'DIRTY',
            oldRecord: {id: 0, ego: 3, super_ego: 0},
            dirtiedAt: new Date()
          },
          id: 0,
          ego: 3,
          super_ego: 7
        }
      }
    };

    const updates = { id: 0, super_ego: 7 };

    const beforeUpdate = new Date();

    const database = dbReducer(initialDB, Actions.updateStarted('my_table', updates));
    const startedAt = database.my_table[0].__status__.startedAt;

    expect(startedAt).to.be.at.least(beforeUpdate);

    expect(database).to.deep.equal({
      my_table: {
        0: {
          __status__: {
            type: 'UPDATING',
            percentCompleted: 0,
            updates,
            startedAt
          },
          id: 0,
          ego: 3,
          super_ego: 7
        }
      }
    });
  });

  // TODO: updateImmutableStarted

  it('handles UPDATE_SUCCEEDED', () => {
    const initialDB = {
      my_table: {
        0: {
          __status__: {
            type: 'UPDATING',
            percentCompleted: 0,
            updates: {id: 0, super_ego: 7},
            startedAt: new Date()
          },
          id: 0,
          ego: 3,
          super_ego: 7
        }
      }
    };

    const updated = { id: 0, ego: 3, super_ego: 7 };

    const beforeSuccess = new Date();

    const database = dbReducer(initialDB, Actions.updateSucceeded('my_table', updated));
    const savedAt = database.my_table[0].__status__.savedAt;
    expect(savedAt).to.be.at.least(beforeSuccess);

    expect(database).to.deep.equal({
      my_table: {
        0: {
          __status__: {
            type: 'SAVED',
            savedAt
          },
          ...updated
        }
      }
    });
  });

  it('handles UPDATE_FROM_SERVER', () => {
    const initialDB = {
      my_table: {
        0: {
          id: 0,
          ego: 0,
          super_ego: 0,
          __status__: {
            savedAt: 'ON_SERVER',
            type: 'SAVED'
          }
        }
      }
    };

    const updates = { id: 0, ego: 3, super_ego: 7 };
    const action = Actions.updateFromServer('my_table', updates);

    expect(dbReducer(initialDB, action)).to.deep.equal({
      my_table: {
        0: {
          id: 0,
          ego: 3,
          super_ego: 7,
          __status__: {
            savedAt: 'ON_SERVER',
            type: 'SAVED'
          }
        }
      }
    });
  });

  it('handles UPDATE_PROGRESS', () => {
    const startedAt = new Date();

    const initialDB = {
      my_table: {
        0: {
          __status__: {
            type: 'UPDATING',
            percentCompleted: 0,
            updates: {id: 0, super_ego: 7},
            startedAt
          },
          id: 0,
          ego: 3,
          super_ego: 7
        }
      }
    };

    const updates = { id: 0, super_ego: 7 };
    expect(dbReducer(initialDB, Actions.updateProgress('my_table', updates, 42))).to.deep.equal({
      my_table: {
        0: {
          __status__: {
            type: 'UPDATING',
            percentCompleted: 42,
            updates,
            startedAt
          },
          id: 0,
          ego: 3,
          super_ego: 7
        }
      }
    });
  });

  it('handles UPDATE_FAILED', () => {
    const startedAt = new Date();

    const initialDB = {
      my_table: {
        0: {
          __status__: {
            type: 'UPDATING',
            percentCompleted: 0,
            updates: {id: 0, super_ego: 7},
            startedAt
          },
          id: 0,
          ego: 3,
          super_ego: 7
        }
      }
    };

    const error = 502;
    const updates = { id: 0, super_ego: 7 };
    const percentCompleted = 55.555;

    const beforeUpdate = new Date();
    const database = dbReducer(initialDB, Actions.updateFailed('my_table', updates, error, percentCompleted));
    const failedAt = database.my_table[0].__status__.failedAt;

    expect(failedAt).to.be.at.least(beforeUpdate);

    expect(database).to.deep.equal({
      my_table: {
        0: {
          __status__: {
            type: 'UPDATE_FAILED',
            updates,
            error: error,
            percentCompleted,
            failedAt
          },
          id: 0,
          ego: 3,
          super_ego: 7
        }
      }
    });
  });

  it('handles CREATE_TABLE', () => {
    const emptyDB = {};
    expect(dbReducer(emptyDB, Actions.createTable('my_table'))).to.deep.equal({
      my_table: {}
    });
  });

  it('Throws on invalid table name', () => {
    const initialDB = {};
    const badInsert = () =>
      dbReducer(initialDB, Actions.insertStarted('missingTable', {}));

    expect(badInsert).to.throw(ReferenceError);
  });
});
