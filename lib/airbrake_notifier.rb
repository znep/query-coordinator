class AirbrakeNotifier
  def self.report_error(error, message)
    log_message = "#{error} (on #{message}):\n\n"
    # This check seems necessary because errors that are created and passed as
    # arguments to this method (as opposed to being rescued) will not have a
    # backtrace, causing the previous implementation to fail when it tried to
    # call `.join` on `nil`.
    log_message_backtrace = error.backtrace.present? ? "#{error.backtrace.join('\n')}" : ""

    Rails.logger.error("#{error.class}: #{log_message}#{log_message_backtrace}")
    Airbrake.notify_or_ignore(
      error,
      error_message: log_message
    )
  end
end
