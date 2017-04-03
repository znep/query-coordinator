import { Searchbox } from 'components/searchbox/Searchbox';
import _ from 'lodash';

describe('Searchbox', () => {
  const defaultProps = {
    onSearch: _.noop
  };

  const getProps = (props = {}) => {
    return {...defaultProps, ...props};
  };

  it('renders', () => {
    const element = renderComponent(Searchbox, getProps());
    assert.isDefined(element);
    assert.match(element.className, /common-searchbox/);
  });

  it('calls the onSearch prop on "Enter" keypress', () => {
    const spy = sinon.spy();
    const element = renderComponent(Searchbox, getProps({ onSearch: spy }));
    const input = element.querySelector('input');
    input.value = 'barf chair';
    TestUtils.Simulate.change(input);
    TestUtils.Simulate.keyDown(input, { key: 'Enter', keyCode: 13 });
    sinon.assert.calledOnce(spy);
  });

  describe('"clear search" icon', () => {
    it('is hidden by default', () => {
      const element = renderComponent(Searchbox, getProps());
      assert.isNull(element.querySelector('.clear-search'));
    });

    it('is not hidden when there is a default search query', () => {
      const element = renderComponent(Searchbox, getProps({ defaultQuery: 'barf chair' }));
      assert.isNotNull(element.querySelector('.clear-search'));
    });

    it('is not hidden when the user enters a search query', () => {
      const element = renderComponent(Searchbox, getProps());
      const input = element.querySelector('input');
      input.value = 'barf chair';
      TestUtils.Simulate.change(input);
      assert.isNotNull(element.querySelector('.clear-search'));
    });

    it('clears the search query and calls onClear when clicked', () => {
      const spy = sinon.spy();
      const element = renderComponent(Searchbox, getProps({ onClear: spy }));
      const input = element.querySelector('input');
      input.value = 'barf chair';
      TestUtils.Simulate.change(input);
      TestUtils.Simulate.click(element.querySelector('.clear-search'));
      assert.equal(input.value, '');
      sinon.assert.calledOnce(spy);
    });
  });

  it('uses the placeholder prop', () => {
    const element = renderComponent(Searchbox, getProps({ placeholder: 'barf chair' }));
    assert.equal(element.querySelector('input').placeholder, 'barf chair');
  });
});
