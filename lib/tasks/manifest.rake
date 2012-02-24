namespace :manifest do
  %w{staging release}.each do |environment|
    desc "Create a changelog between the last two #{environment} releases"
    task environment.to_sym do
      tags = `git tag -l #{environment}/*`.split.sort
      system "git log #{tags[-2]}..#{tags[-1]} --no-merges --date-order --reverse --shortstat --abbrev-commit"
    end
  end
end
