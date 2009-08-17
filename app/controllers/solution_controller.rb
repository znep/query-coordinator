class SolutionController < ApplicationController
  include StaticContent
  
  def show
    if params[:page] == "sdp-video" || params[:page] == "sdn-video"
      render :action => params[:page], :layout => false
    else
      render :action => params[:page]
    end
  end
 
end
