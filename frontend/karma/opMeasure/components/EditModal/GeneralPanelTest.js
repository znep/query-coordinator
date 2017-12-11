import _ from 'lodash';
import { assert } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';

import { GeneralPanel } from 'components/EditModal/GeneralPanel';

describe('GeneralPanel', () => {
  const getProps = (props) => {
    return {
      measure: {
        name: 'My Measure'
      },
      validationErrors: {},
      onBlurName: _.noop,
      onBlurShortName: _.noop,
      onBlurDescription: _.noop,
      onChangeDescription: _.noop,
      onChangeName: _.noop,
      onChangeShortName: _.noop,
      ...props
    };
  };

  const getName = (element) => element.find('input').at(0);
  const getShortName = (element) => element.find('input').at(1);
  const getDescription = (element) => element.find('textarea');
  const getMetadataLink = (element) => element.find('.edit-metadata-link a');

  it('renders', () => {
    const element = shallow(<GeneralPanel {...getProps()} />);
    assert.ok(element);
  });

  it('initializes from props', () => {
    const props = {
      measure: {
        name: 'Name',
        shortName: 'Short Name',
        description: 'Description'
      }
    };
    const element = shallow(<GeneralPanel {...getProps(props)} />);

    assert.equal(getName(element).prop('value'), props.measure.name);
    assert.equal(getShortName(element).prop('value'), props.measure.shortName);
    assert.equal(getDescription(element).prop('value'), props.measure.description);
  });

  it('links to the generic metadata edit page', () => {
    const element = shallow(<GeneralPanel {...getProps()} />);
    const link = getMetadataLink(element);

    assert.ok(link);
    assert.match(link.prop('href'), /edit_metadata$/);
    assert.equal(link.prop('target'), '_blank');
  });

  describe('name field', () => {
    it('calls onChangeName when updated', () => {
      const props = { onChangeName: sinon.spy() };
      const element = shallow(<GeneralPanel {...getProps(props)} />);

      const fakeEvent = { currentTarget: { value: 'new value' } };
      getName(element).prop('onChange')(fakeEvent);

      sinon.assert.calledWithExactly(props.onChangeName, fakeEvent);
    });

    it('calls onBlurName when blurred', () => {
      const props = { onBlurName: sinon.spy() };
      const element = shallow(<GeneralPanel {...getProps(props)} />);

      const fakeEvent = { currentTarget: { value: 'new value' } };
      getName(element).prop('onBlur')(fakeEvent);

      sinon.assert.calledWithExactly(props.onBlurName, fakeEvent);
    });
  });

  describe('short name field', () => {
    it('calls onChangeShortName when updated', () => {
      const props = { onChangeShortName: sinon.spy() };
      const element = shallow(<GeneralPanel {...getProps(props)} />);

      const fakeEvent = { currentTarget: { value: 'new value' } };
      getShortName(element).prop('onChange')(fakeEvent);

      sinon.assert.calledWithExactly(props.onChangeShortName, fakeEvent);
    });

    it('calls onBlurShortName when blurred', () => {
      const props = { onBlurShortName: sinon.spy() };
      const element = shallow(<GeneralPanel {...getProps(props)} />);

      const fakeEvent = { currentTarget: { value: 'new value' } };
      getShortName(element).prop('onBlur')(fakeEvent);

      sinon.assert.calledWithExactly(props.onBlurShortName, fakeEvent);
    });
  });

  describe('description field', () => {
    it('calls onChangeDescription when the description is updated', () => {
      const props = { onChangeDescription: sinon.spy() };
      const element = shallow(<GeneralPanel {...getProps(props)} />);

      const fakeEvent = { currentTarget: { value: 'new value' } };
      getDescription(element).prop('onChange')(fakeEvent);

      sinon.assert.calledWithExactly(props.onChangeDescription, fakeEvent);
    });

    it('calls onBlurDescription when blurred', () => {
      const props = { onBlurDescription: sinon.spy() };
      const element = shallow(<GeneralPanel {...getProps(props)} />);

      const fakeEvent = { currentTarget: { value: 'new value' } };
      getDescription(element).prop('onBlur')(fakeEvent);

      sinon.assert.calledWithExactly(props.onBlurDescription, fakeEvent);
    });
  });
});
