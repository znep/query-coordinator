require 'csv'

class AppHelper

  include Singleton
  include ApplicationHelper
  include ActionView::Helpers::TextHelper

end

class AdministrationController < ApplicationController

  include BrowseActions
  include CommonSocrataMethods
  include GeoregionsHelper
  include AdministrationHelper

  # To learn why we include AdministrationHelper manually, see
  # the comment at the top of AdministrationHelper's implementation.
  # tl;dr "helper :all" in ApplicationController.
  include AdminDatasetsHelper # Override the view_url method from Socrata::UrlHelpers

  skip_before_filter :require_user, :only => [:configuration, :flag_out_of_date]

  before_filter :check_can_see_goals, :only => [:goals]
  before_filter :check_member, :only => [:index, :analytics]
  before_filter :allow_georegions_access?, :only => [:georegions, :add_georegion, :enable_georegion, :disable_georegion, :set_georegion_default_status, :edit_georegion, :remove_georegion]
  before_filter :is_superadmin?, :only => [:initialize_asset_inventory]

  before_filter :only => [:datasets] { |request| request.check_auth_levels_any([UserRights::EDIT_OTHERS_DATASETS, UserRights::EDIT_SITE_THEME]) }
  before_filter :only => [:canvas_pages] { |request| request.check_auth_level(UserRights::EDIT_PAGES) }
  before_filter :only => [:create_canvas_page, :post_canvas_page] { |request| request.check_auth_level(UserRights::CREATE_PAGES) }
  before_filter :only => [:users, :set_user_role, :reset_user_password, :bulk_create_users, :delete_future_user, :re_enable_user ] { |request| request.check_auth_level(UserRights::MANAGE_USERS) }
  before_filter :only => [:comment_moderation] { |request| request.check_auth_level(UserRights::MODERATE_COMMENTS) && request.check_module('publisher_comment_moderation') }
  before_filter :only => [:views] { |request| request.check_auth_level(UserRights::APPROVE_NOMINATIONS) && request.check_feature(:view_moderation) }
  before_filter :only => [:set_view_moderation_status] { |request| request.check_auth_level(UserRights::APPROVE_NOMINATIONS) }
  before_filter :only => [:sdp_templates, :sdp_template_create, :sdp_template, :sdp_set_default_template, :sdp_delete_template] { |request| request.check_auth_level(UserRights::EDIT_SDP) }
  before_filter :only => [:federations, :delete_federation, :accept_federation, :reject_federation, :create_federation] { |request| request.check_auth_level(UserRights::FEDERATIONS) && request.check_module_available('federations') }
  before_filter :only => [:metadata, :create_metadata_fieldset, :delete_metadata_fieldset, :create_metadata_field, :save_metadata_field, :delete_metadata_field, :toggle_metadata_option, :move_metadata_field, :create_category, :delete_category, :modify_catalog_config, :modify_sidebar_config] { |request| request.check_auth_level(UserRights::EDIT_SITE_THEME) }
  before_filter :only => [:home, :save_featured_views] { |request| request.check_auth_levels_any([UserRights::MANAGE_STORIES, UserRights::FEATURE_ITEMS, UserRights::EDIT_SITE_THEME]) }
  before_filter :only => [:delete_story, :new_story, :create_story, :move_story, :edit_story, :stories_appearance, :update_stories_appearance] { |request| request.check_auth_level(UserRights::MANAGE_STORIES) }

  def disable_site_chrome?
    true
  end

  def index
    render enable_new_admin_ui? ? 'sectioned_index' : 'index'
  end

  def datasets
    @meta[:page_name] = 'Admin Catalog'

    vtf = view_types_facet
    datasets_index = vtf[:options].index { |option| option[:value] == 'datasets' }
    datasets_index = 0 unless datasets_index.present?

    # always show "unpublished datasets" after "datasets", or at least after "data lens"
    vtf[:options].insert(
      datasets_index + 1,
      :text => t('screens.admin.datasets.unpublished_datasets'),
      :value => 'unpublished',
      :class => 'typeUnpublished'
    )

    facets = [vtf, categories_facet(params), topics_facet(params)]
    @processed_browse = process_browse(request, moderation_flag_if_needed.merge(
      admin: true,
      browse_in_container: true,
      facets: facets,
      limit: 30,
      nofederate: true,
      view_type: 'table',
      a11y_table_description: t('screens.admin.datasets.table_description')
    ))
  end

  def initialize_asset_inventory
    if AssetInventoryService.create_asset_inventory
      flash[:notice] = t('screens.admin.datasets.asset_inventory.initialize_success')
    else
      flash[:error] = t('screens.admin.datasets.asset_inventory.initialize_failure')
    end
    redirect_to :action => :datasets
  end

  #In the /admin/datasets endpoint ...
  # If View Moderation is ON, do exactly what's done today. Data Lenses will only be shown in /admin/datasets
  #   if they have been approved. Otherwise, they're shown in the view moderation queue (/admin/views)
  # If View Moderation is OFF, pass moderation: 'any' to the ViewSearch service so that we explicitly include
  #   all views regardless of their view moderation status.
  def moderation_flag_if_needed
    CurrentDomain.feature?(:view_moderation) ? {} : { moderation: 'any' }
  end

  def modify_sidebar_config
    config = ::Configuration.find_or_create_by_type('sidebar', 'name' => 'Sidebar configuration')

    params[:sidebar].each do |k, v|
      create_or_update_property(config, k, v)
    end

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)
    respond_to do |format|
      format.html { redirect_to datasets_administration_path }
      format.data { render :json => config.to_json }
    end
  end

  def analytics
  end

  def canvas_pages
    @pages = Page.find('$order' => 'name', 'status' => 'all')
  end

  def create_canvas_page
    @cur_path = params[:path]
    @cur_title = params[:title]
  end

  def post_canvas_page
    title = params[:pageTitle]
    url = params[:pageUrl]
    if title.blank?
      flash[:error] = t('screens.admin.canvas.title_cannot_be_blank')
      return redirect_to :action => 'create_canvas_page', :path => url, :title => title
    end
    if url.blank?
      prefix = CurrentDomain.module_enabled?(:govStat) ? '/reports/' : '/'
      # Let's generate one from the title
      url = DataslateRouting.collision_free_path_for(prefix + title.convert_to_url)
    end
    url = "/#{url}" unless url.starts_with?('/')
    if DataslateRouting.for(url).present?
      flash[:error] = t('screens.admin.canvas.path_must_be_unique')
      return redirect_to :action => 'create_canvas_page', :path => url, :title => title
    end
    args = { :path => url, :name => title }
    args[:grouping] = 'report' if CurrentDomain.module_enabled?(:govStat)
    res = Page.create(args)
    DataslateRouting.clear_cache_for_current_domain!
    redirect_to "#{res.path}?_edit_mode=true"
  end

  #
  # Manage Georegions
  #
  def allow_georegions_access?
    run_access_check do
      can_view_georegions_admin?
    end
  end

  def georegions
    jobs = incomplete_curated_region_jobs
    failed_jobs = failed_curated_region_jobs
    if jobs.nil? || failed_jobs.nil?
      flash[:notice] = t('screens.admin.georegions.flashes.service_unavailable_html')
    end

    @view_model = ::ViewModels::Administration::Georegions.new(
      CuratedRegion.all,
      incomplete_curated_region_jobs || [],
      failed_curated_region_jobs || [],
      get_site_title
    )
  end

  def georegion
    curated_region = CuratedRegion.find(params[:id])
    respond_to do |format|
      format.data { render :json => { :success => true, :message => curated_region  } }
    end
  end

  def add_georegion
    georegion_adder = ::Services::Administration::GeoregionAdder.new
    is_success = false
    error_message = t('error.error_500.were_sorry')
    success_message = nil

    begin
      success_message = georegion_adder.add(
        params[:id],
        params[:primaryKey],
        params[:geometryLabel],
        params[:name],
        { :enabledFlag => true },
        forwardable_session_cookies
      )
      is_success = success_message.present?
    rescue CoreServer::CoreServerError => ex
      error_message = t(
        'screens.admin.georegions.flashes.add_georegion_error',
        :error_message => ex.error_message
      )
    rescue StandardError => ex
      error_message = "Error while adding georegion to domain: #{ex}"
    end
    handle_button_response(
      is_success,
      error_message,
      success_message,
      :georegions
    )
  end

  def enable_georegion
    curated_region = CuratedRegion.find(params[:id])
    is_success = false
    error_message = nil
    success_message = nil
    begin
      georegion_enabler.enable(curated_region)
      is_success = true
      success_message = t('screens.admin.georegions.enable_success', :name => curated_region.name)
    rescue CoreServer::CoreServerError
      error_message = t('error.error_500.were_sorry')
    end

    handle_button_response(is_success, error_message, success_message, :georegions)
  end

  def disable_georegion
    curated_region = CuratedRegion.find(params[:id])
    is_success = false
    error_message = nil
    success_message = nil
    begin
      georegion_enabler.disable(curated_region)
      is_success = true
      success_message = t('screens.admin.georegions.disable_success', :name => curated_region.name)
    rescue CoreServer::CoreServerError
      error_message = t('error.error_500.were_sorry')
    end

    handle_button_response(is_success, error_message, success_message, :georegions)
  end

  def set_georegion_default_status
    curated_region = CuratedRegion.find(params[:id])
    default_flag = params[:default_flag]
    is_success = false
    error_message = nil
    success_message = nil
    begin
      if default_flag == 'default'
        georegion_defaulter.default(curated_region)
        is_success = true
        success_message = t('screens.admin.georegions.default_success', :name => curated_region.name)
      elsif default_flag == 'undefault'
        georegion_defaulter.undefault(curated_region)
        is_success = true
        success_message = t('screens.admin.georegions.undefault_success', :name => curated_region.name)
      else
        error_message = t('error.error_500.were_sorry')
      end
    rescue CoreServer::CoreServerError
      error_message = t('error.error_500.were_sorry')
    rescue ::Services::Administration::DefaultGeoregionsLimitMetError
      error_message = t(
        'screens.admin.georegions.default_georegions_limit',
        :limit => georegion_defaulter.maximum_default_count
      )
    end

    handle_button_response(is_success, error_message, success_message, :georegions)
  end

  def edit_georegion
    georegion_editor = ::Services::Administration::GeoregionEditor.new
    curated_region = CuratedRegion.find(params[:id])
    is_success = false
    error_message = nil
    success_message = nil
    redirect_action = :georegions

    begin
      updated_region = georegion_editor.edit(curated_region, params[:boundary])
      is_success = true
      if request.xhr?
        success_message = updated_region
      else
        success_message = t('screens.admin.georegions.configure_boundary.save_success')
      end
    rescue ::Services::Administration::MissingBoundaryNameError
      flash[:is_name_missing] = true # TODO Refactor to remove abuse of flash hash.
      error_message = t('screens.admin.georegions.configure_boundary.boundary_name_required_page_error')
      redirect_action = :configure_boundary
    rescue ::Services::Administration::MissingGeometryLabelError
      flash[:is_label_missing] = true
      error_message = t('screens.admin.georegions.configure_boundary.boundary_name_required_page_error')
      redirect_action = :configure_boundary
    rescue
      error_message = t('screens.admin.georegions.configure_boundary.save_error')
    end

    handle_button_response(is_success, error_message, success_message, redirect_action)
  end

  def georegion_candidate
    is_success = false
    error_message = nil
    success_message = nil

    begin
      success_message = ::ViewModels::Administration::GeoregionCandidate.new(params[:id])
      is_success = true
    rescue
      error_message = t('screens.admin.georegions.configure_boundary.save_error')
    end

    handle_button_response(is_success, error_message, success_message, :georegions)
  end

  def remove_georegion
    handle_button_response(true, 'error', 'success', :georegions)
  end

  def configure_boundary
    curated_region = CuratedRegion.find(params[:id])
    @view_model = ::ViewModels::Administration::ConfigureBoundary.new(
      curated_region,
      get_site_title,
      !!flash[:is_name_missing]
    )
  end

  def poll_georegion_jobs
    begin
      message = {
        :georegions => CuratedRegion.all,
        :jobs => incomplete_curated_region_jobs,
        :failedJobs => failed_curated_region_jobs
      }
      success = true
    rescue StandardError => ex
      message = {
        :errorMessage => "Polling error: #{ex}"
      }
      success = false
    end
    render :json => { :message => message, :success => success  }, :status => success ? 200 : 500
  end

  #
  # Manage Users and User Roles
  #

  # TODO: page user results (EN-10520)
  def users
    users_v2 = FeatureFlags.derive(nil, request).enable_new_user_management_page
    return render '/administration/users_v2' if users_v2 && params[:format].to_s != 'csv'
    # else, revert to previous behavior...

    begin
      user_search_client = Cetera::Utils.user_search_client
      if params[:username].present?
        @search = params[:username]
        users = user_search_client.find_all_by_query(@search, request_id, forwardable_session_cookies, :limit => 100)
        @users_list = Cetera::Results::UserSearchResult.new(users).results
        @futures = FutureAccount.find.select { |f| f.email.downcase.include? params[:username].downcase }
        if @users_list.empty?
          @table_title = t('screens.admin.users.no_users_found')
        else
          @table_title = t('screens.admin.users.search_results', :term => @search)
        end
        @existing_user_actions = false
      else
        roled_users = user_search_client.find_all_with_roles(request_id, forwardable_session_cookies)
        user_results = Cetera::Results::UserSearchResult.new(roled_users).results
        @users_list = user_results.sort_by(&:sort_key)
        @futures = FutureAccount.find
        @existing_user_actions = true
      end
    rescue => e
      Rails.logger.warn("Error reaching Cetera: #{e.inspect}")
      @users_list = nil
      flash.now[:notice] = t('controls.browse.listing.error')
    end

    respond_to do |format|
      format.html { render :template => '/administration/users' }
      format.csv do
        render :text =>
          # braces used here rather than do-end to avoid localJumpError
          CSV.generate { |csv|
            csv << User.csv_columns.values
            @users_list.each { |user| csv << user.to_csv_row }
          }
      end
    end
  end

  def set_user_role
    error_message = nil
    begin
      updated_user = User.set_role(params[:user_id], params[:role])
    rescue CoreServer::CoreServerError => ex
      error_message = ex.error_message
    end

    handle_button_response(updated_user, error_message, t('screens.admin.users.flashes.successful_update'), :users)
  end

  def reset_user_password
    if User.reset_password(params[:user_id])
      success = true
    else
      error_message = t('screens.admin.users.flashes.reset_email_failed')
    end

    handle_button_response(success, error_message, t('screens.admin.users.flashes.reset_email_sent'), :users)
  end

  def re_enable_user
    if User.re_enable_permissions(params[:user_id])
      success = true
    else
      error_message = t('screens.admin.users.flashes.reenable_failed')
    end

    handle_button_response(success, error_message, t('screens.admin.users.flashes.reenable_success'), :users)
  end

  def bulk_create_users
    role = params[:role]
    unless User.roles_list.include?(role.downcase)
      flash[:error] = t('screens.admin.users.flashes.invalid_role', :role => role)
      return redirect_to :action => :users
    end

    begin
      result = FutureAccount.create_multiple(params[:users], role)
      errors = result['errors']
      created = result['created']
    rescue CoreServer::CoreServerError => ex
      errors = [ex.error_message]
    end

    if errors.present?
      flash[:error] = errors.join(', ')
    elsif(created.blank?)
      flash[:error] = t('screens.admin.users.flashes.no_email_addresses')
      return redirect_to :action => :users
    else
      flash[:notice] = t('screens.admin.users.flashes.accounts_created', :count => created.size)
    end

    redirect_to :action => :users
  end

  def delete_future_user
    begin
      success = FutureAccount.delete(params[:id])
    rescue CoreServer::CoreServerError => ex
      error_message = ex.error_message
    end

    handle_button_response(success, error_message, t('screens.admin.users.flashes.pending_permissions_removed'), :users)
  end

  def comment_moderation
  end

  def views
    view_facet = view_types_facet()
    view_facet[:options].select! { |item| @@moderatable_types.include?(item[:value]) }

    @processed_browse = process_browse(request,
      datasetView: 'view',
      default_params: { moderation: 'pending' },
      browse_in_container: true,
      dataset_actions: t('screens.admin.view_moderation.moderation_status'),
      facets: [
        moderation_facet,
        view_facet,
        categories_facet(params),
        topics_facet(params)
      ],
      moderation: 'any',
      nofederate: 'true',
      suppress_dataset_creation: true,
      view_type: 'table',
      a11y_skip_to_content: true,
      a11y_table_description: t('screens.admin.view_moderation.table_description')
    )
  end

  # Set hide_from_catalog and hide_from_data_json, which are how datalenses
  # are kept out of the catalog. We used to overload view moderation, but no longer do.
  # Also used by changeVisibility in SIAM for datalenses only (we use setPermission
  # to set all other assets to private)
  # :partyparrot:
  def set_hidden
    begin
      view = View.find(params[:id])
    rescue CoreServer::ResourceNotFound
      flash[:error] = t('screens.admin.view_moderation.could_not_find_view')
      return redirect_to :action => 'views'
    end

    hidden = params[:hidden] == 'true' || params[:hidden] == 't'
    view.hideFromCatalog = hidden
    view.hideFromDataJson = hidden
    view.save!

    unless request.format.json?
      # EN-7318: ajax calls to this endpoint (currently from data lens pages) should not persist flash messages
      flash[:notice] = t(
        hidden ? 'screens.admin.datasets.set_hidden' : 'screens.admin.datasets.set_shown',
        :view_name => view.name
      )
    end

    if params[:skip_redirect] == 'true'
      render :nothing => true
    else
      redirect_to request.referer || { :action => 'views' }
    end
  end

  def set_view_moderation_status
    begin
      view = View.find(params[:id])
    rescue CoreServer::ResourceNotFound
      flash[:error] = t('screens.admin.view_moderation.could_not_find_view')
      return redirect_to :action => 'views'
    end

    view.moderationStatus = params[:approved] == 'yes'
    view.save!

    flash[:notice] = t(
      'screens.admin.view_moderation.set_moderation_status',
      :view_name => view.name,
      :moderation_status => view.moderation_status.downcase
    )

    if params[:skip_redirect] == 'true'
      render :nothing => true
    else
      redirect_to request.referer || { :action => 'views' }
    end
  end

  #
  # Social Data Player - theme customization
  #

  def sdp_templates
    @templates = WidgetCustomization.find.reject{ |t| t.hidden }
    @default_template_id = CurrentDomain.default_widget_customization_id
  end

  def sdp_template_create
    unless params[:new_template_name].present?
      flash.now[:error] = t('screens.admin.sdp.template_name_cannot_be_blank')
      return render 'shared/error', :status => :bad_request
    end

    begin
      widget_customization = WidgetCustomization.create(
        :name => params[:new_template_name],
        :customization => WidgetCustomization.default_theme(1).to_json
      )
    rescue CoreServer::CoreServerError => e
      if e.error_message == 'This domain has reached its template limit'
        flash.now[:error] = t('screens.admin.sdp.too_many_templates')
        return render 'shared/error', :status => :bad_request
      else
        flash.now[:error] = t('screens.admin.sdp.error_on_creation', :error_message => e.error_message)
        return render 'shared/error'
      end
    end

    redirect_options = { :action => :sdp_template, :id => widget_customization.uid }
    redirect_options[:view_id] = params[:view_id] if params[:view_id].present?
    redirect_to redirect_options
  end

  def sdp_template
    if params[:view_id].present?
      begin
        @view = View.find(params[:view_id])
      rescue CoreServer::ResourceNotFound
        flash.now[:error] = t('screens.admin.sdp.preview_could_not_be_found')
        return render 'shared/error', :status => :not_found
      end
    else
      views = Clytemnestra.search_views(
        :limit => 1,
        :nofederate => true,
        :limitTo => 'tables',
        :datasetView => 'dataset'
      ).results
      @view = views.first unless views.nil?
    end

    if @view.nil?
      flash.now[:error] = t('screens.admin.sdp.requires_published_dataset')
      return render 'shared/error', :status => :invalid_request
    end

    begin
      @widget_customization = WidgetCustomization.find(params[:id])
      @customization = WidgetCustomization.merge_theme_with_default(@widget_customization.customization)
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = t('screens.admin.sdp.could_not_find_template_customization')
      render 'shared/error', :status => :not_found
    end
  end

  def sdp_set_default_template
    configuration = ::Configuration.find_by_type('site_theme', true, request.host, false)[0]
    begin
      customization = WidgetCustomization.find(params[:id])
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = t('screens.admin.sdp.could_not_set_default_template')
      return render 'shared/error', :status => :not_found
    end

    create_or_update_property(configuration, 'sdp_template', params[:id])

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)
    respond_to do |format|
      format.html { redirect_to :action => :sdp_templates }
      format.data { render :json => { :success => true } }
    end
  end

  def sdp_delete_template
    begin
      customization = WidgetCustomization.find(params[:id])
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = t('screens.admin.sdp.could_not_delete_template')
      return render 'shared/error', :status => :not_found
    end

    if customization.uid == CurrentDomain.default_widget_customization_id
      flash.now[:error] = t('screens.admin.sdp.cannot_delete_default_template')
      return render 'shared/error', :status => :invalid_request
    end

    # Don't actually delete it, just don't show it in the UI
    customization.hidden = true
    customization.save!

    respond_to do |format|
      format.html { redirect_to :action => :sdp_templates }
      format.data { render :json => { :success => true } }
    end
  end

  #
  # Open Data Federation
  #

  def federations
    if params[:dataset].nil?
      @federations = Federation.find
    else
      @search_dataset = params[:dataset]
      @federations = Federation.find(:dataset => params[:dataset])
    end

    if !params[:domain].nil?
      @search_domain = params[:domain]
      @domains = Domain.find(:method => 'findAvailableFederationTargets', :domain => params[:domain])
    end
  end

  def delete_federation
    Federation.delete(params[:id])
    respond_to do |format|
      format.html { redirect_federation(t('screens.admin.federation.flashes.deleted')) }
      format.data { render :json => { :success => true } }
    end
  end

  def accept_federation
    Federation.accept(params[:id])
    respond_to do |format|
      format.html { redirect_federation(t('screens.admin.federation.flashes.accepted')) }
      format.data { render :json => { :success => true, :message => t('screens.admin.federation.accepted') } }
    end
  end

  def reject_federation
    Federation.reject(params[:id])
    respond_to do |format|
      format.html { redirect_federation(t('screens.admin.federation.flashes.rejected')) }
      format.data { render :json => { :success => true, :message => t('screens.admin.federation.pending')} }
    end
  end

  def create_federation
    begin
      data = Federation.new
      target_domain = Domain.find(params[:new_federation][:target_domain])
      data.targetDomainId = target_domain.id
      data.searchBoost = params[:new_federation][:search_boost]
      Federation.create(data)
    rescue CoreServer::ResourceNotFound => e
      flash[:error] = t('screens.admin.federation.flashes.invalid_domain')
      return redirect_to :action => :federations
    rescue CoreServer::CoreServerError => e
      flash[:error] = e.error_message
      return redirect_to :action => :federations
    end

    respond_to do |format|
      flash[:notice] = t('screens.admin.federation.flashes.created')
      return redirect_to :action => :federations
    end
  end

  #
  # Dataset-level metadata (custom fields, categories)
  #

  def metadata
    config = ::Configuration.find_or_create_by_type('metadata', 'name' => 'Metadata configuration')
    @metadata = config.properties.fieldsets || []
    @categories = get_configuration('view_categories', true).raw_properties.sort { |a, b| a[0].downcase <=> b[0].downcase }
    @locales = CurrentDomain.available_locales
  end

  def create_metadata_fieldset
    config = get_configuration('metadata')
    metadata = config.properties.fieldsets || []
    field = params[:newFieldsetName]

    if field.to_s.strip.blank?
      flash[:error] = t('screens.admin.metadata.flashes.fieldset_name_required')
      return redirect_to :action => 'metadata'
    end

    if metadata.any? { |f| f['name'].downcase == field.downcase }
      flash[:error] = t('screens.admin.metadata.flashes.fieldset_duplicated', :name => field)
      return redirect_to :action => 'metadata'
    end

    metadata << Hashie::Mash.new({ 'name' => field, 'fields' => [] })

    save_metadata(config, metadata, t('screens.admin.metadata.flashes.successful_create'))
  end

  def delete_metadata_fieldset
    config = get_configuration('metadata')
    metadata = config.properties.fieldsets
    metadata.delete_at(params[:fieldset].to_i)

    save_metadata(config, metadata, t('screens.admin.metadata.flashes.successful_remove'))
  end

  def create_metadata_field
    config = get_configuration('metadata')

    field_name = params[:newFieldName]
    if field_name.to_s.strip.empty?
      flash[:error] = t('screens.admin.metadata.flashes.field_name_required')
      return redirect_to :action => 'metadata'
    end

    metadata = config.properties.fieldsets || []
    fieldset = metadata[params[:fieldset].to_i] || {}

    fieldset['fields'] ||= []

    # No dups
    if fieldset['fields'].any? { |f| f['name'].downcase == field_name.downcase }
      flash[:error] = t('screens.admin.metadata.flashes.field_duplicated', :name => field_name)
      return redirect_to :action => 'metadata'
    end

    fieldset['fields'] << Hashie::Mash.new('name' => field_name, 'required' => false)

    save_metadata(config, metadata, t('screens.admin.metadata.flashes.field_successful_create'))
  end

  def save_metadata_field
    config   = get_configuration('metadata')
    metadata = config.properties.fieldsets
    fieldset = metadata[params[:fieldset].to_i]

    if fieldset.blank?
      return render json: { error: true, message: t('screens.admin.metadata.flashes.no_such_fieldset') }
    end

    field = fieldset.fields.detect{ |f| f['name'].downcase == params[:field].to_s.downcase }
    if field.nil?
      return render json: { error: true, message: t('screens.admin.metadata.flashes.no_such_field') }
    end

    options = params[:options]
    if options.blank?
      field['type'], field['options'] = 'text', nil
    else
      field['type'], field['options'] = 'fixed', options
    end
    save_metadata(config, metadata, t('screens.admin.metadata.flashes.field_successful_save'), true)
  end

  def delete_metadata_field
    config = get_configuration('metadata')
    metadata = config.properties.fieldsets
    metadata[params[:fieldset].to_i].fields.delete_at(params[:index].to_i)

    save_metadata(config, metadata, t('screens.admin.metadata.flashes.field_successful_remove'))
  end

  def toggle_metadata_option
    config = get_configuration('metadata')
    metadata = config.properties.fieldsets
    fieldset = metadata[params[:fieldset].to_i].fields
    option   = params[:option]

    field = fieldset[params[:index].to_i]
    field[option] = field[option].blank? ? true : false

    create_or_update_property(config, 'fieldsets', metadata)

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)

    respond_to do |format|
      format.html { redirect_to :action => 'metadata' }
      format.data { render :json => { :success => true, :option => option, :value => field[option]} }
    end
  end

  def move_metadata_field
    config = get_configuration('metadata')
    metadata = config.properties.fieldsets
    fieldset = metadata[params[:fieldset].to_i].fields

    field = fieldset.detect { |f| f['name'] == params[:field] }

    if field.nil?
      flash[:error] = t('screens.admin.metadata.flashes.cannot_move_field', :name => params[:field])
      respond_to do |format|
        format.html { return redirect_to :action => 'metadata' }
        format.data { return render :json => { :error => true, :error_message => flash[:error]} }
      end
    end

    index = fieldset.index(field)
    swap_index = params[:direction] == 'up' ? index-1 : index+1

    fieldset[index], fieldset[swap_index] = fieldset[swap_index], fieldset[index]

    create_or_update_property(config, 'fieldsets', metadata)

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)

    respond_to do |format|
      format.html { redirect_to :action => 'metadata' }
      format.data { render :json => { :success => true, :direction => params[:direction]} }
    end
  end

  def create_category
    new_category = params[:new_category]
    new_category_parent = params[:new_category_parent]
    new_category_displayed = params[:new_category_displayed] == "1"

    if new_category.blank?
      flash[:error] = t('screens.admin.metadata.flashes.category_cannot_be_blank')
      return redirect_to metadata_administration_path
    end

    config = get_configuration('view_categories')
    # Copy over default config
    config ||= create_config_copy('View categories', 'view_categories')

    if config.raw_properties.any? { |k, v| k.downcase == new_category.downcase }
      flash[:error] = t('screens.admin.metadata.flashes.category_must_be_unique', :new_category => new_category)
      return redirect_to metadata_administration_path
    end

    # Create a property with
    # name: category, value: { parent: parent_category, enabled: true }
    # where parent is optional
    prop_val = { :enabled => new_category_displayed }
    if new_category_parent.present?
      prop_val[:parent] = new_category_parent.titleize_if_necessary
    end

    locales = params[:new_locales] || []
    prop_val[:locale_strings] = locales if locales.present?

    config.create_property(new_category.titleize_if_necessary, prop_val)

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)

    flash[:notice] = t('screens.admin.metadata.flashes.created_category')
    redirect_to metadata_administration_path
  end

  def update_category
    category = params[:category]
    config = get_configuration('view_categories')
    config ||= create_config_copy('View categories', 'view_categories')

    cat_config = config.raw_properties[category[:name]]
    if cat_config.nil?
      flash[:error] = t('screens.admin.metadata.flashes.could_not_update_category', :category_name => category[:name])
      return redirect_to metadata_administration_path
    end

    cat_config[:locale_strings] = category[:locale]

    config.update_property(category[:name], cat_config)

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)

    flash[:notice] = t('screens.admin.metadata.flashes.updated_category')
    redirect_to metadata_administration_path
  end

  def delete_category
    category = params[:category]

    if category.blank?
      flash[:error] = t('screens.admin.metadata.flashes.must_select_category_to_delete')
      return redirect_to metadata_administration_path
    end

    config = get_configuration('view_categories')
    config ||= create_config_copy('View categories', 'view_categories')

    unless config.raw_properties.any? { |k, v| k == category }
      flash[:error] = t('screens.admin.metadata.flashes.could_not_delete_category', :category_name => category)
      return redirect_to metadata_administration_path
    end

    CoreServer::Base.connection.batch_request do |batch_id|
      config.raw_properties.each do |prop, value|
        if value['parent'].present? && value['parent'].downcase == category.downcase
          config.update_property(prop, value.merge('parent' => nil), batch_id)
        end
      end
      config.delete_property(category, false, batch_id)
    end

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)

    flash[:notice] = t('screens.admin.metadata.flashes.deleted_category')
    redirect_to metadata_administration_path
  end

  #
  # Homepage Customization
  #

  def home
    @stories = Story.find.sort
    @features = get_configuration().properties.featured_views
    @catalog_config = CurrentDomain.configuration('catalog')
  end

  def save_featured_views
    config = get_configuration

    # Rails apparently converts [] to nil; so fix it
    new_features = params[:features] || []
    create_or_update_property(config, 'featured_views', new_features)

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)
    clear_homepage_cache

    respond_to do |format|
      format.html { redirect_to home_administration_path }
      format.data { render :json => new_features }
    end
  end

  def delete_story
    begin
      Story.delete(params[:id])
      clear_homepage_cache
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = t('screens.admin.home.flashes.delete_error')
      return render 'shared/error', :status => :not_found
    end

    respond_to do |format|
      format.html { redirect_to home_administration_path }
      format.data { render :json => { :success => true } }
    end
  end

  def new_story
  end

  def create_story
    story = Hashie::Mash.new
    parse_story_params(story, params[:story])
    story.customization = story.customization.to_json unless story.customization.nil?
    story.merge!(params[:story].reject { |_, v| v.blank? }.stringify_keys)

    begin
      Story.create(story)
      clear_homepage_cache
    rescue CoreServer::CoreServerError => e
      flash.now[:error] = t('screens.admin.home.flashes.create_error', :error_message => e.error_message)
      return render 'shared/error', :status => :bad_request
    end

    redirect_to :home_administration
  end

  def move_story
    begin
      story_lo = Story.find(params[:id])
      story_hi = Story.find(params[:other])
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = t('screens.admin.home.flashes.move_error')
      return render 'shared/error', :status => :not_found
    end

    story_lo.order, story_hi.order = story_hi.order, story_lo.order
    story_lo.save!
    story_hi.save!
    flash.now[:notice] = t('screens.admin.home.flashes.move_success')
    clear_homepage_cache

    redirect_to :home_administration
  end

  def edit_story
    begin
      @story = Story.find(params[:id])
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = t('screens.admin.home.flashes.edit_error')
      return render 'shared/error', :status => :not_found
    end

    if params[:story].present?
      parse_story_params(@story, params[:story])
      @story.update_attributes(params[:story].stringify_keys)
      @story.save!
      flash.now[:notice] = t('screens.admin.home.flashes.edit_success')
      clear_homepage_cache
    end
  end

  def stories_appearance
    @stories = Story.find

    config_properties = get_configuration.properties
    if config_properties.theme_v2b.nil? || config_properties.theme_v2b.stories.nil?
      @story_theme = CurrentDomain.theme.stories
    else
      @story_theme = config_properties.theme_v2b.stories
    end
  end

  def update_stories_appearance
    config = get_configuration

    theme = config.properties.theme_v2b || {}

    create_or_update_property(config, 'theme_v2b', theme.merge('stories' => params[:stories]))

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)

    respond_to do |format|
      format.html { redirect_to home_administration_path }
      format.data { render :json => params[:stories] } # could be problematic?
    end
  end

  def modify_catalog_config
    config = get_configuration('catalog')
    if config.nil?
      config = ::Configuration.create(
        'name' => 'Catalog Configuration',
        'default' => true,
        'type' => 'catalog',
        'domainCName' => CurrentDomain.cname
      )
    end

    params[:catalog].each do |k, v|
      create_or_update_property(config, k, v)
    end

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)
    respond_to do |format|
      format.html { redirect_to home_administration_path }
      format.data { render :json => config.to_json }
    end
  end

  # General accessors for admins

  def configuration
    # Proxy configurations, with access checks
    # TODO Unwind this mixed &&, || without parentheses hairball
    return false unless params[:type] == 'metadata' &&
      check_auth_levels_any([UserRights::EDIT_SITE_THEME, UserRights::EDIT_PAGES]) ||
      params[:type] == 'catalog' || params[:type] == 'view_categories'

    config = get_configuration(params[:type], params[:merge])
    respond_to do |format|
      format.data { render :json => config.to_json }
    end
  end

  def flag_out_of_date
    if authenticate_with_http_basic do |login, password|
        user_session = UserSessionProvider.klass.new('login' => login, 'password' => password)
        user_session.save && check_auth_levels_any([
          UserRights::EDIT_SITE_THEME,
          UserRights::EDIT_PAGES,
          UserRights::CREATE_PAGES
        ])
      end
      CurrentDomain.flag_out_of_date!(CurrentDomain.cname)
      respond_to do |format|
        format.html { render :text => 'Done' }
        format.data { render :json => '"Done"' }
      end
    else
      request_http_basic_authentication
    end
  end

  def asset_inventory
    asset_inventory_dataset = AssetInventoryService.find

    if asset_inventory_dataset.present?
      redirect_to :controller => 'datasets', :action => 'show', :id => asset_inventory_dataset.id, :bypass_dslp => true
    else
      render 'shared/error', :status => :not_found
    end
  end

  def goals
    render_404 unless CurrentDomain.module_enabled?(:govStat)
  end

  #
  # Access checks
  #
  # Most content on the admin site has access controlled by:
  # * Whether you have a specific access level
  # * Whether you are a member of the domain at all
  # * Whether a module is enabled for the domain
  # * Whether a feature is enabled for the domain
  #
  # Checks that require used of the current_user need to be instance methods and
  # and public functions in order to be used in a before_filter; The other
  # checks are easier to define as class methods and can remain private.
  #

  public

  def check_auth_level(level)
    run_access_check{CurrentDomain.user_can?(current_user, level)}
  end

  def check_auth_levels_any(levels)
    run_access_check{levels.any?{|l| CurrentDomain.user_can?(current_user, l)}}
  end

  def check_auth_levels_all(levels)
    run_access_check{levels.all?{|l| CurrentDomain.user_can?(current_user, l)}}
  end

  def check_member
    run_access_check{CurrentDomain.member?(current_user)}
  end

  def check_module(mod)
    run_access_check{CurrentDomain.module_enabled?(mod)}
  end

  def check_module_available(mod)
    run_access_check{CurrentDomain.module_available?(mod)}
  end

  def check_feature(feature)
    run_access_check{CurrentDomain.feature?(feature)}
  end

  def check_approval_rights
    run_access_check{current_user.can_approve?}
  end

  def check_feature_flag(feature_flag)
    run_access_check { feature_flag?(feature_flag, request) }
  end

  def check_can_see_goals
    run_access_check do
      current_user.present? && current_user.has_right?(UserRights::MANAGE_GOALS)
    end
  end

  private

  def run_access_check(&block)
    if yield
      true
    else
      render_forbidden
      false
    end
  end

  def parse_story_params(story, story_params)
    if story_params[:image].present?
      story.imageId = Asset.create(story_params[:image]).id
      story_params.delete(:image)
    end

    customization = story.customization || {}
    [:backgroundColor, :link].each do |key|
      if story_params[key].present?
        customization[key.to_s] = story_params[key]
        story_params.delete(key)
      end
    end

    story.customization = customization
  end

  def find_privileged_users
    User.find :method => 'findPrivilegedUsers'
  end

  def redirect_federation(message = nil)
    flash[:notice] = message unless message.nil?
    redirect_to :action => :federations
  end

  def create_config_copy(name, type, parentId = nil)
    original_config = get_configuration(type, true).raw_properties

    config = ::Configuration.create({
      'name' => name,
      'default' => true,
      'type' => type,
      'domainCName' => CurrentDomain.cname,
      'parentId' => parentId # May be nil
    }.compact)

    # Copy over the original, merged values
    CoreServer::Base.connection.batch_request do |batch_id|
      original_config.each { |k, v| config.create_property(k, v, batch_id) }
    end

    config
  end

  def create_or_update_property(configuration, name, value)
    configuration.create_or_update_property(name.to_s, value)
  end

  def clear_homepage_cache
    # clear the homepage cache since assumedly something about them updated
    cache_key = app_helper.cache_key('canvas-homepage', 'domain' => CurrentDomain.cname)
    clear_success = expire_fragment(cache_key)
  end

  def get_configuration(type = 'site_theme', merge = false, cache = false)
    ::Configuration.find_by_type(type, true, CurrentDomain.cname, merge, cache).first
  end

  def georegion_enabler
    @georegion_enabler ||= ::Services::Administration::GeoregionEnabler.new
  end

  def georegion_defaulter
    @georegion_defaulter ||= ::Services::Administration::GeoregionDefaulter.new
  end

  def save_metadata(config, metadata, successMessage, json = false)
    create_or_update_property(config, 'fieldsets', metadata)

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)

    if json
      render json: { message: successMessage, success: true }
    else
      flash[:notice] = successMessage
      redirect_to :action => 'metadata'
    end
  end

  def handle_button_response(success, error_message, success_message, redirect_action)
    respond_to do |format|
      format.html do
        if error_message
          flash[:error] = error_message.html_safe
        else
          flash[:notice] = success_message.html_safe
        end
        redirect_to request.query_parameters.reverse_merge(:action => redirect_action)
      end
      format.any(:js, :json, :data) do
        if success
          render :json => { :success => true, :message => success_message }
        else
          render :json => { :error => true, :message => error_message }
        end
      end
    end
  end

  # Need an instance for using cache_key() and pluralize()
  def app_helper
    AppHelper.instance
  end

  @@default_embed_options = {
    :suppressed_facets => {
      :type => false,
      :category => false,
      :topic => false
    },
    :disable => { },
    :defaults => { },
    :limit => 10
  }
end
