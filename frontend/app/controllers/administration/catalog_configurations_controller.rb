class Administration::CatalogConfigurationsController < AdministrationController

  include ApplicationHelper
  include AdministrationHelper

  before_filter :fetch_catalog_configuration
  before_filter :require_superadmin

  layout 'administration'

  def disable_site_chrome?
    true
  end

  def edit
  end

  def update
    hidden = params[:community_assets_hidden_from_catalog] == 'true'
    begin
      @catalog_configuration.create_or_update_property('community_assets_hidden_from_catalog', hidden)
    rescue CoreServer::CoreServerError => e
      flash[:error] = I18n.t(:update_error, :scope => 'catalog_configuration').html_safe
      return redirect_to :action => :edit
    end

    # TODO Figure out wtf is caching the fscking stale config for ~5 seconds
    # Redirecting to /admin in the mean time to avoid confusing the user
    flash[:notice] = I18n.t(:update_notice, :scope => 'catalog_configuration', :state => hidden ? 'Hide' : 'Show')
    redirect_to '/admin'
  end

  private

  def fetch_catalog_configuration
    @catalog_configuration = ::Configuration.find_or_create_by_type(
      'catalog',
      'name' => 'Catalog Configuration'
    )
  end

end
