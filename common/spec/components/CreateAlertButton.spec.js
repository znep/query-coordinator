import TestUtils from 'react-dom/test-utils';
import { renderComponent } from '../helpers';
import CreateAlertButton from 'common/components/CreateAlertButton';

describe('CreateAlertButton', () => {

  it('renders an element', () => {
    var element = renderComponent(CreateAlertButton, {});
    assert.isNotNull(element);
  });

  it('on click should open create alert modal', () => {
    var element = renderComponent(CreateAlertButton, {});
    TestUtils.Simulate.click(element.querySelector('label'));
    const createAlertModal = element.querySelector('.create-alert-modal');
    assert.isNotNull(createAlertModal);
  });

});
