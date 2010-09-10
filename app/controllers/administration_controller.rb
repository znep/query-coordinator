class AdministrationController < ApplicationController
  before_filter :check_auth_level, :except => [:analytics]
  before_filter :check_member,     :only => [:analytics]
  before_filter :check_module,     :only => [:analytics]

  layout 'dataset_v2'

  def analytics
  end

  def users
    @roles_list = User.roles_list
    if !params[:username].blank?
      @search = params[:username]
      @user_search_results= User.find :name => params[:username]
    else
      @admins = find_privileged_users.sort{|x,y| x.displayName <=> y.displayName}
    end

    if params[:userid].present? && params[:role].present?
      success = false
      begin
        updated_user = User.set_role(params[:userid], params[:role])
      rescue CoreServer::CoreServerError => ex
        error_message = ex.error_message
      end
      if updated_user
        flash[:notice] = "User '#{updated_user.displayName}' successfully saved"
      else
        flash[:error] = "Error saving user. #{error_message}"
      end
    end
  end

  def moderation
  end

  def sdp_templates
    @templates = WidgetCustomization.find.reject{ |t| t.hidden }
    @default_template_id = CurrentDomain.default_widget_customization_id
  end
  def sdp_set_default_template
    configuration = Configuration.find_by_type('site_theme',  true, request.host, false)[0]
    begin
      customization = WidgetCustomization.find(params[:id])
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = 'Can not set template as default: template not found'
      return (render 'shared/error', :status => :not_found)
    end

    update_or_create_property(configuration, "sdp_template", params[:id]) do 
      configuration.raw_properties["sdp_template"].nil?
    end

    CurrentDomain.flag_preferences_out_of_date!
    respond_to do |format|
      format.data { render :json => { :success => true } }
      format.html { redirect_to :action => :sdp_templates }
    end
  end
  def sdp_delete_template
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

    CurrentDomain.flag_preferences_out_of_date!
    respond_to do |format|
      format.data { render :json => { :success => true } }
      format.html { redirect_to :action => :sdp_templates }
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

  def find_privileged_users(level=1)
    User.find :method => 'usersWithRole', :role => level
  end

  def update_or_create_property(configuration, name, value)
    unless value.nil?
      if (yield)
        configuration.create_property(name,value)
      else
        configuration.update_property(name,value)
      end
    end
  end
end
