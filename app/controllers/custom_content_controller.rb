require 'digest/md5'

class CustomContentController < ApplicationController
  before_filter :check_lockdown
  around_filter :cache_wrapper, :except => [ :stylesheet ]
  skip_before_filter :require_user
  include BrowseActions

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
    path = "/#{params[:path].join '/'}"
    @page = Page[path] if CurrentDomain.module_available?('canvas2')
    unless @page
      if path == '/'
        homepage
      else
        render_404
      end
    end
  end

private

  # around_filter for caching
  def cache_wrapper
    cache_params = { 'domain' => CurrentDomain.cname,
                     'domain_updated' => CurrentDomain.default_config_updated_at,
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

    # ready whatever we might need
    if prepare
      threads = page_config.contents.map{ |widget| Thread.new{ widget.prepare! } if widget.can_render? }
      threads.compact.each{ |thread| thread.join }
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
