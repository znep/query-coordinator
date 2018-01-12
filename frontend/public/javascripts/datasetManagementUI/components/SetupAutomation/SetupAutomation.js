import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { ModalHeader, ModalContent, ModalFooter, Dropdown } from 'common/components';
import styles from 'styles/SetupAutomation.module.scss';
import Highlight from 'react-syntax-highlight';
import CopyToClipboard from 'react-copy-to-clipboard';

const SubI18n = I18n.automate_this;

function uploadFunctionName(source) {
  const contentTypeFunctionNameMapping = [
    ['text/csv', 'csv'],
    ['application/vnd.ms-excel', 'xls'],
    ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx'],
    ['text/tab-separated-values', 'tsv'],
    ['application/zip', 'shapefile'],
    ['application/x-zip', 'shapefile'],
    ['application/vnd.google-earth.kml+xml', 'kml'],
    ['application/vnd.google-earth.kmz', 'kmz'],
    ['application/vnd.geo+json', 'geojson']
  ];

  for (const [mime, funcName] of contentTypeFunctionNameMapping) {
    if (source.content_type.indexOf(mime) > -1) {
      return funcName;
    }
  }
  return 'csv'; // idk - maybe they'll figure it out at this point
}


function UploadSourcePythonCode({ fourfour, source, importConfigName }) {
  const content = `from socrata.authorization import Authorization
from socrata import Socrata
import os
import sys

auth = Authorization(
  '${window.location.host}',
  os.environ['MY_SOCRATA_USERNAME'],
  os.environ['MY_SOCRATA_PASSWORD']
)

socrata = Socrata(auth)

(ok, view) = socrata.views.lookup('${fourfour}')
assert ok, view

with open('${source.source_type.filename}', 'rb') as my_file:
  (ok, job) = socrata.using_config('${importConfigName}', view).${uploadFunctionName(source)}(my_file)
  assert ok, job
  # These next 3 lines are optional - once the job is started from the previous line, the
  # script can exit; these next lines just block until the job completes
  assert ok, job
  (ok, job) = job.wait_for_finish(progress = lambda job: print('Job progress:', job.attributes['status']))
  sys.exit(0 if job.attributes['status'] == 'successful' else 1)

`;
  return (<div className={styles.codeWindow}>
    <CopyToClipboard text={content}>
      <button className={styles.copyBtn}>
        {SubI18n.copy_code}
      </button>
    </CopyToClipboard>
    <Highlight lang="python" value={content} />
  </div>);
}

UploadSourcePythonCode.propTypes = {
  outputSchemaId: PropTypes.number.isRequired,
  source: PropTypes.object.isRequired,
  fourfour: PropTypes.string.isRequired,
  importConfigName: PropTypes.string.isRequired
};


function ConfigError({ error }) {
  return (
    <div className={styles.error}>{error}</div>
  );
}
ConfigError.propTypes = {
  error: PropTypes.string.isRequired
};

function ConfigLoading() {
  return (
    <div className={styles.appendOrReplaceSelection}>
      <div className="spinner-default spinner-large" />
    </div>
  );
}

ConfigLoading.propTypes = {
};

function ImportConfigSteps({ fourfour, source, importConfig, outputSchemaId }) {
  return (
    <ol>
      <li>
        {SubI18n.install_socrata_py}
        <div className={styles.codeWindow}>
          <Highlight lang="bash" value="pip install socrata-py" />
        </div>
        {SubI18n.local_py_env}
      </li>
      <li>
        {SubI18n.containing_this_code}
        <UploadSourcePythonCode
          fourfour={fourfour}
          source={source}
          outputSchemaId={outputSchemaId}
          importConfigName={importConfig.name} />
      </li>
      <li>
        {SubI18n.use_a_task_scheduler}
        <div className={styles.codeWindow}>
          <Highlight lang="bash" value="python3 my-update-script.py" />
        </div>
      </li>
      <li>
        <a target="_blank" href="/admin/activity_feed">{SubI18n.activity_log}</a>
      </li>
    </ol>
  );
}

ImportConfigSteps.propTypes = {
  outputSchemaId: PropTypes.number.isRequired,
  source: PropTypes.object.isRequired,
  fourfour: PropTypes.string.isRequired,
  importConfig: PropTypes.object.isRequired
};

function DataActionChooser({ importConfig, onChooseDataAction }) {
  const dropdownProps = {
    value: importConfig ? importConfig.data_action : null,
    placeholder: SubI18n.choose_update_replace,
    onSelection: (chosen) => onChooseDataAction(chosen.value),
    options: [
      {
        title: SubI18n.update,
        value: 'update'
      },
      {
        title: SubI18n.replace,
        value: 'replace'
      }
    ]
  };
  return (<div className={styles.appendOrReplaceSelection}>
    <Dropdown {...dropdownProps} />
    <p className={styles.appendUpdateExplanation}>
      {SubI18n.append_vs_update}
    </p>
  </div>);
}

DataActionChooser.propTypes = {
  importConfig: PropTypes.object,
  onChooseDataAction: PropTypes.func.isRequired
};

class SetupAutomation extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      error: false,
      importConfig: null
    };
    this.onChooseDataAction = this.onChooseDataAction.bind(this);
  }

  onChooseDataAction(action) {
    this.setState({
      loading: true,
      error: false
    });
    this.props.createImportConfig(this.props.source, this.props.outputSchemaId, action)
      .then((importConfig) => {
        this.setState({
          loading: false,
          importConfig
        });
      })
      .catch(({ body }) => {
        this.setState({
          loading: false,
          error: body.message
        });
      });
  }

  render() {
    const { importConfig, loading, error } = this.state;
    const { fourfour, source, outputSchemaId, onDismiss } = this.props;

    const headerProps = {
      title: SubI18n.title,
      onDismiss
    };

    let content;
    if (error) {
      content = (<ConfigError error={error} />);
    } else if (loading) {
      content = (<ConfigLoading />);
    } else if (importConfig) {
      content = (<ImportConfigSteps
        fourfour={fourfour}
        source={source}
        importConfig={importConfig}
        outputSchemaId={outputSchemaId} />);
    } else {
      content = (<DataActionChooser
        importConfig={importConfig}
        onChooseDataAction={this.onChooseDataAction} />
      );
    }

    return (
      <div className={styles.setupAutomation}>
        <ModalHeader {...headerProps} />
        <ModalContent>
          <p style={{ marginTop: 10 }}>
            {SubI18n.description}
          </p>
          {content}
        </ModalContent>
        <ModalFooter>
          <button
            className="btn btn-primary"
            onClick={onDismiss}>
            {I18n.common.done}
          </button>
        </ModalFooter>
      </div>
    );
  }
}

SetupAutomation.propTypes = {
  fourfour: PropTypes.string.isRequired,
  outputSchemaId: PropTypes.number.isRequired,
  source: PropTypes.object.isRequired,
  onDismiss: PropTypes.func.isRequired,
  createImportConfig: PropTypes.func.isRequired
};

export default SetupAutomation;
