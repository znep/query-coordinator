# How Do I Airbrake?

By default all unhandled exceptions in the rails and javascript apps will be sent to Airbrake.
You can manually send Airbrake notices from either as well.

## rails (ruby)

Use `AirbrakeNotifier.report_error` to send a manual notice to Airbrake.

For the simplest use case, pass the caught error to the method:
```
def some_method
  begin
    # some code that raises
  rescue => error
    AirbrakeNotifier.report_error(error)
  end
end
```

You can also pass additional parameters to the method:
```
AirbrakeNotifier.report_error(
  error,
  arbitrary_parameter: 'additional info',
  another_param: 'sweet'
)
```

The `:on_method` parameter will be added to the log message that is passed to the rails logger:
```
AirbrakeNotifier.report_error(
  RuntimeError.new('Something bad happened'),
  on_method: 'foos_controller#show'
)
```
...will result in logger message in rails:
```
[2016-02-17 17:36:06,796 ] Something bad happened (on foos_controller#show)
```

## frontend (javascript)

A wrapper around Airbrake has been provided in `ExceptionNotifier`. The exported object
has a `notify` method which can be used to broadcast errors to Airbrake, Google Analytics,
and the JS console all at the same time. Example usage:

```
import { exceptionNotifier } from '../services/ExceptionNotifier';

if (1 > 2) {
  exceptionNotifier.notify(new Error('Mathematics is broken'));

  // a non-Error argument will be converted to an Error
  exceptionNotifier.notify('Mathematics is broken');
}
```
