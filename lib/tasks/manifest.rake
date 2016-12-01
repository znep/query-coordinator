namespace :manifest do
  %w[staging release].each do |environment|
    desc "Create a changelog between the last two #{environment} releases"
    task environment.to_sym, [:output_file] do |task, args|
      tags = `git tag -l #{environment}/*`.split.sort.reverse.first((ENV['RELEASE_TAGS'] || 10).to_i)

      # Find your tags to compare
      to_tag = ENV['TO_TAG'] || tags[0]
      from_tag = ENV['FROM_TAG'] || tags[1]
      puts "Default comparison is #{from_tag} .. #{to_tag}"
      
      cmd = ARGV.last
      task cmd.to_sym do 
        if cmd.nil? 
          cmd = ''
        end
      end

      if cmd != 'auto'
        puts "Press <Enter> to continue, or 'n' to choose a previous tag"
        answer = STDIN.gets.downcase.chomp
      end

      # Override the default compare if requested
      if answer == 'n'
        puts "Select a recent tag to compare:"
        tags.each_with_index{ |tag, index| puts " #{index + 1}) #{tag}" }
        from_tag_index = STDIN.gets.chomp.to_i
        from_tag = tags[from_tag_index - 1]
      end

      # Generate the manifest info
      manifest_output = ("= FRONTEND = (from #{from_tag} to #{to_tag})")
      manifest_output << "\n\nGit diff: https://github.com/socrata/frontend/compare/#{from_tag}...#{to_tag}"

      git_log_output = `git log --no-color --right-only --cherry-pick --no-merges --reverse #{from_tag}...#{to_tag}`

      manifest_output << "\n\nCommits with JIRA tickets:\n"
      manifest_output << get_commits_with_jira(git_log_output).map(&:values).join("\n")

      commits_without_jira_tickets = get_commits_without_jira(git_log_output).join("\n")
      if commits_without_jira_tickets.present?
        manifest_output << "\n\nCommits without JIRA tickets:\n"
        manifest_output << commits_without_jira_tickets
      end

      puts manifest_output
      puts

      puts 'Link to Jira query for current issues...'
      Rake::Task['manifest:commits:jira_query'].invoke(git_log_output)

      # Write the manifest to a file
      if args.output_file.present?
        puts "\nWriting manifest file to... #{File.expand_path(args.output_file)}"
        File.open(args.output_file, 'w') do |f|
          f << manifest_output
          f << "\n\n"
          f << git_log_output
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
    task :jira_query, [:git_log_output] do |task, args|
      commit_list = get_commits_with_jira(args.git_log_output)
      jira_ticket_numbers = commit_list.map{|commit| commit.keys.first.strip.match(jira_ticket_regex) }.uniq
      jira_query = "id in (#{jira_ticket_numbers.join(', ')})"

      puts URI("https://socrata.atlassian.net/issues/?jql=#{URI.encode(jira_query)}").to_s
    end
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
    puts "\t#{copy_cmd}"

    system(copy_cmd)
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

def get_commits_with_jira(git_log_output)
  unless git_log_output.nil?
    git_log_output.lines.grep(ticket_regex).inject([]) do |list, line|
      id = line.match(ticket_regex).to_s.strip
      commit = line.strip

      list << { id => commit.gsub(id, "https://socrata.atlassian.net/browse/#{id}") }
      list.uniq.sort_by(&:keys)
    end
  else
    []
  end
end

def get_commits_without_jira(git_log_output)
  commits_without_jira = []
  commits = git_log_output.split(/^commit /)
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
