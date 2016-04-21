class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  def localhost?(host = nil)
    %w(local.dev localhost).include?(host.to_s.downcase) || ENV['LOCALHOST'].to_s.downcase == 'true'
  end
end
