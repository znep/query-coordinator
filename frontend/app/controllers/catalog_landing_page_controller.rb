class CatalogLandingPageController < ApplicationController

  include CatalogLandingPageHelper
  include ApplicationHelper
  include BrowseActions
  include Socrata::RequestIdHelper
  include Socrata::CookieHelper

  before_action :require_administrator, :except => [:show]
  skip_before_action :require_user, :only => [:show]

  before_filter :fetch_catalog_landing_page, :only => [:show, :manage]

  layout 'styleguide'

  def show
    @processed_browse = process_browse(request, browse_options)
    @processed_browse[:sidebar_config] = OpenStruct.new(:search => false)
  end

  def manage
  end

  def manage_write
    catalog_landing_page = CatalogLandingPage.new(current_domain, params[:catalog_query].to_unsafe_h)
    metadata = params[:metadata]
    begin
      catalog_landing_page.update_metadata(
        'headline' => metadata[:headline],
        'description' => metadata[:description],
        'show_stats' => !!metadata[:showStats]
      )
    rescue => e
      if e.error_code == 'permission_denied' # lol Core errors
        raise CoreServer::Unauthorized.new
      end
      return render_500
    end

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)
    params[:featured_content].to_unsafe_h.with_indifferent_access.each_value do |featured_content_item|
      begin
        catalog_landing_page.update_featured_content(featured_content_item)
      rescue => e
        if %w(permission_denied authentication_required).include?(e.error_code)
          raise CoreServer::Unauthorized.new
        end
        return render_500
      end
    end

    render json: params.merge(href: catalog_landing_page.to_uri.to_s).to_json
  end

  private

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

  def require_administrator
    return require_user(true) unless current_user.present?

    unless can_manage_catalog_landing_page?
      flash.now[:error] = 'You do not have permission to view this page'
      render 'shared/error', :status => :forbidden
end
  end

  def fetch_catalog_landing_page
    catalog_landing_page = CatalogLandingPage.new(current_domain, params)

    @category = params[:category]
    @featured_content = catalog_landing_page.try(:featured_content)
    @metadata = catalog_landing_page.try(:metadata).to_h
    @category_stats = catalog_landing_page.try(:category_stats, @category, current_request_id, current_cookies).to_h
  end

end
