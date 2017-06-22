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

    it('fetches the taskSet, fourFour, and rowsToBeUpserted', () => {
      const state = {
        ui: {
          routing: { fourfour: 'abcd-efgh' }
        },
        entities: {
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
      const props = mapStateToProps(state);
      assert.deepEqual(props, {
        taskSet: {
          output_schema_id: 52,
          updated_at: '2017-06-19T23:45:16.306Z'
        },
        fourfour: 'abcd-efgh',
        rowsToBeUpserted: 1000
      });
    });

  });

  describe('component', () => {

    const defaultProps = {
      taskSet: {},
      rowsToBeUpserted,
      fourfour: 'abcdefgh',
      applyRevision: _.noop,
      onCancelClick: _.noop,
    };

    it('renders without errors in success state', () => {
      const withSetStatus = dotProp.set(defaultProps, 'taskSet.status', 'successful');
      const component = shallow(<Publishing {...withSetStatus} />);
      assert.isNotNull(component);
    });

    it('renders without errors in failure state', () => {
      const withSetStatus = dotProp.set(defaultProps, 'taskSet.status', 'failure');
      const component = shallow(<Publishing {...withSetStatus} />);
      assert.isNotNull(component);
    });

    it('renders without errors in in_progress state', () => {
      const withSetStatus = dotProp.set(defaultProps, 'taskSet.status', 'in_progress');
      const component = shallow(<Publishing {...withSetStatus} />);
      assert.isNotNull(component);
    });

    describe('with progress statuses', () => {

      const propsWithSetStatus = dotProp.set(defaultProps, 'taskSet.status', 'upserting');
      const propsWithSetLog = dotProp.set(propsWithSetStatus, 'taskSet.log', [
        { details: { count: 500 } }
      ]);

      it('renders upsert progress numbers', () => {
        const component = shallow(<Publishing {...propsWithSetLog} />);
        assert.isNotNull(component);
        assert.equal(component.find('.statusMessage').text(), 'Importing data (500 / 1,000 rows)');
      });

      it('renders the "email me" button', () => {
        const component = shallow(<Publishing {...propsWithSetLog} />);
        assert.isNotNull(component.find('Connect(NotifyButton)'));
      });

    });

  });

});
