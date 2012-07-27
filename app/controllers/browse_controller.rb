class BrowseController < ApplicationController
  prepend_before_filter :check_chrome, :only => :show
  skip_before_filter :require_user
  skip_before_filter :disable_frame_embedding, :only => :embed

  include BrowseActions

  def show
    @processed_browse = process_browse(request, {
      suppress_dataset_creation: true,
      row_count: 3
    })
  end

  def embed
    browse_options = {
      browse_in_container: true,
      suppress_dataset_creation: true,
      rel_type: 'external'
    }

    # Mimic the 'default' selection for facets
    browse_options.merge!(params[:defaults].deep_symbolize_keys) if params[:defaults].present?
    if params[:suppressed_facets].is_a? Hash
      params[:suppressed_facets] =
        params[:suppressed_facets].map{ |k,v| k if v }.flatten
    end

    browse_options[:facets] = [
      view_types_facet,
      custom_facets,
      categories_facet,
      topics_facet,
      federated_facet 
    ]

    @processed_browse = process_browse(request, browse_options)
    render :layout => 'embedded_browse'
  end
end
