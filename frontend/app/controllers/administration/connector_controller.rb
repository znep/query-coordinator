class Administration::ConnectorController < AdministrationController

  include DataConnectorHelper
  include ActionView::Helpers::SanitizeHelper
  include Administration::ConnectorHelper

  #
  # Connector / EsriServerConnector / CatalogFederatorConnector
  #

  before_filter :only =>
    %i(connectors new_connector delete_connector create_connector edit_connector update_connector) do |c|
      c.check_auth_level(UserRights::USE_DATA_CONNECTORS)
    end

  before_filter :fetch_server, :only => [:edit_connector, :update_connector, :show_connector]
  before_filter :fetch_connectors, :only => :connectors

  def connectors # index
  end

  def new_connector
    @server = {}
  end

  def create_connector
    @server = params[:server] || {}
    begin
      if @server['federation_source'] == 'data_json'
        response = CatalogFederatorConnector.create(params[:server])
        success_notice = t('screens.admin.connector.flashes.created_data_json')
      else
        response = EsriServerConnector.create(params[:server][:source_url])
        success_notice = t('screens.admin.connector.flashes.created')
      end
    rescue EsriCrawler::ServerError => error
      return display_external_error(error, :new_connector)
    rescue StandardError => error
      return handle_failed_connection_and_redirect(error)
    end

    respond_to do |format|
      format.html do
        flash[:notice] = success_notice
        redirect_to :connectors
      end
      format.data { render :json => { :success => true } }
    end
  end

  def edit_connector
  end

  def update_connector
    if esri_arcgis?
      begin
        @response = EsriServerConnector.update_server(params[:server_id], params[:server])
      rescue EsriCrawler::ServerError => error
        return display_external_error(error, :edit_connector)
      rescue EsriCrawler::ResourceNotFound => error
        flash[:error] = t('screens.admin.connector.flashes.server_not_found')
        return redirect_to :connectors
      rescue StandardError => error
        return handle_failed_connection_and_redirect(error)
      end

      flash[:notice] = t('screens.admin.connector.flashes.updated')
      return redirect_to :connectors
    end

    if catalog_federator?
      begin
        if params[:server][:sync_type] == 'catalog'
          CatalogFederator::Client.new.sync_source(params[:server_id])
        else
          CatalogFederator::Client.new.update_source(params[:server_id], decorated_catalog)
        end
        flash[:notice] = t('screens.admin.connector.flashes.updated')
        return redirect_to :connectors
      rescue => error
        flash[:warning] = t('screens.admin.connector.flashes.update_failed')
        return redirect_to :connectors
      end

      flash[:notice] = t('screens.admin.connector.flashes.updated')
      return redirect_to :connectors
    end
  end

  def delete_connector
    begin
      if catalog_federator?
        response = CatalogFederatorConnector.delete(params[:server_id])
      else
        response = EsriServerConnector.delete_server(params[:server_id])
      end
      respond_to do |format|
        format.html do
          flash[:notice] = t('screens.admin.connector.flashes.deleted')
          return redirect_to :connectors
        end
        format.data { render :json => { :success => true } }
      end
    rescue EsriCrawler::ResourceNotFound => error
      flash[:error] = t('screens.admin.connector.flashes.server_not_found')
      return redirect_to :connectors
    rescue EsriCrawler::ServerError => error
      return display_external_error(error, :connectors)
    rescue StandardError => error
      return handle_failed_connection_and_redirect(error)
    end
  end

  # If esri_crawler_http is unreachable.
  # Redirecting to /connectors will log an error if the service is still down.
  def handle_failed_connection_and_redirect(error)
    flash[:warning] = t('screens.admin.connector.service_unavailable')
    redirect_to :connectors
  end

  def display_external_error(error, redirection = nil)
    begin
      reason = error.body['error']['reason']
      params = error.body['error']['params'].symbolize_keys
      flash[:error] = t("screens.admin.connector.errors.#{reason}") % params
    rescue
      flash[:error] = t('screens.admin.connector.errors.problem_with_errors')
    end
    redirect_to redirection if redirection.present?
  end

  def show_connector
    # Show page currently only supported for Esri connectors
    if esri_arcgis?
      page_size = 50
      all_threshold = 8
      page_idx = params.fetch(:page, '1').to_i
      offset = (page_idx - 1) * page_size

      begin
        layer_resp = EsriServerConnector.all_layers(params[:server_id], offset, page_size)
        @layers = layer_resp['items']
        count = layer_resp['count']
      rescue EsriCrawler::ResourceNotFound => error
        flash[:error] = t('screens.admin.connector.flashes.server_not_found')
        return redirect_to :connectors
      rescue EsriCrawler::ServerError => error
        return display_external_error(error, :connectors)
      rescue StandardError => error
        return handle_failed_connection_and_redirect(error)
      end

      @pager_elements = Pager::paginate(count, page_size, page_idx, :all_threshold => all_threshold, :params => {})
    else
      redirect_to :edit_connectors
    end
  end

  private

  def fetch_connectors
    @esri_connectors = []
    begin
      @esri_connectors = EsriServerConnector.servers
    rescue EsriCrawler::ServerError => error
      @failed_esri_connection = true
      add_flash(:error, t('screens.admin.connector.esri_service_unavailable'))
      display_external_error(error)
    rescue => ex
      @failed_esri_connection = true
      add_flash(:error, t('screens.admin.connector.esri_service_unavailable'))
      Rails.logger.error("Encountered error while trying to access Esri Crawler service: #{ex}")
    end

    if enable_catalog_federator_connector?
      begin
        @catalog_federator_connectors = CatalogFederatorConnector.servers
      rescue => ex
        @failed_catalog_federator_connection = true
        add_flash(:error, t('screens.admin.connector.catalog_federator_service_unavailable'))
        Rails.logger.error("Encountered error while trying to access Catalog Federator service: #{ex}")
      end
      if @catalog_federator_connectors.blank?
        add_flash(:warning, t('screens.admin.connector.no_catalog_federator_connectors'))
      end
    end
  end

  def fetch_server
    if esri_arcgis?
      begin
        @tree = EsriServerConnector.tree(params[:server_id])
        @server = EsriServerConnector.server(params[:server_id])
      rescue EsriCrawler::ResourceNotFound => error
        flash[:error] = t('screens.admin.connector.flashes.server_not_found')
      rescue EsriCrawler::ServerError => error
        display_external_error(error)
      rescue => error
        flash[:warning] = t('screens.admin.connector.esri_service_unavailable')
      end
    end

    if catalog_federator?
      if enable_catalog_federator_connector?
        begin
          @server = CatalogFederatorConnector.servers.detect { |server| server.id == params[:server_id].to_i }
          @datasets = CatalogFederator::Client.new.get_datasets(@server.id)
        rescue => e
          add_flash(:error, t('screens.admin.connector.errors.json_format_error'))
          return redirect_to :connectors
        end
      end
    end

    unless @server.present?
      add_flash(:warning, t('screens.admin.connector.errors.unknown_server'))
      redirect_to :connectors
    end
  end

  def enable_catalog_connector?
    @enable_catalog_connector = @enable_catalog_connector.nil? ?
      FeatureFlags.derive(nil, request).enable_catalog_connector : @enable_catalog_connector
  end
  helper_method :enable_catalog_connector?

  def enable_catalog_federator_connector?
    @enable_catalog_federator_connector = @enable_catalog_federator_connector.nil? ?
      FeatureFlags.derive(nil, request).enable_catalog_federator_connector : @enable_catalog_federator_connector
  end
  helper_method :enable_catalog_federator_connector?

  def decorated_catalog
    user_selections = params[:server][:assets].map(&:to_i)
    selected_assets = @datasets.values_at(*user_selections)
    added_selections = selected_assets.pluck('externalId')
    removed_selections = (@datasets - selected_assets).pluck('externalId')
    {
      'addedSelections': added_selections,
      'removedSelections': removed_selections
    }
  end

end
