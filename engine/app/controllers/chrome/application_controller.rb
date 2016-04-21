module Chrome
  class ApplicationController < ActionController::Base
    protect_from_forgery with: :exception

    def localhost?(host = nil)
      %w(local.dev localhost).include?(host.to_s.downcase) || ENV['LOCALHOST'].to_s.downcase == 'true'
    end
  end
end
