class CustomContentController < ApplicationController
  skip_before_filter :require_user
  include BrowseActions

  def show_page
    @page_config = get_config params[:page_name]
    return render_404 unless @page_config

    process_browse_if_necessary(@page_config.contents)

    render :action => 'show'
  end

  def show_facet
    # for now
    return render_404
  end

private

  def get_config config_name
    config = CurrentDomain.configuration('custom_content')
    return nil unless config

    page_config = config.properties.pages[config_name]
    return page_config
  end

  def process_browse_if_necessary(config)
    if config.is_a? Array
      # use any? so we only execute process_browse on the first matching elem
      # TODO: refactor browse so this isn't necessary
      return config.any?{ |config_item| process_browse_if_necessary(config_item) }
    elsif config.type == 'catalog'
      @ignore_params = ['controller', 'action', 'page_name']

      unless config.properties.nil?
        @default_params = config.properties.default_params if config.properties.default_params
        @title = config.properties.catalog_title if config.properties.catalog_title
        @suppressed_facets = config.properties.suppressed_facets if config.properties.suppressed_facets
      end
      @suppress_dataset_creation = true # just always suppress this, no reason not to.

      process_browse!
      return true
    else #TODO: deal with layout widgets
    end

    return false # didn't find anything here..
  end
end
