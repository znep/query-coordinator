require 'stomp'

# I'm middleware that logs HTTP_REFERER's to domains to a stomp service (that's
# consumed by some ActiveMQ consumer). All y'all jive turkeys be careful: I 
# know you've been. 
class LogRefererMiddleware
  class << self
    attr_accessor :client
  end

  @@requests = []
  BATCH_REQUESTS_BY = Rails.env.development? ? 1 : 100

  def initialize(app)
    @app = app

    at_exit do
      flush_requests(true)
      self.class.client.close unless self.class.client.nil?
    end
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

      if env['HTTP_ACCEPT'] && env['HTTP_ACCEPT'].include?("text/html")
        # If the request is for an html page, then log a pageview event.
        logger.info "Attempting to log a page view to the #{domain} domain."
        push_request(
          "/queue/Metrics2",
          {
            "timestamp" => Time.now.to_i * 1000, 
            "entityId" => domain, 
            "metrics" => {
              "page-views" => {
                "value" => 1,
                "type" => "aggregate"
              }
            }
          }.to_json,
          :persistent => true,
          :suppress_content_length => true
        )
      end

      if ref.blank?
        logger.debug "Blank referrer, not logging."
      else
        begin
          uri = URI::parse(ref)
        rescue URI::InvalidURIError
          logger.debug "Invalid referrer url format; not logging."
        end

        if uri.nil?
          # noop
        elsif uri.host == domain
          logger.debug "Not logging same domain referal (#{domain})."
        elsif uri.host =~ /rpxnow.com$/
          logger.debug "Not logging RPX return logins."
        else
          # If the referrer and the domain aren't the same thing, we should 
          # really tell someone about this by squawking at them over STOMP.
          logger.info "Attempting to log referrer #{domain} -> #{ref}."

          host = uri.scheme + "-" + uri.host
          path = uri.path
          if !uri.query.blank?
            path += "?#{uri.query}"
          end

          push_request(
            "/queue/Metrics2",
            {
              "timestamp" => Time.now.to_i * 1000, 
              "entityId" => "referrer-hosts-#{domain}", 
              "metrics" => {
                "referrer-#{host}" => {
                  "value" => 1,
                  "type" => "aggregate"
                }
              }
            }.to_json,
            :persistent => true,
            :suppress_content_length => true
          )

          push_request(
            "/queue/Metrics2",
            {
              "timestamp" => Time.now.to_i * 1000, 
              "entityId" => "referrer-paths-#{domain}-#{host}", 
              "metrics" => {
                "path-#{path}" => {
                  "value" => 1,
                  "type" => "aggregate"
                }
              }
            }.to_json,
            :persistent => true,
            :suppress_content_length => true
          )

          # TODO: We should emit to a CSV file for backup too?
        end
      end
    end

    return @app.call(env)
  end

private

  def push_request(uri, data, params)
    @@requests << { :uri => uri, :data => data, :params => params }

    flush_requests if @@requests.size >= BATCH_REQUESTS_BY
  end

  def flush_requests(synchronous = false)
    return if @@requests.empty?

    begin
      get_client # init connection in main thread
    rescue Stomp::Error::MaxReconnectAttempts => e
      logger.warn "Unable to initialize the stomp producer. This probably means that JMS is down."
    end

    current_requests = @@requests
    @@requests = []

    if Rails.env.development?
      do_flush_requests(current_requests)
      begin
        get_client.close
      rescue Stomp::Error::MaxReconnectAttempts => e
        logger.warn "Unable to initialize the stomp producer. This probably means that JMS is down."
      end
    elsif synchronous
      do_flush_requests(current_requests)
    else
      Thread.new do
        # be chivalrous
        Thread.pass

        do_flush_requests(current_requests)
      end
    end
  end

  def do_flush_requests(current_requests)
    begin
      logger.debug "Hit batch limit of #{BATCH_REQUESTS_BY}, firing off requests..."
      logger.debug current_requests.inspect
      current_requests.each do |request|
        get_client.publish(request[:uri], request[:data], request[:params])
      end
      logger.debug "Done firing off requests."
    rescue Stomp::Error::MaxReconnectAttempts => e
      logger.error "There was a problem connecting to the JMS server. This is a really urgent problem. Fix stat."
    rescue
      logger.error "There was a serious problem logging the referrer. This should probably be looked at ASAP."
      logger.error $!, $!.inspect
    end
  end

  def get_client
    self.class.client ||= begin
      uris = APP_CONFIG['activemq_hosts'].split(/\s*,\s*/)
      connect(uris)
    end
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
    Rails.logger || Logger.new
  end
end
