import _ from 'lodash';
import React from 'react';
import { Simulate } from 'react-addons-test-utils';
import Picklist from 'components/Picklist';
import { UP, DOWN, ESCAPE, ENTER } from 'common/keycodes';

describe('Picklist', () => {
  let element;

  function getProps(props) {
    return _.defaultsDeep({}, props, {
      options: [
        {title: 'John Henry', value: 'john-henry'},
        {title: 'Railroads', value: 'railroads'},
        {title: 'Steel', value: 'steel'}
      ],
      onSelection: _.noop
    });
  }

  beforeEach(() => {
    element = renderComponent(Picklist, getProps());
  });

  it('renders an element', () => {
    expect(element).to.exist;
  });

  describe('with options', () => {
    beforeEach(() => {
      element = renderComponent(Picklist, getProps());
    });

    it('renders three options', () => {
      expect(element.querySelectorAll('.picklist-option')).to.have.lengthOf(3);
    });

    describe('with a value set', () => {
      beforeEach(() => {
        element = renderComponent(Picklist, getProps({
          value: 'steel'
        }));
      });

      it('renders one selected option', () => {
        expect(element.querySelector('.picklist-option-selected')).to.exist;
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
        expect(element.querySelectorAll(headerSelector)).to.have.lengthOf(2);
      });

      it('renders options under the correct groups', () => {
        const optionOneSelector = `${headerSelector}:first-child + ${optionSelector}`;
        const optionTwoSelector = `${headerSelector}:nth-child(5) + ${optionSelector}`;
        // 5 accounts for one group header, two options, a spacer.
        const optionOne = element.querySelector(optionOneSelector);
        const optionTwo = element.querySelector(optionTwoSelector);

        expect(optionOne).to.have.text(options[0].title);
        expect(optionTwo).to.have.text(options[2].title);
      });
    });

    describe('with a render function', () => {
      let render;
      let option;

      beforeEach(() => {
        render = sinon.spy(() => <div className="test-container" />);
        option = { title: 'I remember', value: 'i-remember', render };

        element = renderComponent(Picklist, getProps({ options: [option] }));
      });

      it('renders a special div', () => {
        expect(element.querySelector('.test-container')).to.exist;
      });

      it('passes an option when rendering', () => {
        expect(render.calledWith(option)).to.be.true;
      });
    });
  });

  describe('events', () => {
    let props;

    beforeEach(() => {
      props = { onSelection: sinon.stub() };
      element = renderComponent(Picklist, getProps(props));
    });

    describe('when clicking an option', () => {
      it('emits an onSelection event', () => {
        const option = element.querySelector('.picklist-option');

        Simulate.click(option);
        expect(props.onSelection.calledOnce).to.be.true;
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
          expect(element.querySelector(selectedOptionSelector)).to.not.exist;
        });

        it('does nothing for DOWN', () => {
          Simulate.keyUp(element, { keyCode: DOWN });
          expect(element.querySelector(selectedOptionSelector)).to.not.exist;
        });

        it('does nothing for ENTER', () => {
          Simulate.keyUp(element, { keyCode: ENTER });
          expect(element.querySelector('.picklist-option-selected')).to.not.exist;
        });
      });

      describe('when pressing up', () => {
        const event = { keyCode: UP };

        describe('when nothing is selected', () => {
          it('selects the first option', () => {
            const lastOption = _.last(options);

            expect(lastOption).to.not.have.class(selectedOptionSelector);

            Simulate.keyUp(element, event);
            expect(lastOption).to.have.class(selectedOptionSelector);
          });
        });

        describe('when at the beginning', () => {
          it('does nothing', () => {
            const firstOption = _.first(options);

            expect(firstOption).to.not.have.class(selectedOptionSelector);

            Simulate.click(firstOption);
            expect(firstOption).to.have.class(selectedOptionSelector);

            Simulate.keyUp(element, event);
            expect(firstOption).to.have.class(selectedOptionSelector);
          });
        });

        describe('when in the middle', () => {
          it('moves the option selected up one', () => {
            Simulate.click(options[1]);
            Simulate.keyUp(element, event);

            expect(options[0]).to.have.class(selectedOptionSelector);
          });
        });
      });

      describe('when pressing down', () => {
        const event = { keyCode: DOWN };

        describe('when nothing is selected', () => {
          it('selects the first option', () => {
            const firstOption = _.first(options);

            expect(firstOption).to.not.have.class(selectedOptionSelector);

            Simulate.keyUp(element, event);
            expect(firstOption).to.have.class(selectedOptionSelector);
          });
        });

        describe('when at the end', () => {
          it('does nothing', () => {
            const lastOption = _.last(options);

            expect(lastOption).to.not.have.class(selectedOptionSelector);

            Simulate.click(lastOption);
            expect(lastOption).to.have.class(selectedOptionSelector);

            Simulate.keyUp(element, event);
            expect(lastOption).to.have.class(selectedOptionSelector);
          });
        });

        describe('when in the middle', () => {
          it('moves the option selected one down', () => {
            Simulate.click(options[1]);
            Simulate.keyUp(element, event);

            expect(options[2]).to.have.class(selectedOptionSelector);
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
          expect(element).to.have.class('picklist-focused');

          Simulate.keyUp(element, event);
          expect(element).to.not.have.class('picklist-focused');
        });
      });
    });
  });
});
