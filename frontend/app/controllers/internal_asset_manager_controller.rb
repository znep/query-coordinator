class InternalAssetManagerController < ApplicationController

  include ApplicationHelper
  include CatalogResultsHelper

  before_filter :require_roled_user

  layout 'styleguide'

  def disable_site_chrome?
    true
  end

  def show
    # These populate the corresponding values in the filter dropdowns
    @users_list = fetch_users
    @domain_categories = fetch_domain_categories
    @domain_tags = fetch_domain_tags
    @domain_custom_facets = fetch_domain_custom_facets
  end

  private

  def require_roled_user
    user = current_user || User.new
    render_forbidden(I18n.t('core.auth.need_permission')) unless user.is_superadmin? || user.is_roled_user?
  end

  def fetch_users
    begin
      dataset_owners = Cetera::Utils.user_search_client.find_all_owners(
        request_id,
        forwardable_session_cookies
      )
      Cetera::Results::UserSearchResult.new(dataset_owners).results
    rescue => e
      report_error("Error fetching Cetera user results: #{e.inspect}")
      []
    end.sort_by(&:sort_key)
  end

  def fetch_domain_categories
    begin
      Cetera::Utils.facet_search_client.get_categories_of_views(
        request_id, forwardable_session_cookies, domains: CurrentDomain.cname
      ).to_h['results'].to_a.pluck('domain_category').reject(&:empty?)
    rescue => e
      report_error("Error fetching Cetera domain categories: #{e.inspect}")
      []
    end
  end

  def fetch_domain_tags
    begin
      Cetera::Utils.facet_search_client.get_tags_of_views(
        request_id, forwardable_session_cookies, domains: CurrentDomain.cname
      ).to_h['results'].to_a.pluck('domain_tag').reject(&:empty?)
    rescue => e
      report_error("Error fetching Cetera domain tags: #{e.inspect}")
      []
    end
  end

  def fetch_domain_custom_facets
    begin
      CurrentDomain.property(:custom_facets, :catalog) # Array of Hashie::Mash
    rescue => e
      report_error("Error fetching custom facets: #{e.inspect}")
      []
    end
  end

  def report_error(error_message)
    Airbrake.notify(
      :error_class => 'InternalAssetManager',
      :error_message => error_message
    )
    Rails.logger.error(error_message)
  end
end
