import _ from 'lodash';
import { expect, assert } from 'chai';

import DataTable from 'components/DataTable/DataTable';

const emptyTableProps = {
  data: [],
  rowIdGetter: _ => Math.random(),
  columns: []
};

describe('DataTable', () => {
  it('should render a table', () => {
    const output = renderComponent(DataTable, {
      data: [],
      rowIdGetter: (i) => Math.random(),
      columns: []
    });

    expect(output.tagName).to.eq('TABLE');
  });

  it('should render a condensed table', () => {
    const output = renderComponent(DataTable, {
      data: [{}],
      rowIdGetter: (i) => Math.random(),
      condensed: true,
      columns: []
    });

    assert(output.classList.contains('table-condensed'));
  });

  describe('header columns', () => {
    const simpleColumns = [
      {
        id: 'Title',
        title: 'Title',
        mapper: (i) => i.title
      },
      {
        id: 'views',
        title: 'Views',
        mapper: (i) => i.views
      }
    ];

    it('should rendered with default header column component', () => {
      const output = renderComponent(DataTable, _.merge(emptyTableProps, {
        columns: simpleColumns
      }));

      const titleColumn = output.querySelectorAll('th')[0];
      expect(titleColumn.textContent).to.eq('Title');
    });

    it('should rendered with given component', () => {
      const output = renderComponent(DataTable, _.merge(emptyTableProps, {
        columns: simpleColumns,
        headerColumnComponent: (props) => <th><strong>{props.column.title}</strong></th>
      }));

      const titleColumn = output.querySelectorAll('th>strong');
      expect(titleColumn[0].textContent).to.eq('Title');
      expect(titleColumn[1].textContent).to.eq('Views');
    });
  });

  describe('data columns', () => {
    const data = [
      { id: 1, name: 'John Doe', age: 25 },
      { id: 2, name: 'Smith Brown', age: 33 }
    ];

    const columns = [
      {
        id: 'name',
        title: 'Name',
        mapper: (i) => i,
        template: (i) => <a href={`http://example.com/${i.id}`}>{i.name}</a>
      },

      {
        id: 'age',
        title: 'Age',
        mapper: (i) => i.age
      }
    ];

    it('should render column with plain renderer', () => {
      const output = renderComponent(DataTable, _.merge(emptyTableProps, {
        columns,
        data
      }));

      const ageColumn = output.querySelectorAll('tbody>tr>td')[1];
      expect(ageColumn.innerHTML).to.eq('25');
    });

    it('should render column with custom template', () => {
      const output = renderComponent(DataTable, _.merge(emptyTableProps, {
        columns,
        data
      }));

      const nameColumn = output.querySelectorAll('tbody>tr>td')[0];
      expect(nameColumn.innerHTML).to.eq('<a href="http://example.com/1">John Doe</a>');
    });

    it('should render columns with given column component', () => {
      const output = renderComponent(DataTable, _.merge(emptyTableProps, {
        columns,
        data,
        dataColumnComponent: (props) => {
          const template = props.column.template || _.identity;
          return <td><p>{template(props.column.mapper(props.item))}</p></td>;
        }
      }));

      const nameColumn = output.querySelectorAll('tbody>tr>td')[0];
      expect(nameColumn.innerHTML).to.eq('<p><a href="http://example.com/1">John Doe</a></p>');
    });
  });
});
