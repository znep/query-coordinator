import React from 'react';
import { shallow } from 'enzyme';
import validateSchema from 'components/Forms/validateSchema';

describe('components/Forms/validateSchema', () => {
  const props = {
    model: {
      name: 'Joe Tester',
      age: 33,
      bio: 'A tester of fine components'
    }
  };

  const schema = {
    name: {
      required: true,
      type: 'string'
    },
    age: {
      test: val => val < 64 ? 'No social security for you!' : null
    },
    hobbies: {
      required: true
    }
  };

  const WrappedForm = (props) =>
    <form>
      <input type="text" name="test"/>
      <button type="submit">Save</button>
    </form>;

  let component;

  beforeEach(() => {
    const ValidatedForm = validateSchema(schema)(WrappedForm);
    component = shallow(<ValidatedForm {...props}/>);
  });

  it('renders the wrapped component', () => {
    expect(component.name()).to.eq('WrappedForm');
  });

  it('adds a schema prop to the wrapped component', () => {
    expect(component.props().schema).to.exist;
  });

  it('validates the form data-model correctly', () => {
    const desiredOutput = {
      fields: {
        name: {
          errors: [],
          isValid: true,
          required: true
        },
        age: {
          errors: ['No social security for you!'],
          isValid: false,
          required: false
        },
        hobbies: {
          errors: ['Hobbies is required'],
          isValid: false,
          required: true
        }
      },
      isValid: false
    };

    expect(component.props().schema).to.deep.eq(desiredOutput);
  });
});
