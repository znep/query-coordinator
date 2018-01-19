require 'digest/md5'

class CustomContentController < ApplicationController
  include CustomContentHelper

  before_filter :check_lockdown_with_exceptions
  around_filter :cache_wrapper, :except => [ :stylesheet, :page ]
  skip_before_filter :require_user, :except => [ :template ]
  skip_before_filter :hook_auth_controller, :set_user, :sync_logged_in_cookie, :only => [:stylesheet]

  # For testing
  def page_override=(val)
    @page_override = val
  end

  def homepage
    Canvas::Environment.context = :homepage
    @meta[:page_name] = 'Homepage Catalog'
    @cache_key = app_helper.cache_key('homepage', cache_hash(params))
    @cached_fragment = read_fragment(@cache_key)
    if @cached_fragment.nil?
      @page_config = get_config('homepage', 'homepage')
      @page_config = default_homepage if @page_config.nil? || @page_config.default_homepage
      prepare_config(@page_config)

      @page_title = @page_config.title
      @stylesheet = 'homepage/homepage'
    end

    render :action => 'show'
  end

  def show_page
    Canvas::Environment.context = :page

    @page_config = get_config('page', params[:page_name])
    return render_404 unless @page_config
    prepare_config(@page_config)

    @page_title = @page_config.title
    @stylesheet = "page/#{params[:page_name]}"

    render :action => 'show'
  end

  def show_facet_listing
    Canvas::Environment.context = :facet_listing

    @page_config = get_config('facet_listing', params[:facet_name])
    return render_404 unless @page_config
    prepare_config(@page_config)

    @page_title = @page_config.title
    @stylesheet = "facet_listing/#{params[:facet_name]}"

    render :action => 'show'
  end

  def show_facet_page
    Canvas::Environment.context = :facet_page

    @page_config = get_config('facet_page', params[:facet_name])
    return render_404 unless @page_config
    prepare_config(@page_config)

    @page_title = [ Canvas::Environment.facet_value, @page_config.title ]
    @stylesheet = "facet_page/#{params[:facet_name]}"

    render :action => 'show'
  end

  # warning! only one stylesheet is cached per *type* of canvas page!
  # this is intentional to reduce dupes...
  def stylesheet
    headers['Content-Type'] = 'text/css'

    cache_key = app_helper.cache_key(
      "canvas-stylesheet-#{params[:page_type]}-#{params[:config_name]}",
      'domain' => CurrentDomain.cname,
      'config_updated' => CurrentDomain.configuration(:custom_content).updatedAt
    )
    sheet = Rails.cache.read(cache_key)

    if sheet.nil?
      page_config = get_config(params[:page_type], params[:config_name])

      if (params[:page_type] == 'homepage') && (page_config.nil? || page_config.default_homepage)
        Rails.cache.write(cache_key, '')
        return render :nothing => true, :content_type => 'text/css'
      elsif page_config.nil?
        return render_404 unless page_config
      end
      prepare_config(page_config, false)

      sheet = build_stylesheet(page_config.contents)
      Rails.cache.write(cache_key, sheet, :expires_in => 12.minutes)
    end

    render :text => sheet, :content_type => 'text/css'
  end

  def page
    @debug = params['debug'] == 'true'
    @edit_mode = params['_edit_mode'] == 'true'
    @start_time = Time.now

    # Rails routing breaks the :ext param out if it thinks it's a file extension.
    # Old Dataslate Routing checked if it was an xlsx or csv, but since New Dataslate Routing
    # does not support those features anymore (they are evil), I'm ignoring them.
    # See: EN-11175
    full_path = "/#{params[:path]}"
    full_path << ".#{params[:ext].downcase}" if params[:ext].present?

    @page = DataslateRouting.for(full_path, { ext: params[:ext].try(:downcase) })
    @vars = @page.try(:[], :vars)
    @page = @page.try(:[], :page)

    # check for redirects:
    if @page.try(:redirect?)
      redirect_info = @page.redirect_info
      redirect_to(redirect_info[:path], :status => redirect_info[:code])
      return true # dunno why! but if i don't do this the canvas env is horked for the next req.
    end

    # Pass to the view if we are on a dataslate page and/or the homepage in order to determine
    # whether to render the site chrome header/footer based on the corresponding feature flags.
    @using_dataslate = true
    @on_homepage = full_path == '/'

    if @page.nil? || !@page.viewable_by?(@current_user)
      if @on_homepage
        self.action_name = 'homepage'
        homepage
      else
        render_404
      end
      return true
    end

    Canvas2::DataContext.reset
    Canvas2::Util.reset
    Canvas2::Util.set_params(params)
    Canvas2::Util.set_request(request)
    Canvas2::Util.set_cookies(Socrata::CookieHelper.current_cookies)
    Canvas2::Util.set_request_id(Socrata::RequestIdHelper.current_request_id)
    Canvas2::Util.set_debug(@debug || @edit_mode)
    Canvas2::Util.set_no_cache(@page.max_age.try(:<=, 0) || false)
    Canvas2::Util.set_path(full_path)
    # Set without user before we load pages
    Canvas2::Util.set_env({
      domain: CurrentDomain.cname,
      renderTime: Time.now.to_i,
      path: full_path,
      siteTheme: CurrentDomain.theme,
      currentUser: (@current_user.try(:id) if @page.private_data?),
      current_locale: I18n.locale,
      available_locales: request.env['socrata.available_locales']
    })
    Canvas2::Util.is_private(@page.private_data?)

    # suppress govstat toolbar chrome and styling if requested:
    if CurrentDomain.module_enabled?(:govStat)
      # suppress govstat chrome on homepage
      @suppress_govstat ||= @page.homepage?

      # suppress govstat chrome for selected urls
      @suppress_govstat ||= CurrentDomain.configuration('gov_stat').
        try(:properties).
        try(:suppress_govstat).
        try(:any?) { |route| request.path =~ Regexp.new(route) }
    end

    @body_class = @page.body_class
    @minimal_render = params['no_render'] == 'true'

    # XXX: TERRIBLE THING WE DO. TODO: BETTERNESS
    # Move to different variable so we can control rendering in our own
    # template, instead of the main layout
    @custom_meta = @meta
    @meta = nil
    @page_title = [ @page.name, get_site_title ].reject(&:blank?).join(' | ')
  end

  before_filter :only => [:template] { |c| c.require_right(UserRights::CREATE_PAGES) }
  def template
    @templet = Template[params[:id]]
    return(render_404) unless @templet
  end

  private

  ANONYMOUS_USER = 'anon'.freeze

  # Knowing whether privateData is set and the user figure out
  # which user_id should be used for the manifest key
  def user_tristate(isPrivate, user)
    if user.nil?
      ANONYMOUS_USER
    else
      if isPrivate
        user.id
      else
        ANONYMOUS_USER
      end
    end
  end

  def cache_hash(params)
    {
      'domain' => CurrentDomain.cname,
      'locale' => I18n.locale,
      'domain_updated' => CurrentDomain.default_config_updated_at,
      'params' => Digest::MD5.hexdigest(params.sort.to_json)
    }
  end

  # around_filter for caching
  def cache_wrapper
    cache_params = cache_hash(params)
    @cache_key = app_helper.cache_key("canvas-#{params[:action]}", cache_params)
    @cached_fragment = read_fragment(@cache_key)

    if @cached_fragment.nil?
      yield
    else
      render :action => 'show'
    end
  end

  # get a config from the configurations service and prepare the env for render
  def get_config(page_type, config_name)
    properties = CurrentDomain.property(page_type.pluralize, :custom_content)
    return nil unless properties

    page_config = properties[config_name]
    return nil unless page_config

    page_config
  end

  # take a canvas configuration and prepare it for render
  def prepare_config(page_config, prepare = true)
    # turn toplevel contents into objects; rest will transform as needed
    page_config.contents = Canvas::CanvasWidget.from_config(page_config.contents, 'Canvas')

    # set up canvas rendering environment
    Canvas::Environment.facet_name = params[:facet_name]
    if params[:facet_value].present?
      Canvas::Environment.facet_value = CGI.unescape(params[:facet_value])
    else
      Canvas::Environment.facet_value = nil
    end
    Canvas::Environment.params = params
    Canvas::Environment.page_config = Hashie::Mash.new(page_config.reject { |key| key == 'contents' })
    Canvas::Environment.request = request
    Canvas::Environment.cookies = Socrata::CookieHelper.current_cookies
    Canvas::Environment.request_id = Socrata::RequestIdHelper.current_request_id
    Canvas::Environment.locale_config = I18n.config

    # ready whatever we might need
    if prepare
      if page_config.dataBindings
        bindings = {}
        binding_threads = page_config.dataBindings.map do |key, properties|
          Thread.new do
            Canvas::Environment.prepare_thread!

            binding = bindings[key.to_s] = Hashie::Mash.new
            binding.properties = properties

            if properties.type == 'search'
              begin
                search_options = properties.searchOptions.to_hash
                if properties.paramGroup && request.params.has_key?(properties.paramGroup)
                  search_options.merge!(request.params[properties.paramGroup])
                end

                results = Clytemnestra.search_views(search_options)
                binding.views, binding.result_count = results.results, results.count
              rescue CoreServer::ResourceNotFound
                # some configurations of catalog search can actually return a 404
                binding.views = []
              end
            elsif properties.type == 'uid'
              begin
                binding.views = ::View.find(properties.viewUid)
              rescue CoreServer::ResourceNotFound
                binding.views = []
              rescue CoreServer::CoreServerError
                binding.views = []
              end
            end
          end
        end
        binding_threads.each{ |thread| thread.join }
        Canvas::Environment.bindings = bindings
      end

      page_config.contents.each{ |widget| widget.prepare_bindings! }

      threads = page_config.contents.map{ |widget| Thread.new{ Canvas::Environment.prepare_thread!; widget.prepare! } if widget.can_prepare? }
      threads.compact.each{ |thread| thread.join }
    else
      if page_config.dataBindings
        # we're not actually going to prepare anything, but we need to fake some
        # bindings so that the stylesheet lines up
        bindings = {}
        page_config.dataBindings.each do |key, properties|
          limit =
            if properties.type == 'search'
              properties.searchOptions.limit
            else
              1
            end
          bindings[key.to_s] = Hashie::Mash.new(
            properties: properties,
            views: (1..limit).map { Canvas::Util::FakeView.new }
          )
        end

        Canvas::Environment.bindings = bindings
        page_config.contents.each{ |widget| widget.prepare_bindings! } # don't bother multithreading; ain't nothing gonna happen
      end
    end

    # Get a unique array of style packages required by the widgets to be displayed
    page_config.stylesheets = page_config.contents.collect{ |widget| widget.stylesheets }.flatten.compact.uniq

    page_config
  end

  def build_stylesheet(widget)
    if widget.is_a?(Array)
      widget.map { |child| build_stylesheet(child) }.join
    else
      widget.stylesheet
    end
  end

  def app_helper
    AppHelper.instance
  end

  def default_homepage
    Hashie::Mash.new(
      title: '',
      default_homepage: true,
      default_styles: true,
      contents: [{
        type: 'data_splash'
      }, {
        type: 'stories',
        properties: {
          fromDomainConfig: true
        }
      }, {
        type: 'featured_views',
        properties: {
          fromDomainConfig: true
        }
      }, {
        type: 'catalog',
        properties: {
          browseOptions: {
            base_url: browse_path,
            suppress_dataset_creation: true
          }
        }
      }]
    )
  end

  def check_lockdown_with_exceptions
    exception_exists =
      CurrentDomain.configuration('dataslate_config')&.
        properties&.
        staging_lockdown_exceptions&.
        any? { |route| request.path =~ Regexp.new(route) }
    check_lockdown unless exception_exists
  end
end

class AppHelper
  include Singleton
  include ApplicationHelper
end
