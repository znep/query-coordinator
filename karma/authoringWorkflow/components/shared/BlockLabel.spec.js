import { assert } from 'chai';
import renderComponent from '../../renderComponent';

import BlockLabel from 'src/authoringWorkflow/components/shared/BlockLabel';

describe('BlockLabel', () => {
  it('should render given title and htmlFor attributes', () => {
    const component = renderComponent(BlockLabel, {
      title: 'Some Title',
      htmlFor: 'some-id'
    });

    const blockLabel = component.querySelector('.block-label');
    assert(component.textContent === 'Some Title');
    assert(blockLabel.hasAttribute('for'), 'Label should have for attribute');
    assert(blockLabel.getAttribute('for') === 'some-id');
  });

  it('should render a flyout if description property set', () => {
    const component = renderComponent(BlockLabel, {
      title: 'Some Title',
      description: 'Some description'
    });

    assert(component.querySelector('.icon-question'), 'Question mark should be rendered');
    assert(component.querySelector('.flyout').textContent === 'Some description');
  });
});

