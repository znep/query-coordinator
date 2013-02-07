require 'digest/md5'

class CustomContentController < ApplicationController
  include GovstatHelper

  before_filter :check_lockdown
  around_filter :cache_wrapper, :except => [ :stylesheet, :page ]
  skip_before_filter :require_user, :except => [ :template ]
  skip_before_filter :hook_auth_controller, :set_user, :sync_logged_in_cookie, :only => [:stylesheet]

  # For testing
  def page_override=(val)
    @page_override = val
  end

  def homepage
    Canvas::Environment.context = :homepage

    @page_config = get_config('homepage', 'homepage')
    @page_config = default_homepage if @page_config.nil? || @page_config.default_homepage
    prepare_config(@page_config)

    @page_title = @page_config.title
    @stylesheet = 'homepage/homepage'

    render :action => 'show'
  end

  def govstat_homepage
    @use_govstat_theme = true
    govstat_config = CurrentDomain.properties.gov_stat || Hashie::Mash.new

    path = '/'
    Canvas2::DataContext.reset
    Canvas2::Util.set_params(params)
    Canvas2::Util.set_debug(false)
    Canvas2::Util.is_private(false)
    Canvas2::Util.set_env({
      domain: CurrentDomain.cname,
      renderTime: Time.now.to_i,
      path: path,
      siteTheme: CurrentDomain.theme
    })
    Canvas2::Util.set_path(path)
    config = govstat_homepage_config((govstat_config.dashboard_layout || '').to_sym)
    @page = Page.new(config.merge({path: path, name: CurrentDomain.strings.site_title}).
                     with_indifferent_access)

    render :action => 'govstat_homepage'
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

  # Check for a conditional request and return a 304 if the client should
  # have no issues using their cached copy
  def handle_conditional_request(request, response, manifest)
    ConditionalRequestHandler.set_conditional_request_headers(response, manifest)
    if ConditionalRequestHandler.check_conditional_request?(request, manifest)
      Rails.logger.info("Conditional Request Matches; returning a 304")
      render :nothing => true, :status => 304
      return true
    end
    Rails.logger.info("Conditional Request Does Not Match")
    return false
  end

  def page
    # FIXME: should probably make sure you're a Socrata admin before allowing debugging
    @debug = params['debug'] == 'true'
    @edit_mode = params['_edit_mode'] == 'true' && CurrentDomain.user_can?(current_user, :edit_pages)
    @start_time = Time.now

    pages_time = VersionAuthority.resource('pages')

    page_ext = (params[:ext] || '').downcase
    path = full_path = '/' + (params[:path] || '')
    if !page_ext.blank?
      full_path += '.' + page_ext
      if page_ext != 'csv' && page_ext != 'xlsx'
        path += '.' + page_ext
        page_ext = ''
      end
      request.format = page_ext.to_sym if !page_ext.blank? && !@debug && !@edit_mode
    end

    #TODO: This should include the locale (whenever we figure out how that is specified)
    cache_params = { 'domain' => CurrentDomain.cname,
                     'pages_updated' => pages_time,
                     'domain_updated' => CurrentDomain.default_config_updated_at,
                     'params' => Digest::MD5.hexdigest(params.sort.to_json) }


    # We do not yet know whether the page can be cached globally, so we need to check both
    # the global cache and the per-user cache.

    cache_user_id = @current_user ? @current_user.id : ANONYMOUS_USER
    cache_key_no_user = app_helper.cache_key("canvas2-page", cache_params)
    cache_key_user = app_helper.cache_key("canvas2-page", cache_params.merge({
                   'current_user' => cache_user_id}))

    #
    # Tri-State Slate Page Caching
    # Anonymous/Logged Out:
    #   read manifest for ANONYMOUS_USER; read global fragment cache; 304s valid
    #   write to global fragment cache
    #   write manifest for ANONYMOUS_USER
    # Logged In w/ Private Data:
    #   read manifest for user; read user-fragment cache; 304s valid
    #   write to user fragment cache
    #   write manifest for USER
    # Logged In w/ Shared Data:
    #   read manifest for SHARED_USER; read global fragment cache; no 304s
    #   write to global fragment cache
    #   write manifest for SHARED_USER
    lookup_manifest = VersionAuthority.validate_manifest?(cache_key_no_user, cache_user_id)

    if !lookup_manifest.nil? && !@debug && !@edit_mode
      Rails.logger.info("Manifest valid; reading content from fragment cache is OK")
      return true if handle_conditional_request(request, response, lookup_manifest)
      @cached_fragment = read_fragment(cache_key_no_user)
      if @cached_fragment.nil?
        Rails.logger.info("Global fragment cache not available; trying per-user fragment cache")
        @cached_fragment = read_fragment(cache_key_user)
      end
    else
      # Only bother checking the shared user manifest if we are logged in.
      if !@current_user.nil?
        Rails.logger.info("Anonymous/User manifest invalid; checking for Shared-User Manifest")
        # manifest for pages which can be shared between logged-in users. 304s should NEVER be sent if this is valid
        lookup_manifest = VersionAuthority.validate_manifest?(cache_key_no_user, SHARED_USER)
        if !lookup_manifest.nil?
          Rails.logger.info("Shared-User Manifest valid; reading from global fragment, no 304s allowed")
          @cached_fragment = read_fragment(cache_key_no_user)
        else
          Rails.logger.info("Shared-User Manifest not valid. No Cache available.")
        end
      end
    end

    # The cached fragment is an error page; just return that then
    if @cached_fragment.is_a?(String) && @cached_fragment.start_with?('error_page:')
      str = @cached_fragment.slice(11, @cached_fragment.length)
      code = str.slice(0, 3)
      @display_message = str.slice(4, str.length)
      render :template => "custom_content/error_page", :layout => 'main', :status => code.to_i
      return true
    end

    @minimal_render = params['no_render'] == 'true'

    # Move to different variable so we can control rendering in our own
    # template, instead of the main layout
    @custom_meta = @meta
    @meta = nil
    # Make sure action name is always changed for homepage, even if cached
    self.action_name = 'homepage' if full_path == '/'
    if @cached_fragment.nil?
      Rails.logger.info("Performing full render")
      Canvas2::DataContext.reset
      Canvas2::Util.set_params(params)
      Canvas2::Util.set_debug(@debug || @edit_mode)
      Canvas2::Util.set_env({
        domain: CurrentDomain.cname,
        renderTime: Time.now.to_i,
        path: full_path,
        siteTheme: CurrentDomain.theme
      })
      Canvas2::Util.set_path(full_path)
      if CurrentDomain.module_available?('canvas2')
        if @page_override.nil?
          @page, @vars = Page[path, page_ext, pages_time]
        else
          @page = @page_override
          @vars = {}
        end

      end
      unless @page
        @meta = @custom_meta
        if full_path == '/'
          if CurrentDomain.module_enabled?(:govStat)
            govstat_homepage
          else
            homepage
          end
        else
          render_404
        end
      else
        # Now we know whether the page is private or not; set the render variables for
        # cache-key
        Canvas2::Util.is_private(@page.private_data?)
        @cache_key = Canvas2::Util.is_private ? cache_key_user : cache_key_no_user
        self.action_name = 'page'
        begin
          if @page.page_type == 'export'
            context_result = @page.set_context(@vars)
            raise Canvas2::NoContentError.new(Canvas2::DataContext::errors[0]) if context_result == false
          end

          respond_to do |format|
            # Make sure HTML is first, since IE8 sends */* accept on Back
            format.html { render :action => 'page' }
            format.csv do
              file_content = @page.generate_file('csv')
              write_fragment(@cache_key, file_content,
                             :expires_in => Rails.application.config.cache_ttl_fragment)
              render :text => file_content
            end
            format.xlsx do
              file_content = @page.generate_file('xlsx')
              write_fragment(@cache_key, file_content,
                             :expires_in => Rails.application.config.cache_ttl_fragment)
              render :text => file_content
            end
            format.any { render :action => 'page' }
          end
          # generate and set the manifest for this render on success; we need to recalculate the cache key here
          # This includes all data context resources along with associated modification times
          manifest = lookup_manifest || Canvas2::DataContext.manifest
          # Only set the manifest if we were not successful in during lookup; we do not want to reset the
          # manifest just because the fragment cache has expired.
          if lookup_manifest.nil?
            manifest.max_age = @page.max_age
            manifest_user = user_tristate(Canvas2::Util.is_private, @current_user)
            manifest.set_access_level(manifest_user)
            VersionAuthority.set_manifest(cache_key_no_user, manifest_user, manifest)
          end
          ConditionalRequestHandler.set_conditional_request_headers(response, manifest)
        # It would be really nice to catch the custom Canvas2::NoContentError I'm raising;
        # but Rails ignores it and passes it all the way up without rescuing
        # unless I rescue a generic Exception
        rescue Exception => e
          Rails.logger.info("Caught exception trying to render page: #{e.inspect}\n#{e.backtrace[0]}\n")
          @error = e.original_exception
          if @debug
            render :action => 'page_debug'
          elsif @edit_mode
            render :action => 'page'
          else
            code = (@error.respond_to?(:code) ? @error.code : nil) || 404
            @display_message = (@error.respond_to?(:display_message) ? @error.display_message : nil) || ''
            write_fragment(@cache_key, 'error_page:' + code.to_s + ':' + @display_message,
                           :expires_in => 1.minutes)
            render :template => "custom_content/error_page", :layout => 'main', :status => code
          end
        end
      end
    else
      # When we're rendering a cached item, force it to use the page action,
      # since we may have manipulated the action name to be homepage, and there
      # is no such view
      Rails.logger.info("Using fragment cache")
      respond_to do |format|
        format.html { render :action => 'page' }
        format.csv { render :text => @cached_fragment }
        format.xlsx { render :text => @cached_fragment }
        format.any { render :action => 'page' }
      end
    end
  end

  before_filter :only => [:template] { |c| c.require_right(:create_pages) }
  def template
    @templet = Template[params[:id]] if CurrentDomain.module_available?('canvas2')
    return(render_404) unless @templet
  end

