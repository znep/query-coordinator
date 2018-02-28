import _ from 'lodash';
import { assert } from 'chai';
import { shallow } from 'enzyme';
import moment from 'moment-timezone';

import { FeatureFlags } from 'common/feature_flags';
import InfoPane, { mapStateToProps } from 'datasetLandingPage/components/InfoPane';
import mockView from 'data/mockView';

describe('InfoPane', () => {
  describe('mapStateToProps', () => {
    const getMockState = (coreViewOverrides) => {
      return {
        view: _.extend({}, mockView, coreViewOverrides)
      };
    };

    describe('when hide_dates_on_primer_and_data_catalog is false', () => {
      beforeEach(() => {
        FeatureFlags.useTestFixture({
          enable_user_notifications: true,
          hide_dates_on_primer_and_data_catalog: false
        });
      });

      afterEach(() => {
        FeatureFlags.useTestFixture({});
      });

      it('sets metadata', () => {
        const state = getMockState();
        const props = mapStateToProps(state);

        const expected = {
          first: {
            label: 'Updated',
            content: 'November 10, 2017'
          },
          second: null
        };

        assert.deepEqual(props.metadata, expected);
      });

      it('adds attribution to metadata', () => {
        const state = getMockState({ attribution: 'Flula' });
        const props = mapStateToProps(state);

        const expected = {
          first: {
            label: 'Updated',
            content: 'November 10, 2017'
          },
          second: {
            label: 'Data Provided by',
            content: 'Flula'
          }
        };

        assert.deepEqual(props.metadata, expected);
      });
    });

    describe('when hide_dates_on_primer_and_data_catalog feature flag is true', () => {
      beforeEach(() => {
        FeatureFlags.useTestFixture({
          enable_user_notifications: true,
          hide_dates_on_primer_and_data_catalog: true
        });

        it('sets metadata without dates', () => {
          const state = getMockState();
          const props = mapStateToProps(state);

          const expected = {
            first: null,
            second: null
          };

          assert.deepEqual(props.metadata, expected);
        });

        it('adds attribution to metadata without dates', () => {
          const state = getMockState({ attribution: 'Flula' });
          const props = mapStateToProps(state);

          const expected = {
            first: {
              label: 'Data Provided by',
              content: 'Flula'
            },
            second: null
          };

          assert.deepEqual(props.metadata, expected);
        });
      });
    });
  });
});
