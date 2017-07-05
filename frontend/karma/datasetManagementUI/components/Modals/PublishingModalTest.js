import _ from 'lodash';
import dotProp from 'dot-prop-immutable';
import { assert } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import * as ApplyRevision from 'actions/applyRevision';
import { Publishing, computeProgress, mapStateToProps } from 'components/Modals/Publishing';

describe('components/Modals/Publishing', () => {

  const rowsToBeUpserted = 1000;

  const jobWithOutputSchema = {
    output_schema_id: 52,
    created_at: new Date()
  };

  describe('computeProgress', () => {

    it('returns 1 for a successful job', () => {
      const job = {
        status: ApplyRevision.TASK_SET_SUCCESSFUL
      };
      assert.equal(computeProgress(rowsToBeUpserted, job), 1);
    });

    it('returns 1 for a failed job', () => {
      const job = {
        ...jobWithOutputSchema,
        status: ApplyRevision.TASK_SET_FAILURE,
        log: [
          {
            stage: 'started'
          }
        ]
      };
      const result = computeProgress(rowsToBeUpserted, job);
      assert.equal(result, 1);
    });

    it('returns between 0 and 0.1 for a job with status `initializing`', () => {
      const job = {
        ...jobWithOutputSchema,
        status: ApplyRevision.TASK_SET_INITIALIZING
      };
      const result = computeProgress(rowsToBeUpserted, job);
      assert.isTrue(result >= 0 && result <= 0.1, 'doneFraction between 0 and 0.1');
    });

    it('returns between 0 and 0.1 for a job with status `creating_columns`', () => {
      const job = {
        ...jobWithOutputSchema,
        status: ApplyRevision.TASK_SET_CREATING_COLUMNS
      };
      const result = computeProgress(rowsToBeUpserted, job);
      assert.isTrue(result >= 0 && result <= 0.1, 'doneFraction between 0 and 0.1');
    });

    it('returns between 0.1 and 0.9 for a job with status `upserting`', () => {
      const job = {
        ...jobWithOutputSchema,
        status: ApplyRevision.TASK_SET_UPSERTING,
        log: [
          { stage: ApplyRevision.TASK_SET_STAGE_ROWS_UPSERTED, details: { count: 500 } },
          { stage: 'columns_created' },
          { stage: 'started' }
        ]
      };
      const result = computeProgress(rowsToBeUpserted, job);
      assert.equal(result, 0.5);
    });

    it('returns 0.95 for a job with status `finishing`', () => {
      const job = {
        ...jobWithOutputSchema,
        status: 'finishing'
      };
      const result = computeProgress(rowsToBeUpserted, job);
      assert.closeTo(result, 0.95, 0.01);
    });

  });

  describe('mapStateToProps', () => {

    const state = {
      ui: {
        routing: { fourfour: 'abcd-efgh' }
      },
      entities: {
        revisions: {
          0: {
            permission: 'public'
          }
        },
        task_sets: {
          0: {
            output_schema_id: 52,
            updated_at: '2017-06-19T23:45:16.306Z'
          }
        },
        output_schemas: {
          52: {
            input_schema_id: 42
          }
        },
        input_schemas: {
          42: {
            total_rows: rowsToBeUpserted
          }
        }
      }
    };

    it('fetches the taskSet, fourFour, and rowsToBeUpserted', () => {
      const props = mapStateToProps(state);
      assert.deepEqual(props, {
        revision: {
          permission: 'public'
        },
        taskSet: {
          output_schema_id: 52,
          updated_at: '2017-06-19T23:45:16.306Z'
        },
        fourfour: 'abcd-efgh',
        rowsToBeUpserted: 1000
      });
    });

    it('handles case where there is no output schema', () => {
      const stateWithNoFile = {
        ...state,
        entities: {
          ...state.entities,
          task_sets: {
            0: {
              updated_at: '2017-06-19T23:45:16.306Z',
              output_schema_id: null
            }
          },
          output_schemas: {},
          input_schemas: {}
        }
      };
      const props = mapStateToProps(stateWithNoFile);
      assert.deepEqual(props, {
        rowsToBeUpserted: null,
        revision: {
          permission: 'public'
        },
        taskSet: {
          output_schema_id: null,
          updated_at: '2017-06-19T23:45:16.306Z'
        },
        fourfour: 'abcd-efgh'
      });
    });

  });

  describe('component', () => {

    const defaultProps = {
      revision: {
        permission: 'public'
      },
      taskSet: {},
      rowsToBeUpserted,
      fourfour: 'abcdefgh',
      applyRevision: _.noop,
      onCancelClick: _.noop,
    };

    it('renders without errors in success state', () => {
      const withSetStatus = dotProp.set(defaultProps, 'taskSet.status', 'successful');
      const component = shallow(<Publishing {...withSetStatus} />);
      assert.isFalse(component.isEmpty());
    });

    it('renders without errors in failure state', () => {
      const withSetStatus = dotProp.set(defaultProps, 'taskSet.status', 'failure');
      const component = shallow(<Publishing {...withSetStatus} />);
      assert.isFalse(component.isEmpty());
    });

    it('renders without errors in in_progress state', () => {
      const withSetStatus = dotProp.set(defaultProps, 'taskSet.status', 'in_progress');
      const component = shallow(<Publishing {...withSetStatus} />);
      assert.isFalse(component.isEmpty());
    });

    it('renders without errors when there is no output schema', () => {
      const withNoRowsToBeUpserted = dotProp.set(defaultProps, 'rowsToBeUpserted', null);
      const component = shallow(<Publishing {...withNoRowsToBeUpserted} />);
      assert.isFalse(component.isEmpty());
    });

    describe('with progress statuses', () => {

      const propsWithSetStatus = dotProp.set(defaultProps, 'taskSet.status', 'upserting');
      const propsWithSetLog = dotProp.set(propsWithSetStatus, 'taskSet.log', [
        { details: { count: 500 } }
      ]);

      it('renders upsert progress numbers', () => {
        const component = shallow(<Publishing {...propsWithSetLog} />);
        assert.isFalse(component.isEmpty());
        assert.equal(component.find('.statusMessage').text(), 'Importing data (500 / 1,000 rows)');
      });

      it('renders the "email me" button', () => {
        const component = shallow(<Publishing {...propsWithSetLog} />);
        assert.isNotNull(component.find('Connect(NotifyButton)'));
      });

      it('renders without errors when there is no output schema', () => {
        const propsWithNoRowCount = dotProp.set(propsWithSetLog, 'rowsToBeUpserted', null);
        const component = shallow(<Publishing {...propsWithNoRowCount} />);
        assert.isFalse(component.isEmpty());
      });

      it('says your dataset will be public if revision\'s permission is public', () => {
        const component = shallow(<Publishing {...propsWithSetLog} />);
        assert.equal(
          component.find('h2').text(),
          'Your dataset is being processed & will be public shortly'
        );
      });

      it('says your dataset will be private if revision\'s permission is private', () => {
        const propsWithPrivate = dotProp.set(propsWithSetLog, 'revision.permission', 'private');
        const component = shallow(<Publishing {...propsWithPrivate} />);
        assert.equal(
          component.find('h2').text(),
          'Your dataset is being processed and will remain private'
        );
      });

    });

  });

});
