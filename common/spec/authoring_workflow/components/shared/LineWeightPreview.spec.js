import { assert } from 'chai';
import renderComponent from '../../renderComponent';
import $ from 'jquery';

import LineWeightPreview from 'common/authoring_workflow/components/shared/LineWeightPreview';

describe('LineWeightPreview', () => {
  const component = renderComponent(LineWeightPreview, { lineWeight: 2 });

  it('should render a line in prieview pane matching the lineWeight', () => {
    expect(component).to.contain('.line-preview-indicator');
  });

  it('should have the style width given the lineWeight', () => {
    assert.equal(
      $(component).find('.line-preview-indicator').css('width'),
      '2px'
    );
  });
});
