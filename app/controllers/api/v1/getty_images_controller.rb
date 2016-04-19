require "ConnectSdk"

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

    return render_bad_request unless phrase.is_a?(String) && phrase.size > 0
    return render_bad_request unless page && page.is_a?(String) && page.to_i > 0
    return render_bad_request unless page && page_size.is_a?(String) && page_size.to_i > 0

    begin
      results = connect_sdk.
        search.images.
        with_phrase(phrase).
        with_page(page).
        with_page_size(page_size).
        execute

      render json: results
    rescue => error
      render_bad_request
    end
  end

  private

  def render_bad_request
    render nothing: true, status: 400
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
