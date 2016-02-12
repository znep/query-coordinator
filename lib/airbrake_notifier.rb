class AirbrakeNotifier
  def self.report_error(error, message, additional_params = {})
    log_message = "#{error} (on #{message}):\n\n"
    # This check seems necessary because errors that are created and passed as
    # arguments to this method (as opposed to being rescued) will not have a
    # backtrace, causing the previous implementation to fail when it tried to
    # call `.join` on `nil`.
    log_message_backtrace = error.backtrace.present? ? "#{error.backtrace.join('\n')}" : ""

    Rails.logger.error("#{error.class}: #{log_message}#{log_message_backtrace}")

    Airbrake.notify(
      error,
      additional_params.merge(message: message)
    )
  end

  # Values that might be useful to have in the airbrake notice.
  def self.default_payload
    payload = {}

    payload[:environment] ||= {}
    payload[:environment][:appVersion] = Rails.application.config.version

    payload[:context] ||= {}
    session_headers = ::RequestStore.store[:socrata_session_headers]
    unless session_headers.nil?
      payload[:context][:requestId] = session_headers['X-Socrata-RequestId']
      payload[:context][:host] = session_headers['X-Socrata-Host']
    end
    payload[:context][:referrer] = ::RequestStore.store[:http_referrer]

    story_uid = ::RequestStore.store[:story_uid]
    unless story_uid.blank?
      payload[:params] ||= {}
      payload[:params][:storyUid] = story_uid
    end

    payload
  end
end
