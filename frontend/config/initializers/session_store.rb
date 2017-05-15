# Be sure to restart your server when you modify this file.
Rails.application.config.session_store :socrata_cookie_store, {
  :key => '_socrata_session_id',
  :core_key => ::CoreServer::Connection::COOKIE_NAME,
  :cookie_only => false,
  :session_http_only => true,
  :secret => Rails.application.secrets.session_store_secret
}

# Use the database for sessions instead of the cookie-based default,
# which shouldn't be used to store highly confidential information
# (create the session table with "rails generate session_migration")
# Rails.application.config.session_store :active_record_store
