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
    expect(element).to.exist;
  });

  it('renders the provided name', () => {
    element = renderPureComponent(FilterHeader(getProps()));
    expect(element.innerText).to.contain('Cheerful Wombats');
  });

  it('calls onClickConfig when the config button is clicked', () => {
    const stub = sinon.stub();
    element = renderPureComponent(FilterHeader(getProps({ onClickConfig: stub })));
    expect(stub.callCount).to.equal(0);
    Simulate.click(getConfigButton(element));
    expect(stub.callCount).to.equal(1);
  });

  it('does not render the config button if isReadOnly is true', () => {
    element = renderPureComponent(FilterHeader(getProps({ isReadOnly: true })));
    expect(getConfigButton(element)).to.equal(null);
  });
});
