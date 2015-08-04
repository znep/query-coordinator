class AirbrakeNotifier
  def self.report_error(error, message)
    Rails.logger.error("#{error.class}: #{error} (on #{message}):\n\n#{error.backtrace.join('\n')}")
    Airbrake.notify_or_ignore(
      error,
      error_message: message
    )
  end
end
