class JSONWithAirbrake
  def self.parse(*args)
    begin
      JSON.parse(*args)
    rescue JSON::ParserError => e
      options = args.last.is_a?(Hash) ? args.pop : {}

      notification_args = {
        :error_class => 'JSON Parser',
        :error_message => "Parse error: #{e.to_s}",
        :session => {
          :current_domain => CurrentDomain.cname,
          :current_user_id => User.current_user.try(:id) || 'Anonymous'
        }
      }
      if options[:request].present?
        notification_args.merge!(
          :parameters => {
            :request => {
              :path => options[:request].path,
              :method => options[:request].method,
              :body => options[:request].body
            }
          }
        )
      end
      Airbrake.notify(notification_args)
      raise e
    end
  end

  def method_missing(method, *args, &block)
    JSON.send(method, *args, &block)
  end
end
