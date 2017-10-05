import { assert } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import UploadBreadcrumbs from 'components/UploadBreadcrumbs/UploadBreadcrumbs';

describe('components/UploadBreadcrumbs', () => {
  const defaultProps = {
    atShowUpload: true,
    sourceId: 178,
    outputSchemaId: 215,
    inputSchemaId: 159,
    params: {
      category: 'dataset',
      name: 'dfsdfdsf',
      fourfour: 'kg5j-unyr',
      revisionSeq: '0',
      sourceId: '178',
      inputSchemaId: '215',
      outputSchemaId: '159'
    }
  };

  it('renders a link to ShowOutputSchema when on ShowUploads page', () => {
    const component = shallow(<UploadBreadcrumbs {...defaultProps} />);
    assert.equal(component.find('Link').childAt(0).text(), 'Preview');
  });

  it('renders a link to ShowUploads whenon ShowOutputSchema page', () => {
    const newProps = {
      ...defaultProps,
      atShowUpload: false
    };
    const component = shallow(<UploadBreadcrumbs {...newProps} />);
    assert.equal(
      component.find('Link').childAt(0).text(),
      'Choose Data Source'
    );
  });
});
