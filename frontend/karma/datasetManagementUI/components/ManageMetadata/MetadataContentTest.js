import { expect, assert } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import MetadataContent from 'components/ManageMetadata/MetadataContent';

describe('components/ManageMetadata/MetadataContent', () => {
  const defaultProps = {
    path: '/dataset/columns',
    fourfour: 'hehe-hehe',
    onSidebarTabClick: () => {},
    columnsExist: false
  };

  it('shows a disabled columns tab if columnsExist is falsey', () => {
    const component = shallow(<MetadataContent {...defaultProps} />);
    assert.isOk(component.find('.sidebar span.disabled'));
  });

  it('shows an enabled columns tab if columnsExist is truthy', () => {
    const newProps = {
      ...defaultProps,
      columnsExist: true
    };

    const component = shallow(<MetadataContent {...newProps} />);
    assert.isNotOk(component.find('Link').last().hasClass('disabled'));
  });
});
