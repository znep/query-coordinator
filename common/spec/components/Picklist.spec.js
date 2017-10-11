import $ from 'jquery';
import _ from 'lodash';
import React from 'react';
import TestUtils, { Simulate } from 'react-dom/test-utils';
import { renderComponent } from '../helpers';
import Picklist from 'components/Picklist';
import { UP, DOWN, ESCAPE, ENTER } from 'common/dom_helpers/keycodes';
import { SocrataIcon } from 'common/components';

describe('Picklist', () => {
  let element;
  // Be careful about adding react components as props to this component, since internally it uses _.isEqual
  // for certain comparisons (i.e. isSelected in renderOptions), which can lead to problems.
  const theOneAndOnlyIcon = <SocrataIcon name="official2" />;

  // If the incoming props contain a "value" key, that is used to selected item(s) in the picklist
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      options: [
        { title: 'John Henry', value: 'john-henry', icon: theOneAndOnlyIcon },
        { title: 'Railroads', value: 'railroads', icon: theOneAndOnlyIcon },
        { title: 'Steel', value: 'steel' }
      ],
      onSelection: _.noop,
      onChange: _.noop
    });
  }

  beforeEach(() => {
    element = renderComponent(Picklist, getProps());
  });

  it('renders an element', () => {
    assert.isNotNull(element);
  });

  describe('with options', () => {
    beforeEach(() => {
      element = renderComponent(Picklist, getProps());
    });

    it('renders three options', () => {
      assert.lengthOf(element.querySelectorAll('.picklist-option'), 3);
    });

    describe('with an optional icon', () => {
      beforeEach(() => {
        element = renderComponent(Picklist, getProps({ value: 'railroads' }));
      });

      it('renders an icon when selected option', () => {
        assert.isNotNull(element.querySelector('.picklist-option-selected .socrata-icon'));
      });
    });

    describe('with a value set', () => {
      beforeEach(() => {
        element = renderComponent(Picklist, getProps({ value: 'steel' }));
      });

      it('renders one selected option', () => {
        assert.isNotNull(element.querySelector('.picklist-option-selected'));
      });

      describe('with multiple options that have the same value', () => {
        beforeEach(() => {
          let props = getProps({ value: 'steel' });
          props.options.push({ title: 'Steel', value: 'steel' });

          element = renderComponent(Picklist, props);
        });

        it('renders two selected options', () => {
          assert.lengthOf(element.querySelectorAll('.picklist-option-selected'), 2);
        });
      });

      describe('when updating the value after a render', () => {
        let component;
        let setSelectionSpy;

        beforeEach(() => {
          const props = getProps({ value: 'steel' });

          component = TestUtils.renderIntoDocument(React.createElement(Picklist, props));
          setSelectionSpy = sinon.spy(component, 'setSelectedOptionBasedOnValue');
        });

        afterEach(() => {
          setSelectionSpy.restore();
        });

        it('sets the selected option and an index pointer', () => {
          const props = getProps();
          const selectedIndex = 1;
          const selectedOption = props.options[selectedIndex];

          props.value = selectedOption.value;
          component.componentWillReceiveProps(props);

          assert.isTrue(setSelectionSpy.called);
          assert.equal(component.state.selectedIndex, selectedIndex);
          assert.equal(component.state.selectedOption, selectedOption);
        });

        describe('when the value is null', () => {
          it('sets selectedOption to undefined and the pointer to -1', () => {
            const props = getProps({ value: null });
            component.componentWillReceiveProps(props);

            assert.isTrue(setSelectionSpy.called);
            assert.equal(component.state.selectedIndex, -1);
            assert.isUndefined(component.state.selectedOption);
          });
        });
      });
    });

    describe('with grouping', () => {
      const headerSelector = '.picklist-group-header';
      const optionSelector = '.picklist-option';
      const options = [
        {title: 'Chinook', value: 'chinook', group: 'Washington State'},
        {title: 'Duwamish', value: 'duwamish', group: 'Washington State'},
        {title: 'Pueblo', value: 'pueblo', group: 'New Mexico'},
        {title: 'Jicarilla Apache', value: 'jicarilla-pueblo', group: 'New Mexico'}
      ];

      beforeEach(() => {
        element = renderComponent(Picklist, getProps({ options }));
      });

      it('renders two groups', () => {
        assert.lengthOf(element.querySelectorAll(headerSelector), 2);
      });

      it('renders options under the correct groups', () => {
        const optionOneSelector = `${headerSelector}:first-child + ${optionSelector}`;
        const optionTwoSelector = `${headerSelector}:nth-child(5) + ${optionSelector}`;
        // 5 accounts for one group header, two options, a spacer.
        const optionOne = element.querySelector(optionOneSelector);
        const optionTwo = element.querySelector(optionTwoSelector);

        assert.include($(optionOne).text(), options[0].title);
        assert.include($(optionTwo).text(), options[2].title);
      });
    });

    describe('with a render function', () => {
      let render;
      let option;

      beforeEach(() => {
        render = sinon.spy((option) => <div className="test-container" />);
        option = { title: 'I remember', value: 'i-remember', render };
        element = renderComponent(Picklist, getProps({ options: [option] }));
      });

      it('renders a special div', () => {
        assert.isNotNull(element.querySelector('.test-container'));
      });

      it('passes an option when rendering', () => {
        assert.isTrue(render.calledOnce);
        assert.equal(option.title, render.getCall(0).args[0].title)
        assert.equal(option.value, render.getCall(0).args[0].value)
      });
    });
  });

  describe('events', () => {
    let props;

    beforeEach(() => {
      props = { onSelection: sinon.stub(), onChange: sinon.stub() };
      element = renderComponent(Picklist, getProps(props));
    });

    describe('when clicking an option', () => {
      it('emits an onSelection event', () => {
        const option = element.querySelector('.picklist-option');

        Simulate.click(option);
        assert.isTrue(props.onSelection.calledOnce);
      });
    });

    describe('when using keyboard navigation', () => {
      let options;
      const selectedOptionSelector = 'picklist-option-selected';

      beforeEach(() => {
        options = element.querySelectorAll('.picklist-option');
        Simulate.focus(element);
      });

      describe('when disabled', () => {
        beforeEach(() => {
          props = { disabled: true };
          element = renderComponent(Picklist, getProps(props));

          Simulate.focus(element);
        });

        it('does nothing for UP', () => {
          Simulate.keyUp(element, { keyCode: UP });
          // Did... did it do something?
          assert.isNull(element.querySelector(selectedOptionSelector));
        });

        it('does nothing for DOWN', () => {
          Simulate.keyUp(element, { keyCode: DOWN });
          assert.isNull(element.querySelector(selectedOptionSelector));
        });

        it('does nothing for ENTER', () => {
          Simulate.keyUp(element, { keyCode: ENTER });
          assert.isNull(element.querySelector('.picklist-option-selected'));
        });
      });

      describe('when pressing up', () => {
        const event = { keyCode: UP };

        describe('when nothing is selected', () => {
          it('selects the first option', () => {
            const lastOption = _.last(options);

            assert.isFalse($(lastOption).hasClass(selectedOptionSelector));

            Simulate.keyUp(element, event);

            assert.isTrue($(lastOption).hasClass(selectedOptionSelector));
            assert.isTrue(props.onChange.calledOnce);
          });
        });

        describe('when at the beginning', () => {
          it('does nothing', () => {
            const firstOption = _.first(options);

            assert.isFalse($(firstOption).hasClass(selectedOptionSelector));

            Simulate.click(firstOption);
            assert.isTrue($(firstOption).hasClass(selectedOptionSelector));

            Simulate.keyUp(element, event);
            assert.isTrue($(firstOption).hasClass(selectedOptionSelector));
          });
        });

        describe('when in the middle', () => {
          it('moves the option selected up one', () => {
            Simulate.click(options[1]);
            Simulate.keyUp(element, event);

            assert.isTrue($(options[0]).hasClass(selectedOptionSelector));
            assert.isTrue(props.onSelection.calledOnce);
            assert.isTrue(props.onChange.calledOnce);
          });
        });
      });

      describe('when pressing down', () => {
        const event = { keyCode: DOWN };

        describe('when nothing is selected', () => {
          it('selects the first option', () => {
            const firstOption = _.first(options);

            assert.isFalse($(firstOption).hasClass(selectedOptionSelector));

            Simulate.keyUp(element, event);

            assert.isTrue($(firstOption).hasClass(selectedOptionSelector));
            assert.isTrue(props.onChange.calledOnce);
          });
        });

        describe('when at the end', () => {
          it('does nothing', () => {
            const lastOption = _.last(options);

            assert.isFalse($(lastOption).hasClass(selectedOptionSelector));

            Simulate.click(lastOption);
            assert.isTrue($(lastOption).hasClass(selectedOptionSelector));

            Simulate.keyUp(element, event);
            assert.isTrue($(lastOption).hasClass(selectedOptionSelector));
          });
        });

        describe('when in the middle', () => {
          it('moves the option selected one down', () => {
            Simulate.click(options[1]);
            Simulate.keyUp(element, event);

            assert.isTrue($(options[2]).hasClass(selectedOptionSelector));
            assert.isTrue(props.onSelection.calledOnce);
            assert.isTrue(props.onChange.calledOnce);
          });
        });
      });

      // xdescribe? React and TestUtils doesn't use a real event system
      // nor does it respond to one. We use a blur event in our component
      // to break focus.
      xdescribe('when pressing escape', () => {
        const event = { keyCode: ESCAPE };

        it('blurs the picklist', () => {
          Simulate.focus(element);
          assert.isTrue($(element).hasClass('picklist-focused'));

          Simulate.keyUp(element, event);
          assert.isFalse($(element).hasClass('picklist-focused'));
        });
      });
    });
  });
});
