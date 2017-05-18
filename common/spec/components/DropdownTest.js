import Dropdown from 'components/Dropdown';
import { renderComponent } from '../helpers';

describe('Dropdown', function() {
  it('renders an element', function() {
    var element = renderComponent(Dropdown);
    assert.isNotNull(element);
  });
});
