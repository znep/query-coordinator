import React from 'react';
import { Link } from 'react-router';
import * as Links from '../links';

export default function NoMatch() {
  return (
    <div id="no-match">
      <h1>{I18n.no_match.title}</h1>
      <p>{I18n.no_match.subtitle}</p>
      <p><Link to={Links.home}>{I18n.no_match.suggestion}</Link></p>
    </div>
  );
}
