import { assert } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import SourceBreadcrumbs from 'datasetManagementUI/components/SourceBreadcrumbs/SourceBreadcrumbs';

describe('components/SourceBreadcrumbs', () => {
  const defaultProps = {
    sourceId: 111,
    inputSchemaId: 222,
    outputSchemaId: 333,
    atShowSource: true,
    params: {
      category: 'dataset',
      name: 'dfsdfdsf',
      fourfour: 'kg5j-unyr',
      revisionSeq: '0'
    }
  };

  it('renders a link to ShowOutputSchema when on ShowSources page', () => {
    const component = shallow(<SourceBreadcrumbs {...defaultProps} />);
    assert.equal(component.find('Link').childAt(0).text(), 'Preview');
  });

  it('renders a link to ShowSources when on ShowOutputSchema page', () => {
    const newProps = {
      ...defaultProps,
      atShowSource: false
    };
    const component = shallow(<SourceBreadcrumbs {...newProps} />);
    assert.equal(
      component.find('Link').childAt(0).text(),
      'Choose Data Source'
    );
  });
});
