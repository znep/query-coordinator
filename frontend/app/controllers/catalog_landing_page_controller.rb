class CatalogLandingPageController < ApplicationController

  include ApplicationHelper
  include BrowseActions

  skip_before_filter :require_user

  layout 'catalog_landing_page'

  def show
    clp = CatalogLandingPage.new(current_domain, request.params)
    @featured_content = clp.featured_content
    @header = clp.metadata
    @category_stats = clp.category_stats(request.params[:category])
    @processed_browse = process_browse(request, browse_options)
    @processed_browse[:sidebar_config] = OpenStruct.new(:search => false)
  end

  def browse_options
    {
      suppress_dataset_creation: true,
      rel_type: 'external',
      hide_search: true
    }.tap do |options|

      # Mimic the 'default' selection for facets
      options.merge!(params[:defaults].deep_symbolize_keys) if params[:defaults].present?

      if params[:suppressed_facets].is_a?(Hash)
        params[:suppressed_facets] = params[:suppressed_facets].map { |k, v| k if v }.flatten
      end
      params.except!(:defaults, :suppressed_facets)

      options[:facets] = [
        authority_facet,
        categories_facet(params),
        view_types_facet,
        custom_facets,
        topics_facet(params),
        federated_facet
      ].compact.flatten.reject { |f| f[:hidden] }
    end
  end

end
