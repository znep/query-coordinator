class Administration::ConnectorController < AdministrationController
  include DataConnectorHelper
  include ActionView::Helpers::SanitizeHelper

  #
  # Connector / EsriServerConnector / CatalogFederatorConnector
  #

  before_filter :only => [
    :connectors, :new_connector, :delete_connector, :create_connector, :edit_connector, :update_connector
  ] { |c| c.check_auth_level(UserRights::USE_DATA_CONNECTORS) }

  before_filter :only => [
    :connectors, :new_connector, :delete_connector, :create_connector, :edit_connector, :update_connector,
    :show_connector
  ] { |c| c.check_feature_flag('enable_catalog_connector') }

  before_filter :fetch_connectors, :only => :connectors
  before_filter :fetch_servers, :only => :edit_connector

  def enable_catalog_federator_connector?
    FeatureFlags.derive(nil, request, nil)[:enable_catalog_federator_connector]
  end

  # +before_filter+
  def fetch_connectors
    @esri_connectors = []
    begin
      @esri_connectors = EsriServerConnector.servers
    rescue EsriCrawler::ServerError => error
      @failed_esri_connection = true
      display_external_error(error)
    rescue => ex
      @failed_esri_connection = true
      Rails.logger.error("Encountered error while trying to access Esri Crawler service: #{ex}")
    end

    if enable_catalog_federator_connector?
      begin
        @catalog_federator_connectors = CatalogFederatorConnector.servers
      rescue => ex
        @failed_catalog_federator_connection = true
        Rails.logger.error("Encountered error while trying to access Catalog Federator service: #{ex}")
      end
    end

    flash[:notice] = t('screens.admin.connector.esri_service_unavailable') if @esri_connectors.empty?
    if @catalog_federator_connectors.empty?
      flash[:notice] += t('screens.admin.connector.catalog_federator_service_unavailable')
    end
  end

  # +before_filter+
  def fetch_servers
    @data_connection_on = feature_flag?('enable_data_connector', request)
    begin
      @tree = EsriServerConnector.tree(params[:server_id])
      @server = EsriServerConnector.server(params[:server_id])
    rescue EsriCrawler::ResourceNotFound => error
      # flash[:error] = t('screens.admin.connector.flashes.server_not_found')
    rescue EsriCrawler::ServerError => error
      # display_external_error(error)
    rescue => error
      # flash[:notice] = t('screens.admin.connector.service_unavailable')
    end

    if enable_catalog_federator_connector?
      @server = CatalogFederatorConnector.servers.detect { |server| server.id == params[:server_id].to_i }
      @list = CatalogFederator::Client.new.list(@server.id)
    end
  end

  def connectors
  end

  def new_connector
    @server = {}
    @include_data_json = enable_catalog_federator_connector?
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
      handle_failed_connection(error)
    end

    respond_to do |format|
      format.html do
        flash[:notice] = success_notice
        redirect_to :action => :connectors
      end
      format.data { render :json => { :success => true } }
    end
  end

  def edit_connector
    params[:type] ||= 'esri' # Default to Esri if not specified on the URL for backward compatibility.
  end

  def update_connector
    # begin
    #   @response = EsriServerConnector.update_server(params[:server_id], params['server'])
    #   @server = EsriServerConnector.server(params[:server_id])
    #   @tree = EsriServerConnector.tree(params[:server_id])
    # rescue EsriCrawler::ServerError => error
    #   return display_external_error(error, :edit_connector)
    # rescue EsriCrawler::ResourceNotFound => error
    #   flash[:error] = t('screens.admin.connector.flashes.server_not_found')
    #   redirect_to :action => :connectors
    # rescue StandardError => error
    #   handle_failed_connection(error)
    # end
    respond_to do |format|
      format.html do
        flash[:notice] = t('screens.admin.connector.flashes.updated')
        redirect_to :action => :edit_connector
      end
      format.data { render :json => { :success => true } }
    end
  end

  def delete_connector
    begin
      if params['server_backend'] == 'catalog_federator'
        response = CatalogFederatorConnector.delete(params[:server_id])
      else
        response = EsriServerConnector.delete_server(params[:server_id])
      end
      respond_to do |format|
        format.html do
          flash[:notice] = t('screens.admin.connector.flashes.deleted')
          redirect_to :action => :connectors
        end
        format.data { render :json => { :success => true } }
      end
    rescue EsriCrawler::ResourceNotFound => error
      flash[:error] = t('screens.admin.connector.flashes.server_not_found')
      redirect_to :action => :connectors
    rescue EsriCrawler::ServerError => error
      return display_external_error(error, :connectors)
    rescue StandardError => error
      handle_failed_connection(error)
    end
  end

  # If esri_crawler_http is unreachable.
  # Redirecting to /connectors will log an error if the service is still down.
  def handle_failed_connection(error)
    flash[:notice] = t('screens.admin.connector.service_unavailable')
    redirect_to :action => :connectors
  end

  def display_external_error(error, redirection = nil)
    begin
      reason = error.body['error']['reason']
      params = error.body['error']['params'].symbolize_keys
      flash[:error] = t("screens.admin.connector.errors.#{reason}") % params
    rescue
      flash[:error] = t("screens.admin.connector.errors.problem_with_errors")
    end
    redirect_to :action => redirection if redirection
  end

  def show_connector
    @data_connection_on = feature_flag?('enable_data_connector', request)
    page_size = 50
    all_threshold = 8
    page_idx = params.fetch(:page, '1').to_i
    offset = (page_idx - 1) * page_size

    begin
      @server = EsriServerConnector.server(params[:server_id])
      layer_resp = EsriServerConnector.all_layers(params[:server_id], offset, page_size)
      @layers = layer_resp['items']
      count = layer_resp['count']
    rescue EsriCrawler::ResourceNotFound => error
      flash[:error] = t('screens.admin.connector.flashes.server_not_found')
      redirect_to :action => :connectors
    rescue EsriCrawler::ServerError => error
      return display_external_error(error, :connectors)
    rescue StandardError => error
      handle_failed_connection(error)
    end

    @pager_elements = Pager::paginate(count, page_size, page_idx, { :all_threshold => all_threshold, :params => {} })
  end

end
