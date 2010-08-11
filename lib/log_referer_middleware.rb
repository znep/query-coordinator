require 'stomp'
require 'pp'

# I'm middleware that logs HTTP_REFERER's to domains to a stomp service (that's
# consumed by some ActiveMQ consumer). All y'all jive turkeys be careful: I 
# know you've been. 
class LogRefererMiddleware
  @@client = nil

  def initialize(app)
    @app = app
  end

  def client
    if @@client.nil?
      uris = APP_CONFIG['activemq_hosts'].split(',')
      @@client = connect(uris)
    end

    return @@client
  end

  def connect(uris)
    config = {
      :hosts => [],
      :randomize => true,
      :max_reconnect_attempts => 1,
      :max_reconnect_delay => 1.0
    }
    uris.each do |uri|
      uri = URI.parse(uri)
      config[:hosts] << {:host => uri.host, :port => uri.port}
    end

    pp config

    Stomp::Client.open(config)
  end

  def call(env)
    # First we need to figure out what the domain is so that we know which
    # site to log the metrics too...
    request = Rack::Request.new(env)
    unless env['HTTP_X_FORWARDED_HOST'].blank?
      domain = env['HTTP_X_FORWARDED_HOST'].gsub(/:\d+\z/, '')
    end
    domain = request.host if domain.blank?

    if domain.blank?
      logger.warn "Unable to determine domain for request. I'm not going to log the referrer."
    else
      # Second we need to figure out how we got here.
      ref = env["HTTP_REFERER"]

      if env['HTTP_ACCEPT'].include?("text/html")
        # If the request is for an html page, then log a pageview event.
        logger.info "Attempting to log a page view to the #{domain} domain."
        client.publish(
          "/queue/Metrics", 
          {"timestamp" => Time.now.to_i * 1000, "entityId" => domain, "page-views" => 1}.to_json,
          :persistent => true,
          :suppress_content_length => true
        )
      end

      if ref.blank?
        # Was it by typing a link in the address bar or hiding our referrer
        # for whatever perfidious reason?
        logger.debug "Blank referrer, not logging."
      else
        # Or was it by click on a link?
        uri = URI::parse(ref)

        if uri.host != domain
          # If the referrer and the domain aren't the same thing, we should 
          # really tell someone about this by squawking at them over STOMP.
          logger.info "Attempting to log referrer #{domain} -> #{ref}."

          client.publish(
            "/queue/Metrics", 
            {"timestamp" => Time.now.to_i * 1000, "entityId" => "referrers-#{domain}", "referrer-#{ref}" => 1}.to_json,
            :persistent => true,
            :suppress_content_length => true
          )

          # TODO: We should emit to a CSV file for backup too?
        elsif uri.host == domain
          # It might have been from clicking on a link on that domain itself in
          # which case, we just want to ignore it.
          logger.debug "Not logging same domain referal (#{domain})."
        end
      end
    end
  rescue
    logger.error "There was a serious problem logging the referrer. This should probably be looked at ASAP."
    logger.error $!, $!.inspect
  ensure
    # No matter what, we want to call the next item in the middleware chain. No
    # errors here should ever stop the app from effectively running.
    return @app.call(env)
  end

  private
  def logger
    RAILS_DEFAULT_LOGGER || Logger.new
  end
end
