class RemotePartialsController < ApplicationController
  skip_before_filter :require_user

  def templates
    local_args = params.reject {|k, v| k == 'controller' || k == 'action' || k == 'id'}
    render :partial => 'templates/' + params[:id], :locals => local_args rescue render :nothing => true, :status => :not_found
  end

  def modals
    local_args = params.reject {|k, v| k == 'controller' || k == 'action' || k == 'id'}
    render :partial => 'modals/' + params[:id], :locals => local_args rescue render :nothing => true, :status => :not_found
  end
end
