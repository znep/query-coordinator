class RedirectsController < ApplicationController
  skip_before_filter :require_user

  def redirect
    MetricQueue.instance.push_metric(params[:id], 'files-downloaded')
    redirect_to(CGI.unescape(params[:to]))
  end
end
