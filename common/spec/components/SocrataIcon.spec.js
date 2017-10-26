import $ from 'jquery';
import SocrataIcon from 'components/SocrataIcon';
import { renderPureComponent } from '../helpers';

describe('SocrataIcon', () => {
  let component;
  let element;

  beforeEach(() => {
    component = SocrataIcon({ name: 'info' }); // eslint-disable-line new-cap
    element = renderPureComponent(component);
  });

  it('renders an element', () => {
    assert.isNotNull(element);
  });

  it('renders .socrata-icon', () => {
    assert.isTrue($(element).hasClass('socrata-icon'));
  });

  it('renders an SVG icon', () => {
    assert.lengthOf($(element).find('svg'), 1);
  });

  describe('when given a name that doesn\'t exist', () => {
    it('throws', () => {
      assert.throws(() => SocrataIcon({ name: 'rawrenstein' })); // eslint-disable-line new-cap
    });
  });
});
