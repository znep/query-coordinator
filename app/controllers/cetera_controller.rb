# Loosely based on CeteraController in frontend repo.
class CeteraController < ApplicationController

  # Depending on the passed parameters, call a particular method on the
  # UserSearch client.
  def users
    if params[:email]
      invoke(:find_by_email, params[:email])
    else
      render :nothing => true, :status => :bad_request
    end
  end

  private

  # Delegate to UserSearch client and handle errors.
  def invoke(method, *args)
    begin
      cetera_response = user_search_client.send(method, args)
      render :json => cetera_response
    rescue StandardError => ex
      render :nothing => true, :status => :internal_server_error
    end
  end

  def user_search_client
    @user_search_client ||= Cetera::UserSearch.new(
      Rails.application.config.cetera_client,
      CoreServer.current_domain['cname'],
      CoreServer.headers_from_request(request)['Cookie']
    )
  end
end
