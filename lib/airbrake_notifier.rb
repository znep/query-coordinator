class AirbrakeNotifier
  def self.report_error(error, message)
    log_message = "#{error.class}: #{error} (on #{message}):\n\n"
    # This check seems necessary because errors that are created and passed as
    # arguments to this method (as opposed to being rescued) will not have a
    # backtrace, causing the previous implementation to fail when it tried to
    # call `.join` on `nil`.
    if error.backtrace.present?
      log_message << "#{error.backtrace.join('\n')}"
    end

    Rails.logger.error(log_message)
    Airbrake.notify_or_ignore(
      error,
      error_message: message
    )
  end
end
