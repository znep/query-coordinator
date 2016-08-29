import _ from 'lodash';
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

  function getValidOptions() {
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
      beforeEach(function() {
        element = renderComponent(Picklist, getProps({
          options: [
            {title: 'Chinook', value: 'chinook', group: 'Washington State'},
            {title: 'Duwamish', value: 'duwamish', group: 'Washington State'},
            {title: 'Pueblo', value: 'pueblo', group: 'New Mexico'},
            {title: 'Jicarilla APache', value: 'jicarilla-pueblo', group: 'New Mexico'}
          ]
        }));
      });

      it('renders two groups', () => {
        expect(element.querySelectorAll('.picklist-group-header')).to.have.lengthOf(2);
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
