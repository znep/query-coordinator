require 'stomp'

# I'm middleware that logs HTTP_REFERER's to domains to a stomp service (that's
# consumed by some ActiveMQ consumer). All y'all jive turkeys be careful: I 
# know you've been. 
class LogRefererMiddleware
  @@client = nil
  @@requests = []
  BATCH_REQUESTS_BY = 100

  def initialize(app)
    @app = app
  end

  def call(env)
    client # init connection

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
        push_request(
          "/queue/Metrics",
          {"timestamp" => Time.now.to_i * 1000, "entityId" => domain, "page-views" => 1}.to_json,
          :persistent => true,
          :suppress_content_length => true
        )
      end

      if ref.blank?
        logger.debug "Blank referrer, not logging."
      else
        uri = URI::parse(ref)

        if uri.host == domain
          logger.debug "Not logging same domain referal (#{domain})."
        else
          # If the referrer and the domain aren't the same thing, we should 
          # really tell someone about this by squawking at them over STOMP.
          logger.info "Attempting to log referrer #{domain} -> #{ref}."

          push_request(
            "/queue/Metrics",
            {"timestamp" => Time.now.to_i * 1000, "entityId" => "referrers-#{domain}", "referrer-#{ref}" => 1}.to_json,
            :persistent => true,
            :suppress_content_length => true
          )

          # TODO: We should emit to a CSV file for backup too?
        end
      end
    end

    return @app.call(env)
  end

  at_exit do
    dump_requests
  end

private

  def push_request(uri, data, params)
    @@requests << { :uri => uri, :data => data, :params => params }

    if @@requests.size >= BATCH_REQUESTS_BY
      dump_requests
    end
  end

  def dump_requests
    current_requests = @@requests
    @@requests = []

    Thread.new {
      begin
        logger.debug "Hit batch limit of #{BATCH_REQUESTS_BY}, firing off requests..."
        @@requests.each do |request|
          client.publish(request[:uri], request[:data], request[:params])
        end
        logger.debug "Done firing off requests."
      rescue
        logger.error "There was a serious problem logging the referrer. This should probably be looked at ASAP."
        logger.error $!, $!.inspect
      end
    }
  end

  def client
    if @@client.nil?
      uris = APP_CONFIG['activemq_hosts'].split(/\s*,\s*/)
      @@client = connect(uris)
    end

    return @@client
  end

  def connect(uris)
    config = {
      :hosts => [],
      :randomize => true,
      :max_reconnect_attempts => -2 # in case they ever fix this to -1 like the documentation claims
    }
    uris.each do |uri|
      uri = URI.parse(uri)
      config[:hosts] << {:host => uri.host, :port => uri.port}
    end

    Stomp::Client.open(config)
  end

  def logger
    RAILS_DEFAULT_LOGGER || Logger.new
  end
end
