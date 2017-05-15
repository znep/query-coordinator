class UserSessionProvider
  def self.klass(*args)
    if FeatureFlags.derive[:core_managed_session]
      CoreManagedUserSession
    else
      UserSession
    end
  end
end
