import _ from 'lodash';
import { assert } from 'chai';

import Head from 'adminActivityFeedSoql/components/Table/Head';
import mockTranslations from '../../mockTranslations';

describe('Table/Head renders cell header', () => {

  let element;

  const wrappedElement = _.constant((
    <table>
      <Head />
    </table>
  ));

  element = renderComponentWithLocalization(wrappedElement, {});

  it('type', () => {
    assert.equal(
      element.querySelector('th.asset-type').textContent,
      mockTranslations.columns.asset_type
    );
  });

  it('initiated_by', () => {
    assert.equal(
      element.querySelector('th.acting-user-name').textContent,
      mockTranslations.columns.acting_user_name
    );
  });

  it('event', () => {
    assert.equal(
      element.querySelector('th.activity-type').textContent,
      mockTranslations.columns.activity_type
    );
  });

  it('item_affected', () => {
    assert.equal(
      element.querySelector('th.affected-item').textContent,
      mockTranslations.columns.affected_item
    );
  });

  it('date', () => {
    assert.equal(
      element.querySelector('th.created-at').textContent,
      mockTranslations.columns.created_at
    );
  });

  it('actions', () => {
    assert.equal(
      element.querySelector('th.actions').textContent,
      mockTranslations.columns.actions
    );
  });

});
