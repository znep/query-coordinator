class ApprovalsController < ApplicationController
  def show
    if(ENV["RAILS_ENV"] == "production")
      return redirect_to('/home')
    end
  end
end
