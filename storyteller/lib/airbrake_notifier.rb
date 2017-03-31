class AirbrakeNotifier
  # Reports an error to airbrake and logs it to the logger.
  # You can pass arbitrary additional parameters along with the airbrake notice.
  #
  # Passing `:on_method` to additional_params adds " (on `#{on_method}`)" to the rails log message.
  #
  # @example
  #   begin
  #     ...
  #   rescue => error
  #     AirbrakeNotifier.report_error(error)
  #   end
  #
  # @param error [Error]
  # @param additional_params [Hash]
  def self.report_error(error, additional_params = {})
    log_message = "#{error}"
    log_message << " (on #{additional_params[:on_method]})" unless additional_params[:on_method].blank?
    log_message << ":\n\n"

    # This check seems necessary because errors that are created and passed as
    # arguments to this method (as opposed to being rescued) will not have a
    # backtrace, causing the previous implementation to fail when it tried to
    # call `.join` on `nil`.
    log_message_backtrace = error.backtrace.present? ? "#{error.backtrace.join('\n')}" : ""

    Rails.logger.error("#{error.class}: #{log_message}#{log_message_backtrace}")

    Airbrake.notify(
      error,
      additional_params
    )
  end

  # These values are set for every airbrake error generated from the rails app
  # See `config/initializers/airbrake.rb`
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

    unless CoreServer.current_user.blank?
      payload[:context][:user_id] = CoreServer.current_user['id']
    end

    story_uid = ::RequestStore.store[:story_uid]
    unless story_uid.blank?
      payload[:params] ||= {}
      payload[:params][:storyUid] = story_uid
    end

    payload
  end
end
