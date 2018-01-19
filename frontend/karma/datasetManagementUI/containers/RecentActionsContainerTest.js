import React from 'react';
import { assert } from 'chai';
import _ from 'lodash';
import {
  Activity,
  shapeRevisions,
  shapeSources,
  shapeOutputSchemas,
  createActivities,
  ACTIVITY_TYPES
} from 'datasetManagementUI/containers/RecentActionsContainer';

describe('containers/RecentActionsContainer', () => {
  describe('shapeRevisions', () => {
    const revisions = {
      '444': {
        id: 444,
        fourfour: 'a8hp-94dm',
        revision_seq: 0,
        created_at: '2017-08-31T20:20:01.942Z',
        created_by: {
          user_id: 'abcd-1234',
          email: 'branweb@socrata.com',
          display_name: 'branweb'
        }
      },
      '555': {
        id: 555,
        fourfour: 'a8hp-94dm',
        revision_seq: 12,
        created_at: '2017-08-31T20:20:01.942Z',
        created_by: {
          user_id: 'abcd-1234',
          email: 'branweb@socrata.com',
          display_name: 'branweb'
        }
      }
    };

    it('returns an empty activity if there is no matching revision', () => {
      const activities = shapeRevisions(_.values(revisions), 9);

      const allEmpty = activities
        .map(act => act.type === ACTIVITY_TYPES.empty)
        .reduce((acc, a) => acc && a, true);

      assert.isTrue(allEmpty);
    });

    it('returns a singleton list of Revision if there is a matching revision', () => {
      const activities = shapeRevisions(_.values(revisions), 0);

      assert.equal(activities.length, 1);
      assert.isTrue(activities[0].type === ACTIVITY_TYPES.revision);
      assert.equal(
        activities[0].createdAt,
        revisions['444'].created_at
      );
      assert.equal(
        activities[0].createdBy,
        revisions['444'].created_by.display_name
      );
    });
  });

  describe('shapeSources', () => {
    const sources = {
      '454': {
        creatd_at: '2017-08-31T20:20:01.942Z',
        created_by: {
          user_id: 'abcd-1234',
          email: 'branweb@socrata.com',
          display_name: 'branweb'
        }
      },
      '455': {
        creatd_at: '2017-08-31T20:20:01.942Z',
        created_by: {
          user_id: 'abcd-1234',
          email: 'branweb@socrata.com',
          display_name: 'branweb'
        }
      }
    };

    it('returns a singleton list of Empty Activity if there are no sources', () => {
      const activities = shapeSources([]);

      const allEmpty = activities
        .map(act => act.type === ACTIVITY_TYPES.empty)
        .reduce((acc, a) => acc && a, true);

      assert.isTrue(allEmpty);
    });

    it('returns a list of Source Activity for each source', () => {
      const activities = shapeSources(_.values(sources));

      const allSources = activities
        .map(act => act.type === ACTIVITY_TYPES.source)
        .reduce((acc, a) => acc && a, true);

      assert.equal(activities.length, 2);
      assert.isTrue(allSources);
    });
  });

  describe('shapeOutputSchemas', () => {
    const state = {
      output_schemas: {
        '55': {
          id: 55,
          input_schema_id: 9,
          created_at: '2017-08-31T20:20:01.942Z',
          created_by: {
            user_id: 'abcd-1234',
            email: 'branweb@socrata.com',
            display_name: 'branweb'
          }
        },
        '66': {
          id: 66,
          input_schema_id: 99,
          created_at: '2017-08-31T20:20:01.942Z',
          created_by: {
            user_id: 'abcd-1234',
            email: 'branweb@socrata.com',
            display_name: 'branweb'
          }
        }
      },
      input_schemas: {
        '9': {
          id: 9,
          source_id: 10
        },
        '99': {
          id: 99,
          source_id: 100
        }
      },
      sources: {
        '10': { id: 10 },
        '100': { id: 100 }
      }
    };

    it('returns a singleton list of Empty Activity if there are no output schemas', () => {
      const activities = shapeOutputSchemas([], null, null);

      const allEmpty = activities
        .map(act => act.type === ACTIVITY_TYPES.empty)
        .reduce((acc, a) => acc && a, true);

      assert.isTrue(allEmpty);
    });

    it('returns a list of OutoutSchemaActivity for each schema', () => {
      const activities = shapeOutputSchemas(
        _.values(state.output_schemas),
        _.values(state.input_schemas),
        _.values(state.sources)
      );

      const allOS = activities
        .map(act => act.type === ACTIVITY_TYPES.outputSchema)
        .reduce((acc, a) => acc && a, true);

      assert.equal(activities.length, 2);
      assert.isTrue(allOS);
    });

    it('encodes all necessary data in OutoutSchemaActivity', () => {
      const activity = shapeOutputSchemas(
        _.values(state.output_schemas),
        _.values(state.input_schemas),
        _.values(state.sources)
      )[0];

      assert.equal(
        activity.createdAt,
        state.output_schemas['55'].created_at
      );
      assert.equal(
        activity.createdBy,
        state.output_schemas['55'].created_by.display_name
      );
      assert.equal(activity.sourceId, state.sources['10'].id);
      assert.equal(activity.isid, state.input_schemas['9'].id);
      assert.equal(activity.osid, state.output_schemas['55'].id);
    });
  });

  describe('createActivities', () => {
    const state = {
      output_schemas: {
        '55': {
          id: 55,
          input_schema_id: 9,
          created_at: '2017-08-31T16:20:01.942Z',
          created_by: {
            user_id: 'abcd-1234',
            email: 'branweb@socrata.com',
            display_name: 'branweb'
          }
        },
        '66': {
          id: 66,
          input_schema_id: 99,
          created_at: '2017-08-31T18:20:01.942Z',
          created_by: {
            user_id: 'abcd-1234',
            email: 'branweb@socrata.com',
            display_name: 'branweb'
          }
        }
      },
      input_schemas: {
        '9': {
          id: 9,
          source_id: 10
        },
        '99': {
          id: 99,
          source_id: 100
        }
      },
      sources: {
        '10': {
          id: 10,
          created_at: '2017-08-31T14:20:01.942Z',
          created_by: {
            user_id: 'abcd-1234',
            email: 'branweb@socrata.com',
            display_name: 'branweb'
          }
        },
        '100': {
          id: 100,
          created_at: '2017-08-31T17:20:01.942Z',
          created_by: {
            user_id: 'abcd-1234',
            email: 'branweb@socrata.com',
            display_name: 'branweb'
          }
        }
      },
      revisions: {
        '444': {
          id: 444,
          fourfour: 'a8hp-94dm',
          revision_seq: 0,
          created_at: '2017-08-31T13:20:01.942Z',
          created_by: {
            user_id: 'abcd-1234',
            email: 'branweb@socrata.com',
            display_name: 'branweb'
          }
        }
      }
    };

    const params = {
      revisionSeq: '0'
    };

    it('given an Entities object, returns a list of activitites', () => {
      const activities = createActivities(state, params);

      const allActivities = activities
        .map(act => !!act.type)
        .reduce((acc, a) => acc && a, true);

      assert.isOk(activities.length);
      assert.isTrue(allActivities);
    });

    it('filters out empty activities', () => {
      const activities = createActivities(state, params);

      const emptyActivities = activities.filter(act => act.type === ACTIVITY_TYPES.empty);

      assert.equal(emptyActivities.length, 0);
    });
  });
});
