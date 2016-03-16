namespace :manifest do
  %w[staging release].each do |environment|
    desc "Create a changelog between the last two #{environment} releases"
    task environment.to_sym, [:output_file] do |task, args|
      tags = `git tag -l #{environment}/*`.split.sort.reverse.first(10)

      to_tag = ENV['TO_TAG'] || tags[0]
      from_tag = ENV['FROM_TAG'] || tags[1]
      puts "Default comparison is #{from_tag} .. #{to_tag}"
      puts "Press <Enter> to continue, or 'N'<Enter> to choose a previous tag"
      answer = STDIN.gets.upcase.chomp

      if answer == 'N'
        puts "Select a recent tag to compare:"
        tags.each_with_index{ |tag, index| puts " #{index + 1}) #{tag}" }
        from_tag_index = STDIN.gets.chomp.to_i
        from_tag = tags[from_tag_index - 1]
      end

      puts("= FRONTEND = (from #{from_tag} to #{to_tag})")
      manifest_output = `git log --right-only --cherry-pick --no-merges --reverse #{from_tag}...#{to_tag}`


      if args.output_file.present?
        puts "Writing manifest file to... #{File.expand_path(args.output_file)}"
        File.open(args.output_file, 'w') do |f|
          f << manifest_output
        end
      else
        puts manifest_output
      end
    end
  end

  # output all commit messages that mention a Jira id or pull request id.  this is useful for prepping the Test Matrix for test pods
  # this step gets ran after first running ‘FROM_TAG=<tag> TO_TAG=<tag> rake manifest:release[manifest.txt]’
  namespace :commits do
    desc 'Output a distinct list of commit messages that mention a Jira ticket'
    task :distinct_with_jira, [:manifest_file] do |task, args|
      fail 'Path to manifest.txt must be provided' if args.manifest_file.blank?

      puts
      get_commits_with_jira(args.manifest_file).map(&:values).each(&method(:puts))
      puts
    end

    desc 'Output a distinct list of commit messages that lack a Jira ticket mention'
    task :distinct_without_jira, [:manifest_file] do |task, args|
      fail 'Path to manifest.txt must be provided' if args.manifest_file.blank?

      puts
      get_commits_without_jira(args.manifest_file).each(&method(:puts))
      puts
    end

    desc 'Output a link to jira with all the issues in the manifest'
    task :jira_query, [:manifest_file] do |task, args|
      commit_list = get_commits_with_jira(args.manifest_file)
      jira_ticket_numbers = commit_list.map{|commit| commit.keys.first.strip.match(jira_ticket_regex) }.uniq
      jira_query = "id in (#{jira_ticket_numbers.join(', ')})"

      puts URI("https://socrata.atlassian.net/issues/?jql=#{URI.encode(jira_query)}").to_s
    end
  end

  desc 'Outputs a distinct list of commit messages that mention a jira ticket'
  task :commits, :manifest_file do |task, args|
    Rake::Task['manifest:commits:distinct_with_jira'].invoke(args.manifest_file)
  end

  desc 'Outputs a distinct list of commit messages that lack an Jira ticket mention'
  task :commits, :manifest_file do |task, args|
    Rake::Task['manifest:commits:distinct_without_jira'].invoke(args.manifest_file)
  end


  desc 'Generates useful information for the current release'
  task :release_info do
    manifest_file_path = File.expand_path("manifest_#{Time.now.strftime('%Y%m%d-%H%M%S')}.txt")
    puts
    Rake::Task['manifest:release'].invoke(manifest_file_path)
    puts

    copy_cmd = "cat #{manifest_file_path} | pbcopy"
    puts 'Copying the manifest file contents to your clipboard...'
    puts
    puts "\t`#{copy_cmd}`"

    system copy_cmd

    puts
    puts 'Commits with JIRA tickets:'
    Rake::Task['manifest:commits:distinct_with_jira'].invoke(manifest_file_path)

    puts
    puts 'Commits without JIRA tickets:'
    Rake::Task['manifest:commits:distinct_without_jira'].invoke(manifest_file_path)


    puts 'Link to Jira query for current issues...'
    puts
    Rake::Task['manifest:commits:jira_query'].invoke(manifest_file_path)
  end
end

namespace :gitlab do
  %w[staging release].each do |env|
    desc "Create a changelog between the last two #{env} releases"
    task env.to_sym do
      tags = `git tag -l #{env}/*`.split.sort
      puts gitlab_tag_url(tags[-2], tags[-1])
    end
  end
end

def jira_ticket_regex
  /[A-Z]+\-\d+/ # EN-12345
end

def ticket_regex
  /^\s*\w*\s*#{jira_ticket_regex}/
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

def get_commits_with_jira(manifest_file)
  File.open(manifest_file).grep(ticket_regex).inject([]) do |list, line|
    id = line.match(ticket_regex).to_s
    commit = line.strip

    list << { id => commit }
    list.uniq.sort_by(&:keys)
  end
end

def get_commits_without_jira(manifest_file)
  commits_without_jira = []
  commits = File.open(manifest_file).read.split(/^commit /)
  commits.each do |commit|
    unless commit.match(ticket_regex) || commit == ""
      sha = commit[0..6] || ''
      author = commit.match(/^Author:(.*)</)[1].strip || ''
      first_line_of_commit = commit.match(/^Date:.*$\n\n^(.*)$/)[1].strip || ''
      commits_without_jira.push("#{author} - #{sha} - #{first_line_of_commit}")
    end
  end
  commits_without_jira.sort
end
