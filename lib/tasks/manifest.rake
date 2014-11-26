namespace :manifest do
  %w{staging release}.each do |environment|
    desc "Create a changelog between the last two #{environment} releases"
    task environment.to_sym do
      tags = `git tag -l #{environment}/*`.split.sort
      from_tag = ENV['FROM_TAG'] || tags[-2]
      to_tag = ENV['TO_TAG'] || tags[-1]
      puts("= FRONTEND = (from #{from_tag} to #{to_tag})")
      system "git log #{from_tag}..#{to_tag} --no-merges --date-order --reverse --shortstat --abbrev-commit"
    end
  end
end

# This is all we care about for now, no need to pull in heavyweight library
def escape(str)
  str.gsub('/', '%2F')
end

# TODO: Change http to https when we have a cert, hostname to git once
# we've completed the cutover
def gitlab_url(path=nil, project='frontend', host='http://gitlab.socrata.com')
  "#{host}/#{project}#{path}"
end

def gitlab_tag_url(from, to)
  gitlab_url("/commits/compare?from=#{escape(from)}&to=#{escape(to)}")
end

namespace :gitlab do
  %w|staging release|.each do |env|
    desc "Create a changelog between the last two #{env} releases"
    task env.to_sym do
      tags = `git tag -l #{env}/*`.split.sort
      puts gitlab_tag_url(tags[-2], tags[-1])
    end
  end
end
