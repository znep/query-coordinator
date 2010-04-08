class AdminController < ApplicationController
  include AdminHelper
  before_filter :check_auth

  def index
  end
  
  def features
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
        success = updated_user && updated_user.roles && updated_user.roles.include?(params[:role])
      end
      flash[:notice] = success ?
        "User '#{updated_user.displayName}' successfully saved" : "Error saving user. #{error_message}"
    end
    redirect_to :action => :users
  end
  
  
  def reload
    CurrentDomain.reload(request.host)
    redirect_to :action => :index
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
  
  def find_privileged_users(level=1)
    User.find :method => 'usersWithRole', :role => level
  end
  
end