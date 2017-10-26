import $ from 'jquery';
import _ from 'lodash';
import { renderPureComponent } from '../../helpers';

import Content from 'components/Modal/Content';

describe('Content', () => {
  let element;

  function getProps(props) {
    return _.defaultsDeep({}, props);
  }

  // TODO: test for rendering children

  it('renders with relevant classes', () => {
    const props = getProps({
      className: 'testing-modal-content'
    });

    element = renderPureComponent(Content(props)); // eslint-disable-line new-cap

    assert.isNotNull(element);
    assert.isTrue($(element).hasClass('testing-modal-content'));
  });
});
