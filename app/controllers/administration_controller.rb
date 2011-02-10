class AdministrationController < ApplicationController
  include BrowseActions

  def index
    check_member()
  end

  def datasets
    render_forbidden unless CurrentDomain.user_can?(current_user,
                                                    'edit_others_datasets') ||
                            CurrentDomain.user_can?(current_user,
                                                    'edit_site_theme')

    @browse_in_container = true
    @opts = {:admin => CurrentDomain.user_can?(current_user, 'edit_others_datasets')}
    process_browse!
  end
  def modify_sidebar_config
    check_auth_level('edit_site_theme')

    config = get_configuration('sidebar')
    if config.nil?
      opts = { 'name' => 'Sidebar Configuration', 'default' => true,
        'type' => 'sidebar', 'domainCName' => CurrentDomain.cname }
      config = Configuration.create(opts)
    end

    params[:sidebar].each do |k, v|
      update_or_create_property(config, k.to_s, v)
    end

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)
    respond_to do |format|
      format.data { render :json => config.to_json }
      format.html { redirect_to datasets_administration_path }
    end
  end

  def select_dataset
    @browse_in_container = true
    process_browse!
  end

  def analytics
    check_member()
    check_module('advanced_metrics')
  end

  def users
    check_auth_level('manage_users')

    @roles_list = User.roles_list
    if !params[:username].blank?
      @search = params[:username]
      @user_search_results = SearchResult.search('users', :q => params[:username]).first.results
      @futures = FutureAccount.find.select { |f| f.email.downcase.include? params[:username].downcase }
    else
      @admins = find_privileged_users.sort{|x,y| x.displayName <=> y.displayName}
      @futures = FutureAccount.find
    end

    if @user_search_results.nil?
      @users_list = @admins
      @existing_user_actions = true
    elsif @user_search_results.empty?
      @table_title = 'No existing users found'
    else
      @table_title = "Search Results for '#{@search}'"
      @users_list = @user_search_results
      @existing_user_actions = false
    end
  end
  def set_user_role
    check_auth_level('manage_users')

    error_message = nil
    begin
      updated_user = User.set_role(params[:user_id], params[:role])
    rescue CoreServer::CoreServerError => ex
      error_message = ex.error_message
    end
    handle_button_response(updated_user, error_message, "User successfully updated", :users)
  end
  def reset_user_password
    check_auth_level('manage_users')

    if User.reset_password(params[:user_id])
      success = true
    else
      error_message = "There was an error sending the password reset email."
    end
    handle_button_response(success, error_message, "Password reset email sent", :users)
  end
  def bulk_create_users
    check_auth_level('manage_users')

    role = params[:role]
    if !User.roles_list.any? { |r| r.first == role.downcase }
      flash[:error] = "Invalid role specified for user creation: #{role}"
      return (redirect_to :action => :users)
    end

    emails = params[:users].split(/[, ]/).map{ |e| e.strip }.select { |e| !e.blank? }

    begin
      results = CoreServer::Base.connection.batch_request do
        emails.each do |email|
          FutureAccount.create({
            :email => email,
            :role => role
          }, false)
        end
      end

      errors = []
      results.each do |result|
        if result['error']
          errors.push(result['error_message'])
        end
      end
    rescue CoreServer::CoreServerError => ex
      errors = [ex.error_message]
    end

    if errors.size > 0
      flash[:error] = errors.join(', ')
    else
      flash[:notice] = "All accounts successfully created"
    end

    redirect_to :action => :users
  end
  def delete_future_user
    check_auth_level('manage_users')

    begin
      success = FutureAccount.delete(params[:id])
    rescue CoreServer::CoreServerError => ex
      error_message = ex.error_message
    end
    handle_button_response(success, error_message, "Pending permissions removed", :users)
  end

  def moderation
    check_auth_level('moderate_comments')
    check_module('publisher_comment_moderation')
  end

  def sdp_templates
    check_auth_level('edit_sdp')
    check_module('sdp_customizer')

    @templates = WidgetCustomization.find.reject{ |t| t.hidden }
    @default_template_id = CurrentDomain.default_widget_customization_id
  end
  def sdp_template_create
    check_auth_level('edit_sdp')
    check_module('sdp_customizer')

    unless params[:new_template_name].present?
      flash.now[:error] = 'Template name is required'
      return (render 'shared/error', :status => :bad_request)
    end

    begin
      widget_customization = WidgetCustomization.create({ :name => params[:new_template_name],
                                                          :customization => WidgetCustomization.default_theme(1).to_json })
    rescue CoreServer::CoreServerError => e
      if e.error_message == 'This domain has reached its template limit'
        flash.now[:error] = "You have created your allotted number of templates. Please delete one or contact support to purchase more."
        return render 'shared/error', :status => :bad_request
      else
        flash.now[:error] = "An error occurred during your request: #{e.error_message}"
        return render 'shared/error'
      end
    end

    redirect_options = {:action => :sdp_template, :id => widget_customization.uid}
    redirect_options[:view_id] = params[:view_id] if params[:view_id].present?
    redirect_to redirect_options
  end
  def sdp_template
    check_auth_level('edit_sdp')
    check_module('sdp_customizer')

    if params[:view_id].present?
      begin
        @view = View.find(params[:view_id])
      rescue CoreServer::ResourceNotFound
          flash.now[:error] = 'This ' + I18n.t(:blist_name).downcase +
            ' cannot be found, or has been deleted.'
          return (render 'shared/error', :status => :not_found)
        return
      end
    else
      views = View.find({ :public_only => true, :limit => 10 }, true) # hopefully 10 will be enough?
      @view = views.find{ |view| !view.is_alt_view? } || views.first unless views.nil?
    end

    if @view.nil?
      flash.now[:error] = 'Please create a dataset you can publish first'
      return (render 'shared/error', :status => :invalid_request)
    end

    begin
      @widget_customization = WidgetCustomization.find(params[:id])
      @customization = WidgetCustomization.merge_theme_with_default(@widget_customization.customization)
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = 'This template customization cannot be found'
      return (render 'shared/error', :status => :not_found)
    end
  end
  def sdp_set_default_template
    check_auth_level('edit_sdp')
    check_module('sdp_customizer')

    configuration = Configuration.find_by_type('site_theme',  true, request.host, false)[0]
    begin
      customization = WidgetCustomization.find(params[:id])
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = 'Can not set template as default: template not found'
      return (render 'shared/error', :status => :not_found)
    end

    update_or_create_property(configuration, "sdp_template", params[:id])

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)
    respond_to do |format|
      format.data { render :json => { :success => true } }
      format.html { redirect_to :action => :sdp_templates }
    end
  end
  def sdp_delete_template
    check_auth_level('edit_sdp')
    check_module('sdp_customizer')

    begin
      customization = WidgetCustomization.find(params[:id])
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = 'Can not set template as default: template not found'
      return (render 'shared/error', :status => :not_found)
    end

    if customization.uid == CurrentDomain.default_widget_customization_id
      flash.now[:error] = 'Can not delete the default template. Please choose a new default first.'
      return (render 'shared/error', :status => :invalid_request)
    end

    # Don't actually delete it, just don't show it in the UI
    customization.hidden = true
    customization.save!

    respond_to do |format|
      format.data { render :json => { :success => true } }
      format.html { redirect_to :action => :sdp_templates }
    end
  end

  ## open data federation
  def federations
    check_auth_level('federations')
    check_module('federations')

    if (params[:dataset].nil?)
      @federations = DataFederation.find
    else
      @search_dataset = params[:dataset]
      @federations = DataFederation.find(:dataset => params[:dataset])
    end

    if (!params[:domain].nil?)
      @search_domain = params[:domain]
      @domains = Domain.find(:method => 'findAvailableFederationTargets', :domain => params[:domain])
    end
  end
  def delete_federation
    check_auth_level('federations')
    check_module('federations')

    DataFederation.delete(params[:id])
    respond_to do |format|
      format.data { render :json => { :success => true } }
      format.html { redirect_federation("Federation successfully deleted") }
    end
  end
  def accept_federation
    check_auth_level('federations')
    check_module('federations')

    DataFederation.accept(params[:id])
    respond_to do |format|
      format.data { render :json => { :success => true, :message => 'Accepted' } }
      format.html { redirect_federation("Federation successfully accepted") }
    end
  end
  def reject_federation
    check_auth_level('federations')
    check_module('federations')

    DataFederation.reject(params[:id])
    respond_to do |format|
      format.data { render :json => { :success => true, :message => 'Pending' } }
      format.html { redirect_federation("Federation successfully rejected") }
    end
  end
  def create_federation
    check_auth_level('federations')
    check_module('federations')

    begin
      data = DataFederation.new
      target_domain = Domain.find(params[:new_federation][:target_domain])
      data.targetDomainId = target_domain.id
      DataFederation.create(data)
    rescue CoreServer::ResourceNotFound => e
      flash[:error] = "Could not create data federation: target domain is invalid"
      return(redirect_to :action => :federations)
    rescue CoreServer::CoreServerError => e
      flash[:error] = e.error_message
      return(redirect_to :action => :federations)
    end

    respond_to do |format|
      flash[:notice] = "Federation successfully created"
      return(redirect_to :action => :federations)
    end
  end

  def verify_layer_url
    response = fetch_layer_info(params[:url])
    respond_to do |format| format.data { render :json => response.to_json } end
  end

  # Dataset-level metadata (custom fields, categories)
  def metadata
    check_auth_level('edit_site_theme')
    @metadata = get_configuration().properties.custom_dataset_metadata || []
    @categories = get_configuration('view_categories', true).properties.sort { |a, b| a[0].downcase <=> b[0].downcase }
  end
  def create_metadata_fieldset
    check_auth_level('edit_site_theme')
    config = get_configuration()
    metadata = config.properties.custom_dataset_metadata || []
    field = params[:newFieldsetName]

    if field.nil? || field.strip().blank?
      flash[:error] = "Cannot create field set without a name"
      return redirect_to :action => 'metadata'
    end

    if metadata.any? { |f| f['name'].downcase == field.downcase }
      flash[:error] = "Cannot create duplicate field set named '#{field}'"
      return redirect_to :action => 'metadata'
    end

    metadata << Hashie::Mash.new({ 'name' => field, 'fields' => [] })

    save_metadata(config, metadata, "Field Set Successfully Created")
  end
  def delete_metadata_fieldset
    check_auth_level('edit_site_theme')
    config = get_configuration()
    metadata = config.properties.custom_dataset_metadata
    metadata.delete_at(params[:fieldset].to_i)

    save_metadata(config, metadata, "Field Set Successfully Removed")
  end
  def create_metadata_field
    check_auth_level('edit_site_theme')

    config = get_configuration()

    field_name = params[:newFieldName]
    if (field_name.nil? || field_name.strip().empty?)
      flash[:error] = "Cannot create a field with no name"
      return redirect_to :action => 'metadata'
    end

    metadata = config.properties.custom_dataset_metadata
    fieldset = metadata[params[:fieldset].to_i]

    fieldset['fields'] ||= []

    # No dups
    if fieldset['fields'].any? { |f| f['name'].downcase == field_name.downcase }
      flash[:error] = "You cannot create a duplicate field named '#{field_name}'"
      return redirect_to :action => 'metadata'
    end

    fieldset['fields'] << Hashie::Mash.new({ 'name' => field_name,
      'required' => false })

    save_metadata(config, metadata, "Field Successfully Created")
  end
  def delete_metadata_field
    check_auth_level('edit_site_theme')
    config = get_configuration()
    metadata = config.properties.custom_dataset_metadata
    metadata[params[:fieldset].to_i].fields.delete_at(params[:index].to_i)

    save_metadata(config, metadata, "Field Successfully Removed")
  end
  def toggle_metadata_required
    check_auth_level('edit_site_theme')
    config = get_configuration()
    metadata = config.properties.custom_dataset_metadata
    fieldset = metadata[params[:fieldset].to_i].fields

    field = fieldset[params[:index].to_i]
    field['required'] = field['required'].blank? ? true : false

    update_or_create_property(config, 'custom_dataset_metadata', metadata)

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)

    respond_to do |format|
      format.data { render :json => {:success => true} }
      format.html { redirect_to :action => 'metadata' }
    end
  end
  def move_metadata_field
    check_auth_level('edit_site_theme')
    config = get_configuration()
    metadata = config.properties.custom_dataset_metadata
    fieldset = metadata[params[:fieldset].to_i].fields

    field = fieldset.detect { |f| f['name'] == params[:field] }

    if field.nil?
      flash[:error] = "Cannot move field named '#{params[:field]}': not found"
      respond_to do |format|
        format.data { return render :json => {:error => true, :error_message => flash[:error]} }
        format.html { return redirect_to :action => 'metadata' }
      end
    end

    index = fieldset.index(field)
    swap_index = params[:direction] == 'up' ? index-1 : index+1

    fieldset[index], fieldset[swap_index] = fieldset[swap_index], fieldset[index]

    update_or_create_property(config, 'custom_dataset_metadata', metadata)

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)

    respond_to do |format|
      format.data { render :json => {:success => true, :direction => params[:direction]} }
      format.html { redirect_to :action => 'metadata' }
    end
  end
  def create_category
    check_auth_level('edit_site_theme')
    new_category = params[:new_category]

    if new_category.blank?
      flash[:error] = "Please enter a name to create a new category"
      return redirect_to metadata_administration_path
    end

    config = get_configuration('view_categories')
    # Copy over default config
    if config.nil?
      config = create_config_copy('View categories', 'view_categories')
    end

    if config.raw_properties.any? {|k,v| k.downcase == new_category.downcase }
      flash[:error] = "Cannot create duplicate category named '#{new_category}'"
      return redirect_to metadata_administration_path
    end

    # Create a property with name: category, value: true
    config.create_property(new_category.titleize_if_necessary, true)

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)

    flash[:notice] = "Category successfully created"
    redirect_to metadata_administration_path
  end
  def delete_category
    check_auth_level('edit_site_theme')
    category = params[:category]

    if category.blank?
      flash[:error] = "Please select a category to delete from the list"
      return redirect_to metadata_administration_path
    end

    config = get_configuration('view_categories')
    if config.nil?
      config = create_config_copy('View categories', 'view_categories')
    end

    if config.raw_properties.any? { |k,v| k == category }
      config.delete_property(URI.escape(category))
    else
      flash[:error] = "Could not remove category named '#{category}'"
    end

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)

    flash[:notice] = "Category successfully removed"
    redirect_to metadata_administration_path
  end

  def home
    render_forbidden unless CurrentDomain.user_can?(current_user, 'manage_stories') ||
                            CurrentDomain.user_can?(current_user, 'feature_items')
    @stories = Story.find
    @features = CurrentDomain.featured_views
  end

  def save_featured_views
    check_auth_level('feature_items')

    config = get_configuration

    update_or_create_property(config, 'featured_views', params[:features])

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)

    respond_to do |format|
      format.data { render :json => params[:features] }
      format.html { redirect_to home_administration_path }
    end
  end

  def delete_story
    check_auth_level('manage_stories')
    begin
      Story.delete(params[:id])
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = 'The story you attempted to delete does not exist.'
      return render 'shared/error', :status => :not_found
    end

    respond_to do |format|
      format.data { render :json => {:success => true} }
      format.html { redirect_to home_administration_path }
    end
  end
  def new_story
    check_auth_level('manage_stories')
  end
  def create_story
    check_auth_level('manage_stories')
    story = Hashie::Mash.new
    parse_story_params(story, params[:story])
    story.customization = story.customization.to_json unless story.customization.nil?
    story.merge!(params[:story].stringify_keys)

    begin
      Story.create(story)
      clear_stories_cache
    rescue CoreServer::CoreServerError => e
      flash.now[:error] = "An error occurred during your request: #{e.error_message}"
      return render 'shared/error', :status => :bad_request
    end

    redirect_to :home_administration
  end
  def edit_story
    check_auth_level('manage_stories')
    begin
      @story = Story.find(params[:id])
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = 'The story you attempted to edit does not exist.'
      return render 'shared/error', :status => :not_found
    end

    if params[:story].present?
      parse_story_params(@story, params[:story])
      @story.update_attributes(params[:story].stringify_keys)
      @story.save!
      clear_stories_cache
    end
  end
  def stories_appearance
    check_auth_level('manage_stories')
    @stories = Story.find

    config_properties = get_configuration.properties
    if config_properties.theme_v2b.nil? || config_properties.theme_v2b.stories.nil?
      @story_theme = CurrentDomain.theme.stories
    else
      @story_theme = config_properties.theme_v2b.stories
    end
  end
  def update_stories_appearance
    check_auth_level('manage_stories')

    config = get_configuration

    theme = config.properties.theme_v2b || {}

    update_or_create_property(config, 'theme_v2b', theme.merge({ 'stories' => params[:stories] }))

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)

    respond_to do |format|
      format.data { render :json => params[:stories] } # could be problematic?
      format.html { redirect_to home_administration_path }
    end
  end

