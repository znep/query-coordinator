class CustomContentController < ApplicationController
  skip_before_filter :require_user
  include BrowseActions

  def show_page
    @page_config = get_config('page', params[:page_name])
    return render_404 unless @page_config

    process_browse_if_necessary(@page_config.contents)

    @stylesheet = "page/#{params[:page_name]}"
    render :action => 'show'
  end

  def show_facet_listing
    # for now
    return render_404

    @stylesheet = "facet_listing/#{params[:facet_name]}"
    render :action => 'show'
  end

  def show_facet
    # for now
    return render_404

    @stylesheet = "facet_page/#{params[:facet_name]}"
    render :action => 'show'
  end

  def stylesheet
    headers['Content-Type'] = 'text/css'

    @page_config = get_config(params[:page_type], params[:config_name])
    return render_404 unless @page_config

    render :text => build_stylesheet(@page_config.contents), :content_type => 'text/css'
  end

private

  def get_config(page_type, config_name)
    config = CurrentDomain.configuration('custom_content')
    return nil unless config

    page_config = config.properties[page_type.pluralize][config_name]

    # turn toplevel contents into objects; rest will transform as needed
    page_config.contents = Canvas::CanvasWidget.from_config(page_config.contents, 'Canvas')

    return page_config
  end

  def process_browse_if_necessary(widget)
    if widget.is_a? Array
      # use any? so we only execute process_browse on the first matching elem
      # TODO: refactor browse so this isn't necessary
      return widget.any?{ |config_item| process_browse_if_necessary(config_item) }
    elsif widget.is_a? Canvas::Catalog
      @ignore_params = ['controller', 'action', 'page_name']

      unless widget.properties.nil?
        # TODO: refactor browse so that this doesn't suck
        @default_params = widget.properties.default_params if widget.properties.default_params
        @title = widget.properties.catalog_title if widget.properties.catalog_title
        @suppressed_facets = widget.properties.suppressed_facets if widget.properties.suppressed_facets
      end
      @suppress_dataset_creation = true # just always suppress this, no reason not to.

      process_browse!
      return true
    elsif widget.has_children?
      return process_browse_if_necessary(widget.children)
    end

    return false # didn't find anything here..
  end

  def build_stylesheet(widget)
    if widget.is_a? Array
      return widget.map{ |child| build_stylesheet(child) }.join
    else
      return widget.stylesheet
    end
  end
end
