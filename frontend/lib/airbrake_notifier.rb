class AirbrakeNotifier
  # These values are set for every airbrake error generated from the rails app
  # See `config/initializers/airbrake.rb`
  def self.default_payload
    payload = {}

    payload[:environment] ||= {}
    payload[:environment][:sha] = ::REVISION_NUMBER
    payload[:environment][:rails_env] = Rails.env

    payload[:context] ||= {}
    payload[:context][:request_id] = ::Socrata::RequestIdHelper.current_request_id

    payload
  end
end
