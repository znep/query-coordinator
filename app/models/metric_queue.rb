require 'stomp'

class MetricQueue
  include Singleton

  @@requests = []

  def initialize
    at_exit do
      flush_requests(true)
      # Yes, @, not @@, because we're in the class scope now
      @client.close unless @client.nil?
    end
  end

  def push_metric(entityId, metricName, count = 1)
    push_request({
      :timestamp => Time.now.to_i * 1000,
      :entityId => entityId,
      :metrics => {
        metricName => {
          :value => count,
          :type => :aggregate
        }
      }
    })
  end

  def push_request(data)
    @@requests << { :uri => QUEUE_NAME, :data => data.to_json, :params => STOMP_PARAMS }
    flush_requests if @@requests.size >= BATCH_REQUESTS_BY
  end

private
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
    @@client ||= begin
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
    @logger ||= Rails.logger || Logger.new
  end

  BATCH_REQUESTS_BY = Rails.env.development? ? 1 : 100
  STOMP_PARAMS = {
    :persistent => true,
    :suppress_content_length => true
  }
  QUEUE_NAME = '/queue/Metrics2'
end
