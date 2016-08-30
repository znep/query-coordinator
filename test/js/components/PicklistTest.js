import _ from 'lodash';
import React from 'react';
import { Simulate } from 'react-addons-test-utils';
import Picklist from 'components/Picklist';

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
  });
});
