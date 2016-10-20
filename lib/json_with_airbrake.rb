class JSONWithAirbrake
  def self.parse(*args)
    begin
      JSON.parse(*args)
    rescue JSON::ParserError => e
      options = args.last.is_a?(Hash) ? args.pop : {}
      Airbrake.notify(
        :error_class => 'JSON Parser',
        :error_message => "Parse error: #{e.to_s}",
        :session => {
          :current_domain => CurrentDomain.cname,
          :current_user_id => User.current_user.id
        },
        :parameters => {
          :request => {
            :path => options[:request].path,
            :method => options[:request].method,
            :body => options[:request].body
          }
        }
      )
      raise e
    end
  end

  def method_missing(method, *args, &block)
    JSON.send(method, *args, &block)
  end
end
