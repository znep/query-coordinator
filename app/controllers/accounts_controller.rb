class AccountsController < ApplicationController
  def show
  end

  def update
    if params[:user][:email]
      current_user.email = params[:user][:email]
    end
    if params[:user][:password_new]
      current_user.password = params[:user][:password_new]
    end

    respond_to do |format|
      format.html { redirect_to(account_url) }
      format.data   { render :json => current_user.to_json }
    end
  end
end
