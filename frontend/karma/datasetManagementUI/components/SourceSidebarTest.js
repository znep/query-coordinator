import { assert } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import SourceSidebar, {
  SourceList, SingleSourceItem, MultiParseOptionsGroup
} from 'components/SourceSidebar/SourceSidebar';

describe('components/SourceSidebar', () => {
  const defaultProps = {
    entities: {
      input_schemas: {
        '159': {source_id: 178, id: 159},
        '158': {source_id: 177, id: 158},
        '900': {source_id: 190, id: 900}
      },
      output_schemas: {
        '215': {input_schema_id: 159, id: 215},
        '214': {input_schema_id: 158, id: 214},
        '900': {input_schema_id: 900, id: 900}
      },
      sources: {
        '178': {id: 178},
        '177': {id: 177},
        '179': {id: 179},
        '190': {id: 190}
      }
    },
    params: {
      revisionSeq: 0,
      fourfour: 'meow-meow',
      name: 'yeah',
      category: 'dataset'
    },
    sources: [
      {
        id: 178,
        blob: 'foo0',
        created_by: {
          user_id: 'tugg-ikce',
          email: 'brandon.webster@socrata.com',
          display_name: 'branweb'
        },
        created_at: new Date('2017-06-22T23:06:03.233Z'),
        source_type: {
          filename: 'one.xlsx',
          type: 'upload'
        },
        percentCompleted: 100,
        finished_at: new Date('2017-06-22T23:06:03.816Z'),
        inputSchemaId: 159,
        outputSchemaId: 215,
        isCurrent: true
      },
      {
        id: 177,
        blob: 'foo1',
        created_by: {
          user_id: 'tugg-ikce',
          email: 'brandon.webster@socrata.com',
          display_name: 'branweb'
        },
        created_at: new Date('2017-06-22T23:03:59.932Z'),
        source_type: {
          filename: 'austin_animal_center_stray_map.csv',
          type: 'upload'
        },
        percentCompleted: 100,
        finished_at: new Date('2017-06-22T23:04:01.551Z'),
        inputSchemaId: 158,
        outputSchemaId: 214
      },
      {
        id: 179,
        blob: 'foo2',
        created_by: {
          user_id: 'tugg-ikke',
          email: 'catherine.uselton@socrata.com',
          display_name: 'catusel'
        },
        created_at: new Date('2017-06-25T23:03:59.932Z'),
        source_type: {
          filename: 'kitten_please.gif',
          type: 'upload'
        },
        content_type: 'image/gif',
        percentCompleted: 100,
        finished_at: new Date('2017-06-22T23:04:01.551Z'),
        inputSchemaId: null,
        outputSchemaId: null
      }
    ]
  };

  const component = shallow(<SourceSidebar {...defaultProps} />);

  describe('SourceSidebar', () => {
    it('shows a SourceList if there are sources', () => {
      assert.isTrue(component.find('SourceList').exists());
    });

    it('shows nothing if there are no sources', () => {
      const newProps = {
        ...defaultProps,
        sources: []
      };

      const component = shallow(<SourceSidebar {...newProps} />);

      assert.isFalse(component.find('SourceList').exists());
    });
  });

  describe('SourceList', () => {
    const component = shallow(<SourceList {...defaultProps} />);

    it('shows a list of all sources', () => {
      assert.equal(
        component.find('SingleSourceItem').length,
        defaultProps.sources.length
      );
    });

    it('shows the current source in bold type', () => {
      assert.isTrue(
        component
          .find('SingleSourceItem')
          .filterWhere(item => item.prop('source').isCurrent)
          .first()
          .dive()
          .find('Link')
          .hasClass('bold')
      );
    });
  });

  describe('SingleSourceItem', () => {
    it('links to the schema preview for sources with schemas', () => {
      const newProps = {...defaultProps, source: defaultProps.sources[0]};
      const component = shallow(<SingleSourceItem {...newProps} />);

      const link = component.find('Link');
      assert.isTrue(link.exists());
      assert.equal(link.prop('to'), '/dataset/yeah/meow-meow/revisions/0/sources/178/schemas/159/output/215');
    })

    it('links to the blob preview for sources with a blob', () => {
      const newProps = {...defaultProps, source: defaultProps.sources[2]};
      const component = shallow(<SingleSourceItem {...newProps} />);

      const link = component.find('Link');
      assert.isTrue(link.exists());
      assert.equal(link.prop('to'), '/dataset/yeah/meow-meow/revisions/0/sources/179/preview');
    })
  });

  describe('MultiParseOptionsGroup', () => {
    it('links to the schema preview for sources with schemas', () => {

      const newProps = {
        ...defaultProps,
        sources: [
          ...defaultProps.sources,
          {
            id: 190,
            blob: 'foo0',
            created_by: {
              user_id: 'tugg-ikce',
              email: 'brandon.webster@socrata.com',
              display_name: 'branweb'
            },
            created_at: new Date('2017-06-22T23:06:03.233Z'),
            source_type: {
              filename: 'one.xlsx',
              type: 'upload'
            },
            percentCompleted: 100,
            finished_at: new Date('2017-06-22T23:06:03.816Z'),
            inputSchemaId: 900,
            outputSchemaId: 900,
            isCurrent: true
          }
        ],
        source: defaultProps.sources[0]
      };
      const component = shallow(<MultiParseOptionsGroup {...newProps} />)
        .find('MultiSourceItem')
        .last()
        .dive();
      const link = component.find('Link');
      assert.isTrue(link.exists());
      assert.equal(link.prop('to'), '/dataset/yeah/meow-meow/revisions/0/sources/190/schemas/900/output/900');
    });
  });
});
