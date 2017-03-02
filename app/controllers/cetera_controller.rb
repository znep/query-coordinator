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

  def autocomplete
    params[:limit] = (params[:limit] || 30).to_i
    cetera_params = params.slice(:limit, :flags, :domain, :categories).symbolize_keys
    cetera_params[:domains] = Federation.federated_domain_cnames('') * ','
    cetera_params[:search_context] = CurrentDomain.cname

    if params[:q]
      begin
        cetera_response = autocomplete_search_client.find_by_title(
          params[:q], cetera_params
        )
        render :json => cetera_response
      rescue StandardError => e
        Rails.logger.error("Encountered error while getting autocomplete response from Cetera: #{e}")
        render :nothing => true, :status => :internal_server_error
      end
    else
      render :nothing => true, :status => :bad_request
    end
  end

  private

  def user_search_client
    @user_search_client ||= Cetera::Utils.user_search_client(forwardable_session_cookies)
  end

  def autocomplete_search_client
    @autocomplete_search_client ||= Cetera::Utils.autocomplete_search_client(forwardable_session_cookies)
  end
end
