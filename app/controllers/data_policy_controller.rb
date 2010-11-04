class DataPolicyController < ApplicationController
  skip_before_filter :require_user

  def index
    if !CurrentDomain.cname.match /seattle/
      render_404
    end
  end
end
