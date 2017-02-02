import { SortDropdown } from 'components/SortDropdown';
import _ from 'lodash';

describe('components/SortDropdown', function() {
  function defaultProps() {
    return {
      onSelection: undefined,
      value: 'relevance'
    };
  }

  function getProps(props = {}) {
    return {...defaultProps(), ...props};
  }

  it('renders', function() {
    var element = renderComponent(SortDropdown, getProps());
    expect(element).to.exist;
    expect(element.className).to.eq('sort-dropdown');
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

    expect(options.length).to.eq(sortTypes.length);

    _.forEach(options, (option) => {
      expect(sortTypes.indexOf(option.textContent) > -1).to.be.true;
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
    expect(spy).to.have.been.calledWith({ title: 'Recently Updated', value: 'updatedAt' });
  });
});
