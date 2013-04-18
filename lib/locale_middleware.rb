# Set the locale on every request

# Note that this relies on the current domain being available, so
# it's important to put this after that in the middleware chain.

class LocaleMiddleware
  def initialize(app)
    @app = app
  end

  def call(env)
    request = Rack::Request.new(env)
    unless env['HTTP_X_FORWARDED_HOST'].blank?
      host = env['HTTP_X_FORWARDED_HOST'].gsub(/:\d+\z/, '')
    end
    host = request.host if host.blank?


    locales = CurrentDomain.configuration(:locales)

    # first, try loading from subdomain
    locale = locales.properties[host]

    domain_locales = locales.properties['available_locales']
    domain_locales = [locale] if domain_locales.nil? || domain_locales.empty?
    domain_locales.push(locale) if !domain_locales.include?(locale)

    if locale.blank?
      # fall back to checking path lead
      possible_locale = request.path.match(/^\/([^\/]+)/)[1] rescue nil
      if possible_locale.present? && (possible_locale == 'nyan' || domain_locales.include?(possible_locale))
        locale = possible_locale

        # really, all these are legacy vars except PATH_INFO, but set
        # them just in case.
        env['PATH_INFO'] = env['REQUEST_PATH'] =
          env['REQUEST_URI'] = env['PATH_INFO'][(locale.size + 1)..-1]
      end
    end

    if locale.blank?
      # fall back to domain default
      locale = locales.properties['*']
    end

    env['socrata.locale'] = locale
    env['socrata.available_locales'] = domain_locales
    I18n.locale = locale
    @app.call(env)
  end
end