private
  def check_auth_level(level = 'manage_users')
    render_forbidden unless CurrentDomain.user_can?(current_user, level)
  end
  def check_module(mod = 'advanced_metrics')
    render_forbidden unless CurrentDomain.module_available?(mod)
  end
  def check_member
    render_forbidden unless CurrentDomain.member?(current_user)
  end

  def parse_story_params(story, story_params)
    if story_params[:image].present?
      story.imageId = Asset.create(story_params[:image]).id
      story_params.delete(:image)
    end

    customization = story.customization || {}
    [:backgroundColor].each do |key|
      unless story_params[key].nil?
        customization[key.to_s] = story_params[key]
        story_params.delete(key)
      end
    end
    story.customization = customization
  end

  def find_privileged_users(level=1)
    User.find :method => 'usersWithRole', :role => level
  end

  def redirect_federation(message = nil)
    flash[:notice] = message unless message.nil?
    redirect_to :action => :federations
  end

  def create_config_copy(name, type, parentId = nil)
    original_config = get_configuration(type, true).raw_properties

    opts = { 'name' => name, 'default' => true, 'type' => type,
      'domainCName' => CurrentDomain.cname }

    unless parentId.nil?
      opts['parentId'] = parentId
    end

    config = Configuration.create(opts)

    # Copy over the original, merged values
    CoreServer::Base.connection.batch_request do
      original_config.each {|k,v| config.create_property(k, v) }
    end
    return config
  end

  def update_or_create_property(configuration, name, value)
    unless value.nil?
      if (!configuration.raw_properties.key?(name))
        configuration.create_property(name,value)
      else
        configuration.update_property(name,value)
      end
    end
  end

  def clear_stories_cache
    # clear the cache of stories since assumedly something about them updated
    stories_cache_key = app_helper.cache_key('homepage-stories', { 'domain' => CurrentDomain.cname })
    clear_success = expire_fragment(stories_cache_key)
    Rails.logger.info(">>> attempted to clear stories cache at #{stories_cache_key}, with result #{clear_success}")
  end

  def fetch_layer_info(layer_url)
    begin
      uri = URI.parse(URI.extract(layer_url).first)
      uri.query = "f=json"
      layer_info = JSON.parse(Net::HTTP.get(uri))
    rescue SocketError, URI::InvalidURIError, JSON::ParserError
      error = "url invalid"
    end
    error = 'url invalid' if layer_info && (layer_info['error'] \
                                          || !layer_info['spatialReference'])

    if error
      return { 'error' => error }
    else
      title = layer_info['documentInfo']['Title'] if layer_info['documentInfo']
      title = uri.path.slice(uri.path.index('services')+8..-1) if title.blank?

      layer = {}
      layer['text']  = "#{title} (#{uri.host})"
      layer['value'] = uri.to_s.sub /\?.*$/, ''
      layer['data']  = { 'type' => layer_info['tileInfo'] ? 'tile' : 'dynamic' }

      return layer
    end
  end

  def get_configuration(type='site_theme', merge=false)
    Configuration.find_by_type(type, true, CurrentDomain.cname, merge).first
  end

  def save_metadata(config, metadata, successMessage)
    update_or_create_property(config, 'custom_dataset_metadata', metadata)

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)

    flash[:notice] = successMessage
    redirect_to :action => 'metadata'
  end

  def handle_button_response(success, error_message, success_message, redirect_action)
    respond_to do |format|
      format.data do
        if success
          render :json => {:success => true, :message => success_message}
        else
          render :json => {:error => true, :message => error_message}
        end
      end
      format.html do
        if error_message
          flash[:error] = error_message
        else
          flash[:notice] = success_message
        end
        redirect_to :action => redirect_action
      end
    end
  end

private
  # Need an instance for using cache_key()
  def app_helper
    AppHelper.instance
  end
end

class AppHelper
  include Singleton
  include ApplicationHelper
end
