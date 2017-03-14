# I'm middleware that logs HTTP_REFERER's to domains to a file based metrics store on the localhost.
# All y'all jive turkeys be careful: I know where you've been.
class LogRefererMiddleware
  include BrowserTypeHelper
  include PageTypeHelper

  def initialize(app)
    @app = app
    @queue = MetricQueue.instance
  end

  def call(env)
    # First we need to figure out what the domain is so that we know which
    # site to log the metrics too...
    request = ActionDispatch::Request.new(env)
    unless env['HTTP_X_FORWARDED_HOST'].blank?
      request_based_domain = env['HTTP_X_FORWARDED_HOST'].gsub(/:\d+\z/, '')
    end
    request_based_domain = request.host if request_based_domain.blank?

    domain = CurrentDomain.cname
    domain_id = CurrentDomain.domain.id.to_s

    logger.debug "Attempting to create metric for DOMAIN #{domain}. The requesting domain was #{request_based_domain}"
    if domain.blank?
      logger.warn "Unable to determine domain for request. I'm not going to log the referrer."
    else
      # Second we need to figure out how we got here.
      ref = env["HTTP_REFERER"]

      if env['HTTP_ACCEPT'] && env['HTTP_ACCEPT'].include?("text/html")
        # If the request is for an html page, then log a pageview event.
        push_page_view_metrics(request, domain_id)
      end

      if ref.blank?
        # logger.debug "Blank referrer, not logging."
      else
        begin
          uri = URI::parse(ref)
        rescue URI::InvalidURIError
          logger.debug "Invalid referrer url format '#{ref}'; not logging."
        end

        domain.downcase!
        request_based_domain.downcase!
        if uri.nil? || uri.host.nil?
          # noop
        elsif uri.host.downcase == request_based_domain
          # logger.debug "Not logging same domain referal (#{domain})."
        elsif uri.host =~ /rpxnow.com$/
          logger.debug "Not logging RPX return logins."
        else
          # If the referrer and the domain aren't the same thing, we should
          # really tell someone about this by squawking at them over STOMP.

          host = uri.scheme + "-" + uri.host
          path = uri.path
          if !uri.query.blank?
            path += "?#{uri.query}"
          end

          @queue.push_metric("referrer-hosts-#{domain_id}", "referrer-#{host}")
          @queue.push_metric("referrer-paths-#{domain_id}-#{host}", "path-#{path}")
          # TODO: We should emit to a CSV file for backup too?
        end
      end
    end

    @app.call(env)
  end

  def push_page_view_metrics(request, domain_id)
    @queue.push_metric(domain_id, 'page-views')
    @queue.push_metric(domain_id, 'js-page-view')

    page_type = page_type_with_conditional_embed(request)

    browser = browser_from_user_agent(request.user_agent)

    #New Style Metrics
    @queue.push_metric(domain_id, "page-views-#{page_type}")

    #Old Style Previously from Javascript Metrics
    @queue.push_metric(domain_id, "js-page-view-#{page_type}")

    @queue.push_metric(domain_id, "browser-#{browser[:family]}")
    @queue.push_metric("#{domain_id}-intern", "browser-#{browser[:family]}")
    @queue.push_metric("#{domain_id}-intern", "browser-#{browser[:family]}-mobile") if browser[:mobile]

    unless browser[:version].nil?
      @queue.push_metric(domain_id, "browser-#{browser[:family]}-#{browser[:version]}")
      @queue.push_metric("#{domain_id}-intern", "browser-#{browser[:family]}-#{browser[:version]}")
      @queue.push_metric("#{domain_id}-intern", "browser-#{browser[:family]}-#{browser[:version]}-mobile") if browser[:mobile]
    end
  end

private
  def logger
    Rails.logger || Logger.new
  end
end
