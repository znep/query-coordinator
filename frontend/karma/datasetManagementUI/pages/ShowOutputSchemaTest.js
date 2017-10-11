import { assert } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import { ShowOutputSchema, mapStateToProps } from 'pages/ShowOutputSchema/ShowOutputSchema';
import dotProp from 'dot-prop-immutable';
import {
  ShowOutputSchemaProps,
  ShowOutputSchemaErrorProps
} from '../data/defaultProps';
import state from '../data/initialState';

describe('ShowOutputSchema page', () => {
  describe('rendering', () => {
    const defaultProps = ShowOutputSchemaProps;

    const component = shallow(<ShowOutputSchema {...defaultProps} />);

    it('renders Table', () => {
      assert.equal(component.find('TablePane').length, 1);
    });

    it('renders ReadyToImport', () => {
      assert.equal(
        component.find('withRouter(Connect(ReadyToImport))').length,
        1
      );
    });
  });

  describe('connect logic', () => {
    const ownProps = {
      params: {
        category: 'dataset',
        name: 'dfsdfdsf',
        fourfour: 'kg5j-unyr',
        revisionSeq: '0',
        sourceId: '115',
        inputSchemaId: '98',
        outputSchemaId: '144'
      },
      location: {
        pathname:
          '/dataset/dfsdfdsf/kg5j-unyr/revisions/0/sources/115/schemas/98/output/144',
        search: '',
        hash: '',
        action: 'PUSH',
        key: 'rq79bk',
        query: {}
      },
      route: {
        path: 'sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId',
        childRoutes: [
          {
            path: 'page/:pageNo'
          }
        ]
      }
    };

    it('returns normal displayState on intial path', () => {
      const { displayState } = mapStateToProps(state, ownProps);

      assert.deepEqual(displayState, {
        type: 'NORMAL',
        pageNo: 1,
        outputSchemaId: 144
      });
    });

    it('returns row errors displayState on row errors path', () => {
      const newProps = dotProp.set(
        ownProps,
        'route.path',
        'sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId/row_errors'
      );

      const { displayState } = mapStateToProps(state, newProps);

      assert.deepEqual(displayState, {
        type: 'ROW_ERRORS',
        pageNo: 1,
        outputSchemaId: 144
      });
    });
  });
});
