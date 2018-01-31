import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import { FeedbackPanel } from 'common/components';

class FeedbackPanelDemo extends Component {
  render() {
    const props = {
      currentUser: {
        id: 'fake-fake',
      },
      // locale: auto-default
      // Fake usersnap project id, you will probably read from window.serverConfig.
      usersnapProjectID: '12312312-1234-1234-a3b3-123123123123',
      buttonPosition: 'right'
    };

    return (
      <div>
        <div className="styleguide-example">
          <FeedbackPanel {...props} />
        </div>
        <div className="styleguide-code-example">
          <pre>
{
`const props = ${JSON.stringify(props, null, 2)};
return (<FeedbackPanel {...props} />);
`
}
          </pre>
        </div>
      </div>
    );
  }
}

$(() => {
  ReactDOM.render(
    React.createElement(FeedbackPanelDemo),
    document.getElementById('component-demo')
  );
});
