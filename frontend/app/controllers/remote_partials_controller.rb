class RemotePartialsController < ApplicationController
  skip_before_filter :require_user

  # NOTE: It is not safe to pass request parameters directly into the partial as locals, as of
  # 2018/01/15 rails versions prior to 5.1.0 have a security hole that allows code injection if you
  # allow arbitrary keys.
  def templates
    render :partial => 'templates/' + params[:id] rescue render :nothing => true, :status => :not_found
  end

  def modals
    render :partial => 'modals/' + params[:id] rescue render :nothing => true, :status => :not_found
  end
end
