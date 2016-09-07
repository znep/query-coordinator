require 'cetera'

class CeteraController < ApplicationController
  include CommonSocrataMethods

  skip_before_filter :require_user

  def fuzzy_user_search
    params[:limit] = (params[:limit] || 25).to_i
    cetera_params = params.slice(:limit, :flags, :domain).symbolize_keys
    if params[:q]
      begin
        cetera_response = user_search_client.find_all_by_query(params[:q], cetera_params)
        users = Cetera::Results::UserSearchResult.new(cetera_response).results
        render :json => users.map(&:data)
      rescue RuntimeError
        return render :nothing => true, :status => :internal_server_error
      end
    else
      render :nothing => true, :status => :bad_request
    end
  end

  private

  def user_search_client
    @user_search_client ||= Cetera::Utils.user_search_client(forwardable_session_cookies)
  end
end