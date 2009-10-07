# Note that we're using ActionController::Base instead of ApplicationController
# We don't care about authentication or various hooks here.
class MicrosoftOfficeController < ActionController::Base

  # Microsoft Office apps attempting to open a webpage do some weird discovery
  # protocol to figure out if they can edit through WebDAV or Sharepoint etc.
  # To us, it's really just a request to a random URL with the HTTP OPTIONS
  # verb instead of a normal GET/POST. We route all OPTIONS requests here.
  def options_for_mopd
    render :nothing => true, :status => :ok
  end
end
