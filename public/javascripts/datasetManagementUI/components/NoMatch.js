import React from 'react';
import { Link } from 'react-router';
import * as Links from '../links';

export default function NoMatch() {
  return (
    <div id="no-match">
      <h1>Not Found</h1>
      <p>Sorry, couldn't find that!</p>
      <p>Try going back to <Link to={Links.home}>the update</Link>.</p>
    </div>
  );
}
