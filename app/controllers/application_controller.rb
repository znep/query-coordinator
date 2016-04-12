class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  def localhost?
    request.host == 'localhost' || !!ENV['LOCALHOST'].to_s == 'true'
  end
end
