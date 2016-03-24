# Be sure to restart your server when you modify this file.
Rails.application.config.session_store :socrata_cookie_store, {
  :key => '_socrata_session_id',
  :core_key => ::CoreServer::Connection.cookie_name,
  :cookie_only => false,
  :session_http_only => true,
  :secret      => ')c)]? ?+7?BpJ4qbKi8@-D)T`@]])x'
}

# Use the database for sessions instead of the cookie-based default,
# which shouldn't be used to store highly confidential information
# (create the session table with "rails generate session_migration")
# Rails.application.config.session_store :active_record_store
