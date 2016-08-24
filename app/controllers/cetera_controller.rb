require 'cetera'

class CeteraController < ApplicationController
  include CommonSocrataMethods

  skip_before_filter :require_user

  def users
    if params[:q]
      get_users_by_all_query(params[:q])
    else
      render :nothing => true, :status => :bad_request
    end
  end

  private

  def get_users_by_all_query(query)
    begin
      cetera_response = user_search_client.find_all_by_query(query, :limit => 25)
    rescue RuntimeError
      return render :nothing => true, :status => :internal_server_error
    end

    render :json => cetera_response
  end

  def client
    return @client if @client

    cetera_uri = URI.parse(APP_CONFIG.cetera_host)
    @client = Cetera::Client.new(cetera_uri.host, cetera_uri.port)
  end

  def user_search_client
    @user_search_client ||= Cetera::UserSearch.new(
      client,
      CurrentDomain.cname,
      forwardable_session_cookies
    )
  end
end
