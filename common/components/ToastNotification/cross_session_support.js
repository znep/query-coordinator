import React from 'react';
import ReactDOM from 'react-dom';
import ToastNotification from './index';

const namespace = 'socrata:toastmaster';

const serializeToast = (toastProps) => {
  const currentToasts = JSON.parse(window.localStorage.getItem(namespace) || '[]');
  currentToasts.push(toastProps);
  window.localStorage.setItem(namespace, JSON.stringify(currentToasts));
};

class Toastmaster extends React.Component {
  constructor(props) {
    super(props);

    this.toasts = JSON.parse(window.localStorage.getItem(namespace) || '[]');
    window.localStorage.removeItem(namespace);

    this.state = { showing: true };

    setTimeout(() => this.setState({ showing: false }), 2500);
  }

  render() {
    return (<div>
      {this.toasts.map((props, key) => {
        return (<ToastNotification {...props} key={key} showNotification={this.state.showing}>
          <span>{props.content}</span>
        </ToastNotification>);
      })}
    </div>);
  }
}

export { serializeToast, Toastmaster };
