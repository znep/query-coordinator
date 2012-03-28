namespace :tag do
  task :check_origin do
    unless system('git remote show origin -n > /dev/null')
      fail "Unable to detect remote origin. Is your git repository set up to push to a remote repository?"
    end
  end

  desc "Follow tags for unreachable objects from origin"
  task :follow => :check_origin do
    system 'git config remote.origin.tagopt --tags'
  end

  %w{experimental staging release}.each do |environment|
    desc "Tag the current SHA as a #{environment} candidate"
    task environment.to_sym => :check_origin do
      timestamp = Time.now.strftime("%Y/%m/%d/%H%M")
      system "git tag -a #{environment}/#{timestamp}"
      system "git push origin tag #{environment}/#{timestamp}"
    end
  end
end
