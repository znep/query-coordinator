import _ from 'lodash';
import { Simulate } from 'react-dom/test-utils';
import { renderComponent } from '../../helpers';
import AddFilter from 'components/FilterBar/AddFilter';
import { SPACE } from 'common/dom_helpers/keycodes_deprecated';


function getProps(props) {
  return _.defaultsDeep({}, props, {
    columns: [],
    onClickColumn: _.noop
  });
}

function clickAddFilter(element) {
  const button = element.querySelector('.btn-add-filter');
  Simulate.click(button);
}

describe('AddFilter', () => {
  let element;

  beforeEach(() => {
    element = renderComponent(AddFilter, getProps());
  });

  it('renders an element', () => {
    assert.isNotNull(element);
  });

  describe('add filter button', () => {
    it('renders the add filter button', () => {
      const button = element.querySelector('.btn-add-filter');
      assert.isNotNull(button);
    });

    it('does not render the column container on load', () => {
      const columnContainer = element.querySelector('.column-container');
      assert.isNull(columnContainer);
    });

    it('renders the column container when add filter button is clicked', () => {
      clickAddFilter(element);
      const columnContainer = element.querySelector('.column-container');

      assert.isNotNull(columnContainer);
    });

    it('renders when add filter button is accessed via keyboard', () => {
      const button = element.querySelector('.btn-add-filter');
      Simulate.keyDown(button, { keyCode: SPACE });
      const columnContainer = element.querySelector('.column-container');

      assert.isNotNull(columnContainer);
    });
  });

  describe('column options', () => {
    it('renders an add filter searchable picklist', () => {
      clickAddFilter(element);
      const addFilterPicklist = element.querySelector('.add-filter-picklist');

      assert.isNotNull(addFilterPicklist);
    });

    it('renders an add filter searchable picklist with warning with no columns', () => {
      clickAddFilter(element);
      const warning = element.querySelector('.add-filter-picklist .alert');

      assert.isNotNull(warning);
    });

    it('renders an option for each column', () => {
      element = renderComponent(AddFilter, getProps({
        columns: [
          {
            name: 'Some Number',
            fieldName: 'some_number',
            renderTypeName: 'number'
          },
          {
            name: 'Some Word',
            fieldName: 'some_word',
            renderTypeName: 'text'
          }
        ]
      }));
      clickAddFilter(element);
      const options = element.querySelectorAll('.filter-bar-column-option');

      assert.deepEqual(options.length, 2);
    });

    it('filters columns when term searched', () => {
      element = renderComponent(AddFilter, getProps({
        columns: [
          {
            name: 'Some Number',
            fieldName: 'some_number',
            renderTypeName: 'number'
          },
          {
            name: 'Some Word',
            fieldName: 'some_word',
            renderTypeName: 'text'
          }
        ]
      }));
      clickAddFilter(element);

      const input = element.querySelector('.add-filter-picklist-input');
      input.value = 'word';
      Simulate.change(input);

      const options = element.querySelectorAll('.filter-bar-column-option');

      assert.deepEqual(options.length, 1);
    });

    it('calls onClickColumn when option is clicked', () => {
      const onClickColumnStub = sinon.stub();

      element = renderComponent(AddFilter, getProps({
        columns: [
          {
            name: 'Some Word',
            fieldName: 'some_word',
            renderTypeName: 'text'
          }
        ],
        onClickColumn: onClickColumnStub
      }));
      clickAddFilter(element);

      const option = element.querySelector('.filter-bar-column-option');
      Simulate.click(option);

      sinon.assert.called(onClickColumnStub);
    });

    it('closes column container when option is clicked', () => {
      element = renderComponent(AddFilter, getProps({
        columns: [
          {
            name: 'Some Word',
            fieldName: 'some_word',
            renderTypeName: 'text'
          }
        ]
      }));
      clickAddFilter(element);

      const option = element.querySelector('.filter-bar-column-option');
      Simulate.click(option);

      const columnContainer = element.querySelector('.column-container');

      assert.isNull(columnContainer);
    });

    it('resets the search textbox to empty after column click and add filter is clicked again', () => {
      let input;

      element = renderComponent(AddFilter, getProps({
        columns: [
          {
            name: 'Some Word',
            fieldName: 'some_word',
            renderTypeName: 'text'
          }
        ]
      }));

      // Click add filter
      clickAddFilter(element);

      // Set filter text box to something
      input = element.querySelector('.add-filter-picklist-input');
      input.value = 'word';
      assert.equal(input.value, 'word');

      // Click column dropdown option
      const option = element.querySelector('.filter-bar-column-option');
      Simulate.click(option);

      const columnContainer = element.querySelector('.column-container');
      assert.isNull(columnContainer);

      // Click add filter again
      clickAddFilter(element);

      // Verify text box is empty
      input = element.querySelector('.add-filter-picklist-input');
      assert.equal(input.value, '');
    });
  });
});
