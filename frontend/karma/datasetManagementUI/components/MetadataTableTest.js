import { assert } from 'chai';
import MetadataTable from 'components/MetadataTable/MetadataTable';
import React from 'react';
import sinon from 'sinon';
import { shallow } from 'enzyme';

describe('components/MetadataTable', () => {
  const props = {
    view: {},
    customMetadataFieldsets: {},
    onClickEditMetadata: sinon.spy()
  };

  const withView = {
    ...props,
    view: {
      id: '5bcc-hb4q',
      name: 'hj',
      description: null,
      category: null,
      owner: {},
      lastUpdatedAt: {},
      dataLastUpdatedAt: {},
      metadataLastUpdatedAt: 1503099310258,
      createdAt: {},
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
      licenseName: 'Creative Commons Attribution 3.0 New Zealand',
      licenseLogo: 'images/licenses/cc30by.png',
      licenseUrl: 'https://creativecommons.org/licenses/by/3.0/nz/legalcode',
      editMetadataUrl: '#',
      statsUrl: '',
      disableContactDatasetOwner: true,
      ownerName: 'branweb'
    }
  };

  it('renders nothing if the view is empty', () => {
    const component = shallow(<MetadataTable {...props} />);
    assert.isTrue(component.isEmptyRender());
  });

  it('renders InfoPane', () => {
    const component = shallow(<MetadataTable {...withView} />);
    const infoPane = !component.find('InfoPane').isEmpty();
    assert.isTrue(infoPane);
  });

  it('renders the common MetadataTable component', () => {
    const component = shallow(<MetadataTable {...withView} />);
    const mdTable = !component.find('MetadataTable').isEmpty();
    assert.isTrue(mdTable);
  });
});
