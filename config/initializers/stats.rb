def subscribe_to_events
  # Adapted from: http://37signals.com/svn/posts/3091-pssst-your-rails-application-has-a-secret-to-tell-you
  ActiveSupport::Notifications.subscribe /process_action.action_controller/ do |*args|
    event = ActiveSupport::Notifications::Event.new(*args)
    controller = event.payload[:controller]
    action = event.payload[:action]
    # TODO: Hostname ?
    key = "#{controller}.#{action}"

    ActiveSupport::Notifications.instrument :performance, :action => :timing,
      :measurement => "#{key}.total_duration", :value => event.duration
    ActiveSupport::Notifications.instrument :performance, :action => :timing,
      :measurement => "#{key}.core_time", :value => event.payload[:core_runtime]
    ActiveSupport::Notifications.instrument :performance, :action => :timing,
      :measurement => "#{key}.view_time", :value => event.payload[:view_runtime]
    ActiveSupport::Notifications.instrument :meter, :measurement => "#{key}.requests"
    # ActiveSupport::Notifications.instrument :performance, :action => :increment,
    #   :measurement => "#{key}.core_requests", :value => event.payload[:core_requests].reduce(0){ |s, p| s + p.last }
  end

  ActiveSupport::Notifications.subscribe 'performance' do |name, start, finish, id, payload|
    send_event_to_statsd(name, payload)
  end

  ActiveSupport::Notifications.subscribe 'meter' do |name, start, finish, id, payload|
    Frontend.statsd.meter payload[:measurement]
  end
end

def send_event_to_statsd(name, payload)
  action = payload[:action] || :increment
  measurement = payload[:measurement]
  value = payload[:value]
  Frontend.statsd.__send__ action.to_s, "#{name}.#{measurement}", (value || 1).round
end

if APP_CONFIG.statsd_enabled
  Frontend.statsd = Statsd.new(APP_CONFIG.statsd_server)
  # You probably only want to turn this on for debugging,
  # as it logs a line for _every_ freaking metric it records
  #
  # Statsd.logger = Rails.logger
  subscribe_to_events()
end
