import React from 'react';
import Dropdown from 'components/Dropdown';
import Picklist from 'components/Picklist';
import { shallow } from 'enzyme';

// TODO Write a full test suite.
// Missing specs:
// * Focus behavior.
// * Keyboard navigation.
// * Mouse interactions.
// * Picklist positioning.
// * Scroll isolation.
describe('Dropdown', () => {
  it('renders an element', () => {
    const element = shallow(<Dropdown />);
    assert.isNotNull(element);
  });

  describe('labelledBy prop', () => {
    it('sets aria-labelledby on the root div if set', () => {
      const element = shallow(<Dropdown labelledBy="magic" />);
      assert.lengthOf(element.find('[aria-labelledby="magic"]'), 1);
    });

    it('does not set aria-labelledby on any element if not set', () => {
      const element = shallow(<Dropdown />);
      assert.lengthOf(element.find('[aria-labelledby]'), 0);
    });
  });

  describe('props passed to picklist', () => {
    it('passes through options, disabled, and size', () => {
      // Test sanity. Make sure we're using non-default values.
      assert.isFalse(Dropdown.defaultProps.disabled);
      assert.notEqual(Dropdown.defaultProps.size, 'small');

      const options = [{ value: 'fake' }, { value: 'options' }];

      const dropdownProps = {
        size: 'small',
        disabled: true,
        options
      };

      const element = shallow(<Dropdown {...dropdownProps} />);
      const picklist = element.find(Picklist);
      assert.include(
        picklist.props(),
        {
          size: 'small',
          disabled: true,
          options
        }
      );
    });

    // N.B.: Dropdown doesn't pass onSelection straight through to picklist, because
    // it needs to do some extra state tracking on selection.
    describe('onSelection', () => {
      it('calls the Dropdown onSelection prop', () => {
        const onSelectionStub = sinon.stub();

        const element = shallow(<Dropdown onSelection={onSelectionStub} />);
        const picklist = element.find(Picklist);
        picklist.props().onSelection();
        sinon.assert.calledOnce(onSelectionStub);
      });
    });
  });

  describe('placeholder UI', () => {
    describe('placeholder prop is a function', () => {
      it('shows the returned DOM', () => {
        const placeholderContent = <div id="stub-placeholder">render me</div>;
        const placeholderStub = sinon.stub().returns(placeholderContent);
        const element = shallow(<Dropdown placeholder={placeholderStub} />);
        assert.lengthOf(element.find('#stub-placeholder'), 1);
        sinon.assert.alwaysCalledWith(
          placeholderStub,
          { isOpened: false }
        );
      });
    });

    describe('with a selected value', () => {
      const options = [
        { value: 'one', title: 'First' },
        { value: 'two', title: 'Second' }
      ];

      it('displays the selected value title', () => {
        const element = shallow(<Dropdown options={options} value="two" />);
        assert.equal(element.find('.placeholder').text(), 'Second');
      });
    });

    describe('no selection', () => {
      describe('no placeholder prop set', () => {
        it('displays a call to action', () => {
          const element = shallow(<Dropdown />);
          // TODO this needs I18n, it's currently hardcoded in the product.
          assert.equal(element.find('.placeholder').text(), 'Select...');
        });
      });

      describe('placeholder prop is a string', () => {
        it('shows the string', () => {
          const element = shallow(<Dropdown placeholder="foo" />);
          assert.equal(element.find('.placeholder').text(), 'foo');
        });
      });
    });
  });
});
