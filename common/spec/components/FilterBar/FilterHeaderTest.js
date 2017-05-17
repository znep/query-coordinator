import React from 'react';
import { Simulate } from 'react-addons-test-utils';
import { renderPureComponent } from '../../helpers';
import FilterHeader from 'components/FilterBar/FilterHeader';

describe('FilterHeader', () => {
  let element;

  function getProps(props) {
    return {
      name: 'Cheerful Wombats',
      isReadOnly: false,
      onClickConfig: _.noop,
      ...props
    };
  }

  const getConfigButton = (el) => el.querySelector('.config-btn');

  it('renders an element', () => {
    element = renderPureComponent(FilterHeader(getProps()));
    assert.isNotNull(element);
  });

  it('renders the provided name', () => {
    element = renderPureComponent(FilterHeader(getProps()));
    assert.include(element.innerText, 'Cheerful Wombats');
  });

  it('calls onClickConfig when the config button is clicked', () => {
    const stub = sinon.stub();
    element = renderPureComponent(FilterHeader(getProps({ onClickConfig: stub })));
    assert.equal(stub.callCount, 0);
    Simulate.click(getConfigButton(element));
    assert.equal(stub.callCount, 1);
  });

  it('does not render the config button if isReadOnly is true', () => {
    element = renderPureComponent(FilterHeader(getProps({ isReadOnly: true })));
    assert.equal(getConfigButton(element), null);
  });
});
