require 'digest/md5'

class CustomContentController < ApplicationController
  before_filter :check_lockdown
  around_filter :cache_wrapper, :except => [ :stylesheet, :page ]
  skip_before_filter :require_user, :except => [ :template ]
  skip_before_filter :hook_auth_controller, :set_user, :sync_logged_in_cookie, :only => [:stylesheet]

  def homepage
    Canvas::Environment.context = :homepage

    @page_config = get_config('homepage', 'homepage')
    @page_config = default_homepage if @page_config.nil? || @page_config.default_homepage
    prepare_config(@page_config)

    @page_title = @page_config.title
    @stylesheet = 'homepage/homepage'

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

    cache_key = app_helper.cache_key("canvas-stylesheet-#{params[:page_type]}-#{params[:config_name]}",
                                     { 'domain' => CurrentDomain.cname,
                                       'config_updated' => CurrentDomain.configuration(:custom_content).updatedAt })
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
    pages_time = VersionAuthority.resource('pages')
    # TODO: This should include the locale (whenever we figure out how that is specified)
    cache_params = { 'domain' => CurrentDomain.cname,
                     'pages_updated' => pages_time,
                     'domain_updated' => CurrentDomain.default_config_updated_at,
                     'params' => Digest::MD5.hexdigest(params.sort.to_json) }
    @cache_key = app_helper.cache_key("canvas2-page", cache_params)
    @cached_fragment = read_fragment(@cache_key)

    @minimal_render = params['no_render'] == 'true'

    path = "/#{params[:path]}"
    # Make sure action name is always changed for homepage, even if cached
    self.action_name = 'homepage' if path == '/'
    if @cached_fragment.nil?
      Canvas2::Util.set_params(params)
      if CurrentDomain.module_available?('canvas2')
        @page = Page[path, pages_time]
      end
      unless @page
        if path == '/'
          homepage
        else
          render_404
        end
      else
        self.action_name = 'page'
      end
    else
      # When we're rendering a cached item, force it to use the page action,
      # since we may have manipulated the action name to be homepage, and there
      # is no such view
      render :action => 'page'
    end
  end

  before_filter :only => [:template] { |c| c.require_right(:create_pages) }
  def template
    @templet = Template[params[:id]] if CurrentDomain.module_available?('canvas2')
    return(render_404) unless @templet
  end

private

  # around_filter for caching
  def cache_wrapper
    cache_params = { 'domain' => CurrentDomain.cname,
                     'domain_updated' => CurrentDomain.default_config_updated_at,
                     'locale' => I18n.locale,
                     'params' => Digest::MD5.hexdigest(params.sort.to_json) }
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

    return page_config
  end

  # generate the default homepage configuration and use it to prepare for render
  def default_homepage
    page_config = Hashie::Mash.new(@@default_homepage) # Mash will not modify original hash

    return page_config
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
    Canvas::Environment.page_config = page_config.reject{ |key| key == 'contents' }
    Canvas::Environment.request = request
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
                binding.views = View.find(properties.viewUid)
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
          bindings[key.to_s] = Hashie::Mash.new({
            properties: properties,
            views: (1..limit).map{ Canvas::Util::FakeView.new }
          })
        end

        Canvas::Environment.bindings = bindings
        page_config.contents.each{ |widget| widget.prepare_bindings! } # don't bother multithreading; ain't nothing gonna happen
      end
    end

    # Get a unique array of style packages required by the widgets to be displayed
    page_config.stylesheets = page_config.contents.collect{ |widget| widget.stylesheets }.flatten.compact.uniq

    return page_config
  end

  def build_stylesheet(widget)
    if widget.is_a? Array
      return widget.map{ |child| build_stylesheet(child) }.join
    else
      return widget.stylesheet
    end
  end

  def app_helper
    AppHelper.instance
  end

  @@default_homepage = {
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
          base_url: '/browse',
          suppress_dataset_creation: true
        }
      }
    }]
  }
end

class AppHelper
  include Singleton
  include ApplicationHelper
end
