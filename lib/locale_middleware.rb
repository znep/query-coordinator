# Set the locale on every request

# Note that this relies on the current domain being available, so
# it's important to put this after that in the middleware chain.

class LocaleMiddleware
  include SocrataDockerHelpers

  def initialize(app)
    @app = app
  end

  def call(env)
    request = Rack::Request.new(env)
    unless env['HTTP_X_FORWARDED_HOST'].blank?
      host = env['HTTP_X_FORWARDED_HOST'].gsub(/:\d+\z/, '')
    end
    host = request.host if host.blank?

    if socrata_docker_environment? && env['REQUEST_PATH'].to_s.match(/^\/version/)
      env['socrata.locale'] = 'en'
      env['socrata.available_locales'] = ['en']
      I18n.locale = 'en'
      return @app.call(env)
    end

    locales = CurrentDomain.configuration(:locales)

    # first, try loading from subdomain
    # this is to enable cname-based locale enforcement; eg fr.socrata.com
    #
    # use raw_properties or else { 'x.y.com': 'en' } becomes { 'x': { 'y': { 'com': 'en' } } }
    locale = locales.raw_properties[host]

    # now grab all the ones that are acceptable
    domain_locales = CurrentDomain.available_locales + [ locale ]

    # read our path lead
    path_lead = request.path.match(/^\/([^\/]+)/)[1] rescue nil
    lead_is_locale = path_lead.present? && (path_lead == 'nyan' || domain_locales.include?(path_lead))

    if locale.present?
      # our cname has already given us a locale; nothing to be done except:

      if lead_is_locale
        # redirect out of path lead if it's present
        return [ 301, { Location: env['PATH_INFO'][(locale.size + 1)..-1] }, [] ]
      end

    elsif lead_is_locale
      # our cname doesn't have a default locale; check the path lead.
      locale = path_lead

      # really, all these are legacy vars except PATH_INFO, but set
      # them just in case.
      env['PATH_INFO'] = env['REQUEST_PATH'] =
        env['REQUEST_URI'] = env['PATH_INFO'][(locale.size + 1)..-1]

    else
      # none of the above worked; fall back to domainwide default.
      locale = locales.properties['*'] || 'en'
    end

    env['socrata.locale'] = locale
    env['socrata.available_locales'] = domain_locales
    I18n.locale = locale
    @app.call(env)
  end
end
