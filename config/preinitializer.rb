begin
  require File.expand_path('../../.bundle/environment', __FILE__)
rescue LoadError
  # Fallback on doing the resolve at runtime
  require "rubygems"
  require "bundler"
  major, minor, rev = Bundler::VERSION.split(".").map { |v| v.to_i }
  if minor < 9 || rev <= 5 
    raise RuntimeError, "Bundler incompatible.\n" +
      "Your bundler version is incompatible with Rails 2.3 and an unlocked bundle.\n" +
      "Run `gem install bundler` to upgrade or `bundle lock` to lock."
  else
    Bundler.setup
  end
end
