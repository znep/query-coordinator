import React from 'react';
import { renderPureComponent } from '../../helpers';
import FilterHeader from 'components/FilterBar/FilterHeader';

describe('FilterHeader', () => {
  let element;

  beforeEach(() => {
    element = renderPureComponent(FilterHeader({
      name: 'Cheerful Wombats'
    }));
  });

  it('renders an element', () => {
    expect(element).to.exist;
  });

  it('renders the provided name', () => {
    expect(element.innerText).to.contain('Cheerful Wombats');
  });
});
