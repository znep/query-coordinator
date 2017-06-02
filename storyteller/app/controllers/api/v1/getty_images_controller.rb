require 'ConnectSDK'

# An API endpoint for Getty Image searches that handles
# the OAuth2 communication, paging, and keyword searches.
class Api::V1::GettyImagesController < ApplicationController
  include UserAuthorizationHelper

  def show
    if getty_image.present? && getty_image.url.present?
      redirect_to getty_image.url
    else
      head :not_found
    end
  end

  def search
    phrase = params[:phrase]
    page = params[:page]
    page_size = params[:page_size]

    return render_bad_request('The String parameter, phrase, is required.') unless phrase.is_a?(String) && phrase.size > 0
    return render_bad_request('The Number parameter, page, is required.') unless page.is_a?(String) && page.to_i > 0
    return render_bad_request('The Number parameter, page_size, is required.') unless page_size.is_a?(String) && page_size.to_i > 0

    begin
      results = search_workflow(phrase, page: page, page_size: page_size)
      render json: results
    rescue => error
      # Uh, don't like reveal information unnecessarily.
      # Let Airbrake deal with it.
      AirbrakeNotifier.report_error(error, onmethod: 'GettyImagesController#search_workflow')
      render_bad_request('Error accessing Getty Images API.')
    end
  end

  private

  def search_workflow(phrase, page: 1, page_size: 10)
    search_images_sdk = connect_sdk.search.images
    search_images_sdk.query_params = {
      'sort_order' => 'best_match',
      'fields' => 'preview,id'
    }

    search_images_sdk.
      with_phrase(phrase).
      with_page(page).
      with_page_size(page_size).
      with_graphical_styles('photography').
      execute
  end

  def render_bad_request(message)
    render json: {error: true, message: message}, status: 400
  end

  def getty_image
    @getty_image ||= GettyImage.find_or_initialize_by(getty_id: params[:id])
  end

  def connect_sdk
    @connect_sdk ||= ConnectSdk.new(
      Rails.application.secrets.getty['api_key'],
      Rails.application.secrets.getty['api_secret']
    )
  end
end
