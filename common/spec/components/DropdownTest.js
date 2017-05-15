import Dropdown from 'components/Dropdown';
import { renderComponent } from '../helpers';

describe('Dropdown', function() {
  it('renders an element', function() {
    var element = renderComponent(Dropdown);
    expect(element).to.exist;
  });
});
