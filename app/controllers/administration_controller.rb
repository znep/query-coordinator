class AdministrationController < ApplicationController
  before_filter :check_auth,   :except => [:analytics, :dataset_analytics]
  before_filter :check_member, :only => [:analytics]
  before_filter :check_module, :only => [:analytics]

  layout 'dataset_v2'

  def analytics
  end

  def dataset_analytics
    begin
      @view = View.find(params[:id])
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = 'This ' + I18n.t(:blist_name).downcase +
        ' cannot be found, or has been deleted.'
      return (render 'shared/error', :status => :not_found)
    end
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

  private
  def check_auth(level = 'manage_users')
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
end
