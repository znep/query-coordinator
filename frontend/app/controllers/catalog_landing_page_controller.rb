class CatalogLandingPageController < ApplicationController

  include CatalogLandingPageHelper
  include ApplicationHelper
  include BrowseActions
  include Socrata::RequestIdHelper
  include Socrata::CookieHelper

  before_action :require_administrator, :except => [:show]
  before_action :require_clp_feature_flag, :check_lockdown
  skip_before_action :require_user, :only => [:show]

  before_filter :fetch_catalog_landing_page, :only => [:show, :manage]

  layout 'styleguide'

  # EN-16606: only show site chrome header/footer on the anonymously visible pages ('show')
  def disable_site_chrome?
    action_name != 'show'
  end

  def show
    @processed_browse = process_browse(request, browse_options)
    compute_page_title
    @processed_browse[:sidebar_config] = OpenStruct.new(:search => false)
  end

  def manage
    compute_page_title
  end

  def manage_write
    request_params = params[:catalog_query].to_unsafe_h.with_indifferent_access
    catalog_landing_page = CatalogLandingPage.new(current_domain, request_params)
    metadata = params[:metadata]
    begin
      catalog_landing_page.update_metadata(
        'headline' => metadata[:headline],
        'description' => metadata[:description]
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
        if %w(permission_denied authentication_required).include?(e.try(:error_code))
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

  def require_clp_feature_flag
    return render_404 unless FeatureFlags.derive(nil, request).enable_catalog_landing_page
  end

  def fetch_catalog_landing_page
    @catalog_landing_page = CatalogLandingPage.new(current_domain, params)
    @featured_content = @catalog_landing_page.try(:featured_content)
    @metadata = @catalog_landing_page.try(:metadata).to_h
  end

  def compute_page_title
    # EN-15349: String used in page <title> to differentiate between different CLPs.
    # EN-17885: NASA 508 Compliance - Make page titles more different
    title_fragments = params.except('controller', 'action', 'custom_path', 'page').map do |key, value|
      key == 'limitTo' ? I18n.t("catalog_landing_page.view_types.#{value}", :default => value) : value
    end

    if @processed_browse.to_h.with_indifferent_access.values_at(:page, :view_count, :limit).all?(&:present?)
      title_fragments << t('controls.browse.browse2.results.page_title',
        :page_number => @processed_browse[:page],
        :page_count => (@processed_browse[:view_count].to_f / @processed_browse[:limit].to_f).ceil
      )
    end

    @clp_title_param_string = ' | ' + title_fragments.join(' | ')
  end

end
