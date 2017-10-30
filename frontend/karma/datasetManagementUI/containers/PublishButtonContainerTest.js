import { assert } from 'chai';
import { mapStateToProps } from 'containers/PublishButtonContainer';
import dotProp from 'dot-prop-immutable';

describe('containers/PublishButtonContainer', () => {
  const state = {
    ui: {
      forms: {
        datasetForm: {
          errors: []
        }
      }
    },
    entities: {
      views: {
        'abcd-1234': {
          displayType: 'draft'
        }
      },
      sources: {
        '30': {
          finished_at: 'lately'
        }
      },
      revisions: {
        '111': {
          id: 111,
          output_schema_id: 14,
          revision_seq: 1,
          href: []
        }
      },
      output_schemas: {
        '14': {
          id: 14,
          completed_at: 'now',
          finished_at: 'now'
        }
      },
      output_columns: {},
      output_schema_columns: {},
      transforms: {},
      task_sets: {
        '100': {
          id: 100,
          status: 'successful'
        }
      }
    }
  };

  const ownProps = {
    params: {
      revisionSeq: '1',
      fourfour: 'abcd-1234'
    }
  };

  describe('mapStateToProps', () => {
    it('returns metadataSatisfied is false if there are errors in the store', () => {
      const newState = dotProp.set(state, 'ui.forms.datasetForm.errors', [
        { name: 'messed up' }
      ]);

      const props = mapStateToProps(newState, ownProps);

      assert.isFalse(props.metadataSatisfied);
    });

    it('returns dataSatisfied as false if there is no output schema', () => {
      const newState = dotProp.set(state, 'entities.output_schemas', {});

      const props = mapStateToProps(newState, ownProps);

      assert.isFalse(props.dataSatisfied);
    });

    it('returns dataSatisfied as true if there is a blob set on the revision', () => {
      const blob_revisions = {
        '111': {
          id: 111,
          blob_id: 30,
          revision_seq: 1,
          href: []
        }
      }
      const newState = dotProp.set(state, 'entities.revisions', blob_revisions);
      const props = mapStateToProps(newState, ownProps);
      assert.isTrue(props.dataSatisfied);
    });

    it('returns dataSatisfied as true if there is an output_schema set on the revision', () => {
      const props = mapStateToProps(state, ownProps);
      assert.isTrue(props.dataSatisfied);
    });

    it('returns dataSatisfied as true if usaid feature flag enabled', () => {
      window.serverConfig.featureFlags.usaid_features_enabled = true;

      const newState = dotProp.set(state, 'entities.output_schemas', {});

      const props = mapStateToProps(newState, ownProps);

      assert.isTrue(props.dataSatisfied);

      window.serverConfig.featureFlags.usaid_features_enabled = false;
    });

    it('returns dataSatisfied as true if dealing with a published dataset', () => {
      const newState = dotProp.set(
        state,
        `entities.views.${ownProps.params.fourfour}.displayType`,
        'tabular'
      );

      const props = mapStateToProps(newState, ownProps);

      assert.isTrue(props.dataSatisfied);
    });

    it('returns publishing as true if any tasks are in progress', () => {
      const newState = dotProp.set(
        state,
        'entities.task_sets.100.status',
        'in_progress'
      );

      const props = mapStateToProps(newState, ownProps);

      assert.isTrue(props.publishing);
    });
  });
});
