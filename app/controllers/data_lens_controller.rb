class DataLensController < ApplicationController
  include UserAuthMethods
  include CommonMetadataMethods

  # TODO: We need to plumb our code through to support csrf token verification
  skip_before_filter :verify_authenticity_token

  helper :all # include all helpers, all the time

  hide_action :current_user, :current_user_session

  helper_method :current_user
  helper_method :current_user_session

  def initiate_region_coding
    status = :ok
    begin
      region_coding_initiator.initiate(
        params[:shapefileId],
        params[:datasetId],
        params[:column]
      )
      result = {
        :success => true
      }
    rescue => ex
      status = :internal_server_error
      result = {
        :error => true,
        :message => ex.to_s
      }
    end

    render :json => result, :status => status

  end

  def region_coding_status
    status = :ok
    begin
      success = region_coding_status_checker.complete?(params[:shapefileId], params[:datasetId])
      result = {
        :success => success
      }
      result = result.merge(:datasetMetadata => fetch_dataset_metadata(params[:datasetId])) if success
    rescue => ex
      status = :internal_server_error
      result = {
        :error => true,
        :message => ex.to_s
      }
    end

    render :json => result, :status => status
  end

  def show_mobile
    render 'mobile/datalens/show', :layout => 'layouts/mobile'
  end

  private

  def region_coding_initiator
    @region_coding_initiator ||= ::Services::DataLens::RegionCodingInitiator.new
  end

  def region_coding_status_checker
    @region_coding_status_checker ||= ::Services::DataLens::RegionCodingStatusChecker.new
  end
end
