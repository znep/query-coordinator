import _ from 'lodash';
import * as React from 'react';
import TypeIcon from '../TypeIcon/TypeIcon';
import PropTypes from 'prop-types';
import * as styles from './SoQLEditor.scss';

function intersperse(things, thing) {
  let first = true;
  return _.flatMap(things, (t) => {
    if (first) {
      first = false;
      return [t];
    }
    return [thing, t];
  });
}

function renderArgs(argSpec) {
  return intersperse(argSpec.map(ts => {
    switch (ts.kind) {
      case 'fixed':
        return (<span>{ts.type}</span>);
      case 'variable':
        return (<span>{ts.type}</span>);
      default:
        console.error(`Invalid argSpec ${ts.type}`);
        return null;
    }
  }), ', ');
}

const renderResult = (t) => {
  switch (t.kind) {
    case 'fixed':
      return (<span>{t.type} <TypeIcon type={t.type} isDisabled={false} /></span>);
    case 'variable':
      return (<span>{t.type} <TypeIcon type={t.type} isDisabled={false} /></span>);
    default:
      console.error(`Invalid arg bound ${t.type}`);
  }
};

const FunctionDoc = ({ completion }) => {

  if (completion.spec) {
    const spec = completion.spec;
    return (
      <div className={styles.doc}>
        <h4>Function: {spec.name}</h4>
        <h6>Signature: {spec.name}({renderArgs(spec.sig)}) -> {renderResult(spec.result)}</h6>

        <pre>
          {spec.doc}
        </pre>
      </div>
    );
  }

  return null;
};

FunctionDoc.propTypes = {
  completion: PropTypes.object.isRequired
};


export default FunctionDoc;
