import _ from 'lodash';
import { assert } from 'chai';

import Head from 'components/Table/Head';
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
      element.querySelector('th.type').textContent,
      mockTranslations.columns.type
    );
  });

  it('initiated_by', () => {
    assert.equal(
      element.querySelector('th.initiated-by').textContent,
      mockTranslations.columns.initiated_by
    );
  });

  it('event', () => {
    assert.equal(
      element.querySelector('th.event').textContent,
      mockTranslations.columns.event
    );
  });

  it('item_affected', () => {
    assert.equal(
      element.querySelector('th.item-affected').textContent,
      mockTranslations.columns.item_affected
    );
  });

  it('date', () => {
    assert.equal(
      element.querySelector('th.date').textContent,
      mockTranslations.columns.date
    );
  });

  it('actions', () => {
    assert.equal(
      element.querySelector('th.actions').textContent,
      mockTranslations.columns.actions
    );
  });

});
