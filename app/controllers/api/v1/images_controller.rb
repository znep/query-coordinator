require "ConnectSdk"

# An API endpoint for Getty Image searches that handles
# the OAuth2 communication, paging, and keyword searches.
class Api::V1::ImagesController < ApplicationController
  def download
    asset_id = params[:id]

    return render_bad_request unless asset_id.is_a?(String)

    begin
      result = connect_sdk.
        download().
        with_id(asset_id).
        execute()

      render json: {'uri' => result}
    rescue => error
      render_bad_request
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
        search().images().
        with_phrase(phrase).
        with_page(page).
        with_page_size(page_size).
        execute()

      render json: results
    rescue => error
      render_bad_request
    end
  end

  def render_bad_request
    render nothing: true, status: 400
  end

  def connect_sdk
    @connect_sdk ||= ConnectSdk.new(
      Rails.application.secrets.getty['api_key'],
      Rails.application.secrets.getty['api_secret']
    )
  end

  def download_request
    @download_request ||= DownloadRequest.new(
      Rails.application.secrets.getty['api_key'],
      Rails.application.secrets.getty['api_secret']
    )
  end
end
