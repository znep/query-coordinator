import { assert } from 'chai';
import renderComponent from '../../renderComponent';
import $ from 'jquery';

import PointSizePreview from 'common/authoring_workflow/components/shared/PointSizePreview';

describe('PointSizePreview', () => {
  const component = renderComponent(PointSizePreview, { pointSize: 2 });

  it('should render a dot in prieview pane matching the pointSize', () => {
    expect(component).to.contain('.point-preview-indicator');
  });

  it('should have the style width given the pointSize', () => {
    assert.equal(
      $(component).find('.point-preview-indicator').css('width'),
      '4px'
    );
  });

  it('should have the style height given the pointSize', () => {
    assert.equal(
      $(component).find('.point-preview-indicator').css('height'),
      '4px'
    );
  });
});
