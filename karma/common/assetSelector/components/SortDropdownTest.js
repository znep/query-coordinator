import { SortDropdown } from 'SortDropdown';
import _ from 'lodash';

describe('SortDropdown', function() {
  const defaultProps = {
    onSelection: undefined,
    value: 'relevance'
  };

  function getProps(props = {}) {
    return {...defaultProps, ...props};
  }

  it('renders', function() {
    var element = renderComponent(SortDropdown, getProps());
    assert.isDefined(element);
    assert.equal(element.className, 'sort-dropdown');
  });

  it('has options for each sort type', function() {
    var sortTypes = [
      'Most Relevant',
      'Most Accessed',
      'Alphabetical',
      'Recently Added',
      'Recently Updated'
    ];

    var element = renderComponent(SortDropdown, getProps());
    var options = element.querySelectorAll('.picklist-option .picklist-title');

    assert.equal(options.length, sortTypes.length);

    _.forEach(options, (option) => {
      assert.isTrue(sortTypes.indexOf(option.textContent) > -1);
    });
  });

  it('calls the onSelection function when an option is selected', function() {
    var spy = sinon.spy();
    var element = renderComponent(SortDropdown, getProps({ onSelection: spy }));
    var updatedAtOption = _.filter(element.querySelectorAll('.picklist-option'), (option) => {
      var title = option.querySelector('.picklist-title');
      return title.textContent === 'Recently Updated';
    })[0];

    TestUtils.Simulate.click(updatedAtOption);
    sinon.assert.calledWith(spy, { title: 'Recently Updated', value: 'updatedAt' });
  });
});
