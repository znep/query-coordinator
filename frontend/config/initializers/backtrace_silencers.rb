# Be sure to restart your server when you modify this file.

# You can add backtrace silencers for libraries that you're using but don't wish to see in your backtraces.
Rails.backtrace_cleaner.add_silencer { |line| line =~ /rails_patches/ }
Rails.backtrace_cleaner.add_silencer { |line| line =~ /core_server/ }
Rails.backtrace_cleaner.add_silencer { |line| line =~ /socrata_cookie_store/ }
Rails.backtrace_cleaner.add_silencer { |line| line =~ /health_check/ }
Rails.backtrace_cleaner.add_silencer { |line| line =~ /locale_middleware/ }
Rails.backtrace_cleaner.add_silencer { |line| line =~ /current_domain/ }
Rails.backtrace_cleaner.add_silencer { |line| line =~ /log_referer/ }

# You can also remove all the silencers if you're trying to debug a problem that might stem from framework code.
# Rails.backtrace_cleaner.remove_silencers!
