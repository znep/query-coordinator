import React from 'react';
import ReactDOM from 'react-dom';
import Notifications from './Notifications';

window.notifications = (container) => {
  let rootNode;
  try {
    rootNode = document.querySelector(container);
  } catch (err) {
    console.error(
      `Cannot render Notifications; no node matched ${container} in querySelector`
    );
    return;
  }

  ReactDOM.render(
    <Notifications />,
    rootNode
  );
};
