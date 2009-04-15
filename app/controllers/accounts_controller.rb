class AccountsController < ApplicationController
  skip_before_filter :require_user, :only => [:new, :create]
  def show
  end

  def update
    error_msg = nil
    begin
    if params[:user][:email]
      if params[:user][:email] != params[:user][:email_confirm]
        error_msg = "New emails do not match"
      else
        current_user.update_attributes!(
          {:email => params[:user][:email],
           :password => params[:user][:email_password]})
      end
    elsif params[:user][:password_new]
      if params[:user][:password_new] != params[:user][:password_confirm]
        error_msg = "New passwords do not match"
      else
        current_user.update_attributes!(
          {:newPassword => params[:user][:password_new],
           :password => params[:user][:password_old]})
      end
    end
    rescue CoreServerError => e
      error_msg = e.error_message
    end

    respond_to do |format|
      format.html { redirect_to(account_url) }
      format.data   { render :json => {:error => error_msg,
        :user => current_user}.to_json }
    end
  end

  def new
    @body_class = 'signup'
  end

  def create
  end
end
