import { assert } from 'chai';
import { SearchboxFilter } from 'components/filters/SearchboxFilter';
import sinon from 'sinon';

describe('components/SearchboxFilter', () => {
  const searchboxFilterProps = (options = {}) => ({
    options: [{
      title: 'A fun option',
      value: 'a'
    }, {
      title: 'A sad option',
      value: 'b'
    }, {
      title: 'An option with a really long and useless title omg ggggggg ggggg gg ggggg',
      value: 'c'
    }],
    onSelection: () => undefined,
    placeholder: 'Search!',
    value: 'a',
    ...options
  });

  it('renders', () => {
    const element = renderComponentWithStore(SearchboxFilter, searchboxFilterProps());
    assert.isNotNull(element);
    assert.equal(element.className, 'searchbox-filter');
  });

  it('opens the picklist when the input is focused', () => {
    const element = renderComponentWithStore(SearchboxFilter, searchboxFilterProps());
    const input = element.querySelector('input[type="text"]');
    assert.isNull(element.querySelector('.picklist-wrapper'));
    TestUtils.Simulate.focus(input);
    assert.isNotNull(element.querySelector('.picklist-wrapper'));
  });

  it('closes the picklist when the input is blurred', (done) => {
    const element = renderComponentWithStore(SearchboxFilter, searchboxFilterProps());
    const input = element.querySelector('input[type="text"]');
    TestUtils.Simulate.focus(input);
    assert.isNotNull(element.querySelector('.picklist-wrapper'));
    TestUtils.Simulate.blur(input);
    _.defer(() => {
      assert.isNull(element.querySelector('.picklist-wrapper'));
      done();
    });
  });

  it('does not close the picklist when the input is blurred if the picklist is focused', () => {
    const element = renderComponentWithStore(SearchboxFilter, searchboxFilterProps());
    const input = element.querySelector('input[type="text"]');
    TestUtils.Simulate.focus(input);
    assert.isNotNull(element.querySelector('.picklist-wrapper'));
    TestUtils.Simulate.focus(element.querySelector('.picklist-option'));
    TestUtils.Simulate.blur(input);
    assert.isNotNull(element.querySelector('.picklist-wrapper'));
  });

  it('it filters the options to the ones that contain the entered text in the input box (as well as the "All" filter), case insensitive', (done) => {
    const element = renderComponentWithStore(SearchboxFilter, searchboxFilterProps());
    const input = element.querySelector('input[type="text"]');
    TestUtils.Simulate.focus(input);

    input.value = 'FUN';
    TestUtils.Simulate.change(input);
    _.defer(() => {
      assert.lengthOf(element.querySelectorAll('.picklist-option'), 2);
      done();
    });
  });

  it('calls onSelection when a picklist option is clicked', () => {
    const spy = sinon.spy();
    const element = renderComponentWithStore(SearchboxFilter, searchboxFilterProps({ onSelection: spy }));
    const input = element.querySelector('input[type="text"]');
    TestUtils.Simulate.focus(input);
    TestUtils.Simulate.click(element.querySelector('.picklist-option'));
    sinon.assert.calledOnce(spy);
  });

});
