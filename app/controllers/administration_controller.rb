class AdministrationController < ApplicationController
  before_filter :check_auth
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
        success = User.set_role(params[:userid], params[:role])
      rescue CoreServer::CoreServerError => ex
        error_message = ex.error_message
      end
      if success
        flash[:notice] = "User '#{updated_user.displayName}' successfully saved"
      else
        flash[:error] = "Error saving user. #{error_message}"
      end
    end

  end

  private
  def check_auth(level = 'manage_users')
    unless CurrentDomain.user_can?(current_user, level)
      flash.now[:error] = "You do not have permission to view this page"
      return (render 'shared/error', :status => :forbidden)
    end
  end

  def find_privileged_users(level=1)
    User.find :method => 'usersWithRole', :role => level
  end
end
