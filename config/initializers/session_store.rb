# Be sure to restart your server when you modify this file.

Frontend::Application.config.session_store :blist_cookie_store, {
  :key => '_blist_session_id',
  :cookie_only => false,
  :session_http_only => true,
  :secret      => ')c)]? ?+7?BpJ4qbKi8@-D)T`@]])x'
}

# Use the database for sessions instead of the cookie-based default,
# which shouldn't be used to store highly confidential information
# (create the session table with "rails generate session_migration")
# Frontend::Application.config.session_store :active_record_store
