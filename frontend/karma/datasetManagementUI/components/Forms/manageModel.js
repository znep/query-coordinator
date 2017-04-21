import { expect, assert } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import manageModel from 'components/Forms/manageModel';

const WrappedForm = (props) =>
  <form>
    <input type="text" name="test"/>
    <button type="submit">Save</button>
  </form>;

describe('components/Forms/reformed', () => {
  const initialModel = {
    name: 'test',
    description: 'a test model'
  };

  it('renders the wrapped component', () => {
    const WrappedForm = manageModel(WrappedForm);

    const component = shallow(<WrappedForm />);

    expect(component.name()).to.eq('WrappedForm');
  });

  it('passes form data-model to the wrapped component', () => {
    const WrappedForm = manageModel(WrappedForm);

    const component = shallow(<WrappedForm initialModel={initialModel} />);

    expect(component.props().model).to.deep.eq(initialModel);
  });

  it('passes callbacks needed to manage form data to the wrapped component', () => {
    const WrappedForm = manageModel(WrappedForm);

    const component = shallow(<WrappedForm />);

    expect(component.props()).to.contain.keys([
      'setModel',
      'setProperty',
      'setDirty',
      'setDirtyProperty',
      'bindToChangeEvent',
      'bindInput',
      'removeDirtyProperty'
    ]);
  });

  it('updates state correctly when setModel is called', () => {
    const WrappedForm = manageModel(WrappedForm);

    const component = shallow(<WrappedForm initialModel={initialModel} />);

    const newModel = {
      ...initialModel,
      added: 'some new data'
    };

    component.props().setModel(newModel);

    expect(component.state('model')).to.deep.eq(newModel);
  });

  it('updates state correctly when setProperty is called', () => {
    const WrappedForm = manageModel(WrappedForm);

    const component = shallow(<WrappedForm initialModel={initialModel} />);

    component.props().setProperty('name', 'newName');

    expect(component.state('model').name).to.eq('newName');
  });

  it('updates state correctly when setDirty is called', () => {
    const WrappedForm = manageModel(WrappedForm);

    const component = shallow(<WrappedForm initialModel={initialModel} />);

    const dirtyState = {
      form: true,
      fields: ['name', 'description']
    };

    component.props().setDirty(dirtyState);

    expect(component.state('isDirty')).to.deep.eq(dirtyState);
  });

  it('updates state correctly when setDirtyProperty is called', () => {
    const WrappedForm = manageModel(WrappedForm);

    const component = shallow(<WrappedForm initialModel={initialModel} />);

    component.props().setDirtyProperty('name');

    expect(component.state('isDirty').fields).to.contain('name');
  });
});
