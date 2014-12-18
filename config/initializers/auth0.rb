Rails.application.config.middleware.use OmniAuth::Builder do
  if AUTH0_CONFIGURED
    provider(
      :auth0,
      AUTH0_ID,
      AUTH0_SECRET,
      AUTH0_URI,
      callback_path: "/auth/auth0/callback"
    )
  end
end