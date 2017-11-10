import { assert } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import AddColForm, {
  makeFieldName,
  makeTransformExpr
} from 'components/AddColForm/AddColForm';

describe('components/AddColForm', () => {
  const props = {
    errors: { displayName: [], fieldName: [] },
    clearInternalState: false,
    inputColumns: {
      '1111': {
        id: 1111,
        soql_type: 'text'
      }
    },
    selectOptions: [
      {
        title: 'some column',
        value: '2222'
      },
      {
        title: 'some other column',
        value: '3333'
      }
    ],
    resetFormErrors: () => {},
    markFormDirty: () => {},
    syncToStore: () => {},
    toggleClearInternalState: () => {},
    hideFlash: () => {}
  };

  describe('the component itself', () => {
    it('renders a form with the correct fields', () => {
      const component = shallow(<AddColForm {...props} />);
      assert.isTrue(component.find('form').exists());
      assert.isTrue(component.find('Fieldset').exists());
      assert.isTrue(
        component
          .find('TextInput')
          .filterWhere(input => input.prop('name') === 'displayName')
          .exists()
      );
      assert.isTrue(
        component
          .find('TextInput')
          .filterWhere(input => input.prop('name') === 'fieldName')
          .exists()
      );
      assert.isTrue(component.find('SoqlTypePillBox').exists());
    });

    it('updates its state when a field is changed', () => {
      const component = shallow(<AddColForm {...props} />);
      assert.equal(component.state('description'), '');
      component
        .find('TextArea')
        .dive()
        .find('textarea')
        .simulate('change', { target: { value: 'hey' } });
    });

    it('updates its state when a soql pill is clicked', () => {
      const component = shallow(<AddColForm {...props} />);

      assert.equal(component.state('transform'), 'to_text');

      component
        .find('SoqlTypePillBox')
        .dive()
        .find('SoqlTypePill')
        .first()
        .dive()
        .simulate('click');

      assert.equal(component.state('transform'), 'to_number');
    });

    it('calculates the field_name when the description_name is changed', () => {
      const component = shallow(<AddColForm {...props} />);
      assert.equal(component.state('fieldName'), '');
      component
        .find('TextInput')
        .filterWhere(input => input.prop('name') === 'displayName')
        .dive()
        .find('input')
        .simulate('change', { target: { value: 'hey there' } });

      assert.equal(component.state('fieldName'), 'hey_there');
    });
  });

  describe("the component's helper functions", () => {
    describe('makeFieldName', () => {
      it('replaces non-alphanumeric characters with a single underscore', () => {
        const actual = makeFieldName('@ rea!!!!y stupid displ@y name');
        const expected = '_rea_y_stupid_displ_y_name';
        assert.equal(actual, expected);
      });
    });

    describe('makeTransformExpr', () => {
      it('inserts an escaped field name into a given transform', () => {
        const actual = makeTransformExpr('id', 'to_number');
        const expected = 'to_number(`id`)';
        assert.equal(actual, expected);
      });

      it('does not escape the field name if it is the string null', () => {
        const actual = makeTransformExpr('null', 'to_text');
        const expected = 'to_text(null)';
        assert.equal(actual, expected);
      });
    });
  });
});
