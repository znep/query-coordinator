require 'stomp'

# I'm middleware that logs HTTP_REFERER's to domains to a stomp service (that's
# consumed by some ActiveMQ consumer). All y'all jive turkeys be careful: I 
# know you've been. 
class LogRefererMiddleware
  @@client = nil
  cattr_accessor :stomp_server_uri

  def initialize(app)
    @app = app
  end

  def client
    if @@client.nil?
      @@client = connect(@@stomp_server_uri)
    end

    return @@client
  end

  def connect(uri)
    Stomp::Client.open uri 
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

      if ref.blank?
        # Was it by typing a link in the address bar or hiding our referer
        # for whatever perfidious reason?
        logger.debug "Blank referer, not logging."
      else
        # Or was it by click on a link?
        uri = URI::parse(ref)

        if uri.host != domain
          # If the referer and the domain aren't the same thing, we should 
          # really tell someone about this by squawking at them over STOMP.
          logger.info "Attempting to log referer #{domain} -> #{ref}."

          client.publish(
            "/queue/Metrics", 
            {"timestamp" => Time.now.to_i * 1000, "entityId" => "referers-#{domain}", "referer-#{ref}" => 1}.to_json,
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
    logger.error "There was a serious problem logging the referer. This should probably be looked at ASAP."
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
