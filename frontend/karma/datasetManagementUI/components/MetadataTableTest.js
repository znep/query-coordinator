import { assert } from 'chai';
import MetadataTable from 'datasetManagementUI/components/MetadataTable/MetadataTable';
import { InfoPane, MetadataTable as CommonMetadataTable } from 'common/components';
import React from 'react';
import sinon from 'sinon';
import { shallow } from 'enzyme';

describe('components/MetadataTable', () => {
  const props = {
    coreView: {},
    customMetadataFieldsets: {},
    onClickEditMetadata: sinon.spy()
  };

  const withView = {
    ...props,
    coreView: {
      id: '5bcc-hb4q',
      name: 'hj',
      description: null,
      category: null,
      owner: {},
      viewCount: 0,
      downloadCount: 0,
      license: {},
      licenseId: 'CC_30_BY_NZ',
      attribution: null,
      attributionLink: '',
      tags: null,
      privateMetadata: {},
      metadata: {},
      customMetadataFieldsets: {},
      editMetadataUrl: '#',
      ownerName: 'branweb'
    }
  };

  it('renders nothing if the view is empty', () => {
    const component = shallow(<MetadataTable {...props} />);
    assert.isTrue(component.isEmptyRender());
  });

  it('renders InfoPane', () => {
    const component = shallow(<MetadataTable {...withView} />);
    const infoPane = !component.find(InfoPane).exists();
    assert.isFalse(infoPane);
  });

  it('renders the common MetadataTable component', () => {
    const component = shallow(<MetadataTable {...withView} />);
    const mdTable = !component.find(CommonMetadataTable).exists();
    assert.isFalse(mdTable);
  });
});