private

  ANONYMOUS_USER = "anon".freeze
  SHARED_USER = "shared-user".freeze

  # Knowing whether privateData is set and the user figure out
  # which user_id should be used for the manifest key
  def user_tristate(isPrivate, user)
    if user.nil?
      ANONYMOUS_USER
    else
      if isPrivate
        user.id
      else
        SHARED_USER
      end
    end
  end

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

  def govstat_homepage_config(name = '')
    configs = {
      grid_flow: {
        data: {
          goals: { type: 'goalList' }
        },
        content: {
          type: 'Container',
          id: 'govstatHomeRoot',
          htmlClass: 'gridFlowLayout',
          children: [
          {
            type: 'Repeater',
            htmlClass: 'categoryList',
            contextId: 'goals',
            groupBy: { value: '{goal.category}' },
            childProperties: { htmlClass: 'categoryItem' },
            children: [
            { type: 'Title', text: '{_groupValue}', customClass: 'categoryTitle' },
            {
              type: 'Repeater',
              htmlClass: 'goalList',
              contextId: '_groupItems',
              childProperties: { htmlClass: 'goalItem' },
              container: { type: 'GridContainer', cellWidth: 200, cellHeight: 150, cellSpacing: 0 },
              children: [
                progress_indicator('goal.metrics.0'),
                { type: 'Title', text: '{goal.name}' },
                { type: 'Text', customClass: 'goalDetails',
                  html: '<a href="/goal/{goal.id}"><span class="description">{goal.subject}</span><div class="more">More<span class="ss-icon">directright</span></div></a>' }
              ]
            }
            ]
          }
          ]
        }
      },

      list: {
        data: {
          goals: { type: 'goalList' }
        },
        content: {
          type: 'Container',
          id: 'govstatHomeRoot',
          htmlClass: 'listLayout',
          children: [
          {
            type: 'Repeater',
            htmlClass: 'categoryList',
            contextId: 'goals',
            groupBy: { value: '{goal.category}' },
            childProperties: { htmlClass: 'categoryItem' },
            children: [
            { type: 'Title', text: '{_groupValue}', htmlClass: 'categoryTitle' },
            {
              type: 'Repeater',
              htmlClass: 'goalList',
              contextId: '_groupItems',
              childProperties: { htmlClass: 'goalItem' },
              children: [
              { type: 'Container', customClass: 'progressDetails',
                ifValue: 'goal.metrics.0.compute.delta',
                children: [
                { type: 'Text', htmlClass: 'barValue',
                  html: 'Complete<span class="bar" ' +
                  'style="width:{goal.metrics.0.compute.delta}%;"></span>' },
                { type: 'Text', htmlClass: 'textValue', html: '{goal.metrics.0.compute.delta}%' },
                ]
              },
              { type: 'Text', customClass: 'goalProgress',
                htmlClass: 'progress-{goal.metrics.0.compute.progress}' },
              { type: 'Title', text: '{goal.name}' },
              { type: 'Text', html: '{goal.subject}' }
              ]
            }
            ]
          }
          ]
        }
      }
    }
    configs[name] || configs[:list]
  end
end

class AppHelper
  include Singleton
  include ApplicationHelper
end
