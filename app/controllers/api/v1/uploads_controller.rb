# Provides an endpoint to create and return a signed URL to upload an asset.
# The client would then PUT a file to this URL which will then be passed into
# the Document model to attach the file.
class Api::V1::UploadsController < ApplicationController

  def create
    @pending_upload = PendingUpload.new(create_params[:filename])
    render json: @pending_upload, status: :created
  end

  private

  def create_params
    params.require(:upload).permit(:filename)
  end

end
