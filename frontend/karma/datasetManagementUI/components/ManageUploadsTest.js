import { expect, assert } from 'chai';
import React from 'react';
import _ from 'lodash';
import { ManageUploads } from 'components/ManageUploads';
import { shallow } from 'enzyme';

describe('components/ManageUploads', () => {
  const Props = {
    goHome: _.noop,
    createUpload: _.noop,
    onDismiss: _.noop,
    location: {
      pathname: '/dataset/mkm/izmd-wutc/revisions/0/uploads',
      search: '',
      hash: '',
      action: 'POP',
      key: null,
      query: {}
    },
    params: {
      category: 'dataset',
      name: 'mkm',
      fourfour: 'izmd-wutc',
      revisionSeq: '0'
    },
    route: {
      path: 'uploads'
    },
    router: {
      location: {
        pathname: '/dataset/mkm/izmd-wutc/revisions/0/uploads',
        search: '',
        hash: '',
        action: 'POP',
        key: null,
        query: {}
      },
      params: {
        category: 'dataset',
        name: 'mkm',
        fourfour: 'izmd-wutc',
        revisionSeq: '0'
      },
      routes: [
        {
          path: '/:category/:name/:fourfour/revisions/:revisionSeq',
          indexRoute: {},
          childRoutes: [
            {
              from: 'metadata',
              to: 'metadata/dataset',
              path: 'metadata'
            },
            {
              path: 'metadata/dataset'
            },
            {
              path: 'metadata/columns'
            },
            {
              path: 'uploads'
            },
            {
              path: ':sidebarSelection'
            },
            {
              path: 'uploads/:uploadId'
            },
            {
              path:
                'uploads/:uploadId/schemas/:inputSchemaId/output/:outputSchemaId',
              childRoutes: [
                {
                  path: 'page/:pageNo'
                }
              ]
            },
            {
              path:
                'uploads/:uploadId/schemas/:inputSchemaId/output/:outputSchemaId/column_errors/:errorsTransformId',
              childRoutes: [
                {
                  path: 'page/:pageNo'
                }
              ]
            },
            {
              path:
                'uploads/:uploadId/schemas/:inputSchemaId/output/:outputSchemaId/row_errors',
              childRoutes: [
                {
                  path: 'page/:pageNo'
                }
              ]
            },
            {
              path: '*'
            }
          ]
        },
        {
          path: 'uploads'
        }
      ]
    },
    routeParams: {},
    routes: [
      {
        path: '/:category/:name/:fourfour/revisions/:revisionSeq',
        indexRoute: {},
        childRoutes: [
          {
            from: 'metadata',
            to: 'metadata/dataset',
            path: 'metadata'
          },
          {
            path: 'metadata/dataset'
          },
          {
            path: 'metadata/columns'
          },
          {
            path: 'uploads'
          },
          {
            path: ':sidebarSelection'
          },
          {
            path: 'uploads/:uploadId'
          },
          {
            path:
              'uploads/:uploadId/schemas/:inputSchemaId/output/:outputSchemaId',
            childRoutes: [
              {
                path: 'page/:pageNo'
              }
            ]
          },
          {
            path:
              'uploads/:uploadId/schemas/:inputSchemaId/output/:outputSchemaId/column_errors/:errorsTransformId',
            childRoutes: [
              {
                path: 'page/:pageNo'
              }
            ]
          },
          {
            path:
              'uploads/:uploadId/schemas/:inputSchemaId/output/:outputSchemaId/row_errors',
            childRoutes: [
              {
                path: 'page/:pageNo'
              }
            ]
          },
          {
            path: '*'
          }
        ]
      },
      {
        path: 'uploads'
      }
    ],
    children: null,
    uploads: []
  };
  it('renders without errors', () => {
    const element = shallow(<ManageUploads {...Props} />);
    assert.isFalse(element.isEmpty());
  });
});
