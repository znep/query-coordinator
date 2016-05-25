# This is used to create an opaque session id for metrics tracking purposes
# that is derived from, but not fungible with, the session id used by the application.
# It is used in ApplicationHelper::safe_session_id and stored in the blist object.
Frontend::Application.config.session_salt = ENV['SESSION_SALT'] || APP_CONFIG.session_salt
