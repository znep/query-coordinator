class AdminController < ApplicationController
  include AdminHelper

  before_filter :check_auth, :except => [:index, :theme]
  before_filter :check_publisher, :only => [:index, :theme]

  def index
  end
  
  def config
    session[:return_to] = url_for(:action => :config)
  
    @features = CurrentDomain.features.select { |k,v| Domain.configurable_features.include?(k) }

    @modules  = CurrentDomain.modules.select { |mod|
      Domain.flippable_modules.include?(mod['name']) && 
        !(mod['name'] =~ /_comment/) }.map do |m|
        { :name => m['name'], :description => m['description'], :enabled => CurrentDomain.features[m['name']]}
    end

    @comment_modules = CurrentDomain.modules.select { |mod|
      Domain.comment_modules.include?(mod['name']) }.map do |c|
        {:name => c['name'], :description => c['description'],
          :enabled => CurrentDomain.features[c['name']] }
    end

    # HACK: Our comment system isn't one-hot, so we have to make a disable option
    @comment_modules.insert(0, :name => '0', :description => 'Disable Comments', 
        :enabled => CurrentDomain.features['allow_comments'] == false)

    @strings = CurrentDomain.strings.select { |k,v| Domain.configurable_strings.include?(k) }
  end

  def update_config
    feature_set   = Configuration.find_by_type('feature_set', true, request.host, false)[0]
    configuration = Configuration.find_by_type('site_theme',  true, request.host, false)[0]

    # Wrap it in one big, cuddly batch request
    CoreServer::Base.connection.batch_request do
      params[:strings].each do |name, value|
        if(Domain.configurable_strings.include?(name))
          update_or_create_property(configuration, "strings.#{name}", value) do
            configuration.properties.strings[name].nil?
          end
        end
      end

      update_config_from_form(feature_set,
        Domain.flippable_modules, params[:modules])
      update_config_from_form(feature_set,
        Domain.configurable_features, params[:features])

      comment_config = {
        'allow_comments' => true,
        'community_comment_moderation' => false,
        'publisher_comment_moderation' => false
      }
      # HACK: There is no 'disable_comments' flag, so we have this
      if params[:comments] == '0'
        comment_config['allow_comments'] = false
      else
        comment_config[params[:comments]] = true
      end

      comment_config.each do |name, value|
        if CurrentDomain.modules.any? { |m| m['name'] == name }
          update_or_create_property(feature_set, name, value) do
            feature_set.properties[name].nil?
          end
        end
      end
    end

    CurrentDomain.flag_preferences_out_of_date!
    redirect_to :action => :config
  end

  def theme
    session[:return_to] = url_for(:action => :theme)
    configuration = Configuration.find_by_type('site_theme', true, request.host)[0]
    theme = configuration.properties['theme']

  end

  def users
    @roles_list = User.roles_list
    if !params[:username].blank?
      @search = params[:username]
      @user_search_results= User.find :name => params[:username]
    else
      @admins = find_privileged_users.sort{|x,y| x.displayName <=> y.displayName}
    end
  end
  
  def save_user_role
    # Updating a user's permissions via POST
    if params[:id] && params[:role].present?
      success = false
      error_message = nil
      begin
        updated_user = User.set_role(params[:id], params[:role])
      rescue CoreServer::CoreServerError => ex
        error_message = ex.error_message
      end
      if params[:role] == '0'
        success = updated_user && updated_user.roles.nil?
      else
        success = updated_user && updated_user.roles &&
          updated_user.roles.include?(params[:role])
      end
      flash[:notice] = success ?
        "User '#{updated_user.displayName}' successfully saved" :
        "Error saving user. #{error_message}"
    end
    redirect_to :action => :users
  end
  
  
  def reload
    CurrentDomain.reload(request.host)
    redirect_back_or_default(url_for :action => :index)
  end


private
  def check_auth(role='administrator')
    if current_user.nil?
      return require_user(true)
    elsif !current_user.has_role?(role)
      flash.now[:error] = "You do not have permission to view this page"
      return (render 'shared/error', :status => :forbidden)
    end
  end
  
  def check_publisher
    check_auth('publisher')
  end
  
  def find_privileged_users(level=1)
    User.find :method => 'usersWithRole', :role => level
  end

  def update_or_create_property(configuration, name, value)
    if (yield)
      configuration.create_property(name,value)
    else
      configuration.update_property(name,value)
    end
  end
  
  def update_config_from_form(config, whitelist, form_values, enabled='enabled')
    if form_values
      form_values[:name].each do |name, value|
        if(whitelist.include?(name))
          config.update_property(name, form_values[:enabled] &&
            form_values[:enabled][name] == enabled)
        end
      end
    end
  end
end