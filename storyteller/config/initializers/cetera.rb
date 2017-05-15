# The base Cetera client is invariant, but sub-clients (e.g. for user search)
# need request-specific parameters for current domain and cookies.

cetera_uri = URI.parse(Rails.application.config.cetera_service_uri)

Rails.application.config.cetera_client = Cetera::Client.new(cetera_uri.host, cetera_uri.port)
