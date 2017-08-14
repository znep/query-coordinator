import { assert } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import UploadSidebar from 'components/UploadSidebar/UploadSidebar';
import dotProp from 'dot-prop-immutable';

describe('components/UploadSidebar', () => {
  const defaultProps = {
    entities: {},
    params: {},
    currentUpload: {
      id: 178,
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
      outputSchemaId: 215
    },
    otherUploads: [
      {
        id: 177,
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
      }
    ]
  };

  const component = shallow(<UploadSidebar {...defaultProps} />);

  it('shows current sources', () => {
    const { id: renderedItemId } = component
      .find('UploadItem')
      .first()
      .prop('source');

    assert.equal(renderedItemId, defaultProps.currentUpload.id);
    assert.equal(component.find('h2').first().text(), 'Current Upload');
  });

  it('shows previous sources', () => {
    assert.equal(component.find('h2').last().text(), 'Other Uploads');
    assert.equal(component.find('ul').last().length, 1);
  });

  it("hides previous sources if there aren't any", () => {
    const newProps = dotProp.set(defaultProps, 'otherUploads', []);
    const component = shallow(<UploadSidebar {...newProps} />);
    assert.isFalse(component.find('h2').last.text === 'Other Uploads');
  });

  it('shows no sources message if there are no sources', () => {
    const newProps = { entities: {}, params: {}, currentUpload: null, otherUploads: [] };
    const component = shallow(<UploadSidebar {...newProps} />);
    assert.equal(component.find('span').text(), 'No uploads yet');
  });
});
