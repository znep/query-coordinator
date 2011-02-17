class OpenSearchController < ApplicationController
  skip_before_filter :require_user

  def show
    render :layout => false, :content_type => 'text/xml'
  end
end
