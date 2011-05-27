class CustomContentController < ApplicationController
  around_filter :cache_wrapper, :except => [ :stylesheet ]
  skip_before_filter :require_user
  include BrowseActions

  def show_page
    Canvas::Environment.context = :page

    @page_config = get_config('page', params[:page_name])
    return render_404 unless @page_config

    @page_title = @page_config.title

    @stylesheet = "page/#{params[:page_name]}"
    render :action => 'show'
  end

  def show_facet_listing
    Canvas::Environment.context = :facet_listing

    @page_config = get_config('facet_listing', params[:facet_name])
    return render_404 unless @page_config

    @page_title = @page_config.title

    @stylesheet = "facet_listing/#{params[:facet_name]}"
    render :action => 'show'
  end

  def show_facet_page
    Canvas::Environment.context = :facet_page

    @page_config = get_config('facet_page', params[:facet_name])
    return render_404 unless @page_config

    @page_title = [params[:facet_value], @page_config.title].compact.join(' | ')

    @stylesheet = "facet_page/#{params[:facet_name]}"
    render :action => 'show'
  end

  # warning! only one stylesheet is cached per *type* of canvas page!
  # this is intentional to reduce dupes...
  def stylesheet
    headers['Content-Type'] = 'text/css'

    cache_key = app_helper.cache_key("canvas-stylesheet-#{params[:page_type]}-#{params[:config_name]}",
                                     { 'domain' => CurrentDomain.cname })
    sheet = Rails.cache.read(cache_key)

    if sheet.nil?
      page_config = get_config(params[:page_type], params[:config_name], false)
      return render_404 unless page_config

      sheet = build_stylesheet(page_config.contents)
      Rails.cache.write(cache_key, sheet)
    end

    render :text => sheet, :content_type => 'text/css'
  end

private

  # around_filter for caching
  def cache_wrapper
    @cache_key = app_helper.cache_key("canvas-#{params[:action]}",
                                      params.merge({ 'domain' => CurrentDomain.cname }))
    @cached_fragment = read_fragment(@cache_key)

    if @cached_fragment.nil?
      yield
    else
      render :action => 'show'
    end
  end

  def get_config(page_type, config_name, prepare = true)
    properties = CurrentDomain.property(page_type.pluralize, :custom_content)
    return nil unless properties

    page_config = properties[config_name]
    return nil unless page_config

    # turn toplevel contents into objects; rest will transform as needed
    page_config.contents = Canvas::CanvasWidget.from_config(page_config.contents, 'Canvas')

    # set up canvas rendering environment
    Canvas::Environment.facet_name = params[:facet_name]
    Canvas::Environment.facet_value = CGI.unescape(params[:facet_value]) if params[:facet_value].present?
    Canvas::Environment.params = params
    Canvas::Environment.page_config = page_config.reject{ |key| key == 'contents' }
    Canvas::Environment.request = request

    # ready whatever we might need
    if prepare
      threads = page_config.contents.map{ |widget| Thread.new{ widget.prepare! } if widget.can_render? }
      threads.compact.each{ |thread| thread.join }
    end

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
end

class AppHelper
  include Singleton
  include ApplicationHelper
end
