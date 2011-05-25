class BrowseController < ApplicationController
  skip_before_filter :require_user
  include BrowseActions

  def show
    @processed_browse = process_browse(request, {
      suppress_dataset_creation: true
    })
  end

  def embed
    browse_options = {
      browse_in_container: true,
      suppress_dataset_creation: true,
      rel_type: 'external'
    }

    # Passed to _browse partial to remove controls, e.g. search/sort/paginate
    browse_options[:disable] = params[:disable] unless params[:disable].blank?

    # Mimic the 'default' selection for facets
    browse_options[:default_params] = params[:defaults] unless params[:defaults].blank?

    enabled_facets = params[:facets] || {}
    browse_options[:facets] = [
      view_types_facet,
      custom_facets,
      categories_facet,
      topics_facet
    ].flatten.compact.select { |f| enabled_facets[f[:singular_description]].present? }

    @processed_browse = process_browse(request, browse_options)
    render :layout => 'embedded_browse'
  end
end
