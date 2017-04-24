namespace :manifest do
  %w[ staging release ].each do |environment|
    desc "Create a changelog between the last two #{environment} releases"
    task environment.to_sym, [:output_file, :auto] do |_, args|
      tags = `git tag -l frontend-#{environment}/*`.split.sort.reverse.first((ENV['RELEASE_TAGS'] || 10).to_i)

      # Find your tags to compare
      to_tag = ENV['TO_TAG'] || tags[0]
      from_tag = ENV['FROM_TAG'] || tags[1]

      if args.auto.present? && args.auto == 'true'
        puts ">>>>>>>>>>>>>>>>>>>>>>>>>>>>EMAIL BEGIN<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<\n\n"
      else
        puts "Default comparison is #{from_tag} .. #{to_tag}"
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
      manifest_output = ("\n\n= FRONTEND = (from #{from_tag} to #{to_tag})")
      manifest_output << "\n\nGit diff: https://github.com/socrata/frontend/compare/#{from_tag}...#{to_tag}"

      manifest_output << "\nDiff Command: `git log --no-color --right-only --cherry-pick --reverse #{from_tag}...#{to_tag}`\n"

      # We put JIRA ticket references in commit subjects.
      # Some place ticket references in each normal commit.
      # Some place ticket references in the merge commit only.
      # We search all commit subjects for ticket references (merge and normal).
      # We allow merge commits without ticket references but
      # warn for all normal commits without ticket references.
      # We also need to ignore changes in storyteller directories.

      # TODO: Remove this list once all intended repositories are merged into platform-ui.
      ignore_list = %w[ 069316e2ea2be425925863b58c3653da54d50a84 ]
      git_log_flags = '--no-color --right-only --cherry-pick --reverse --no-merges'
      git_log_revision_range = "#{from_tag}...#{to_tag}"
      # NOTE: Excluding storyteller via -- . ':(exclude)storyteller' also ends up ignoring empty merge
      # commits (because of the '.' that is required for excludes to work). If you need to get merges,
      # pass --full-history (though note this will end up including non-frontend merges).
      git_log_query = "^#{ignore_list.join(' ^')} -- . ':(exclude)storyteller'"
      git_log_cmd = "git log #{git_log_flags} #{git_log_revision_range} #{git_log_query}"

      git_log_output = `#{git_log_cmd}`

      manifest_output << "\n\nLink to Jira query for current issues...\n"
      manifest_output << jira_query(git_log_output)
      manifest_output << "\n\n----Commits with JIRA tickets:----\n"
      manifest_output << get_commits_with_jira(git_log_output).map(&:values).sort.join("\n")

      commits_without_jira_tickets = get_commits_without_jira(git_log_output).join("\n")
      if commits_without_jira_tickets.present?
        manifest_output << "\n\n----Commits without JIRA tickets:----\n"
        manifest_output << commits_without_jira_tickets
      end

      manifest_output << "\n\n----Git log:----\n" << git_log_output
      puts manifest_output
      puts "\n\n>>>>>>>>>>>>>>>>>>>>>>>>>>EMAIL END<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<\n" if (args.auto.present? && args.auto == 'true')
      puts

     # Write the manifest to a file
      if args.output_file.present?
        puts "\nWriting manifest file to... #{File.expand_path(args.output_file)}"
        File.open(args.output_file, 'w') do |f|
          f << manifest_output
        end
      else
        puts manifest_output
      end
    end
  end

  # output all commit messages that mention a Jira id or pull request id.
  # this is useful for prepping the Test Matrix for test pods
  # this step gets ran after first running 'FROM_TAG=<tag> TO_TAG=<tag> rake manifest:release[manifest.txt]'
  namespace :commits do
    desc 'Output a distinct list of commit messages that mention a Jira ticket'
    task :distinct_with_jira, [:manifest_file] do |_, args|
      fail 'Path to manifest.txt must be provided' if args.manifest_file.blank?

      puts
      get_commits_with_jira(args.manifest_file)
        .map(&:values).each(&method(:puts))
      puts
    end

    desc 'Output a distinct list of commit messages that lack a Jira ticket mention'
    task :distinct_without_jira, [:manifest_file] do |_, args|
      fail 'Path to manifest.txt must be provided' if args.manifest_file.blank?

      puts
      get_commits_without_jira(args.manifest_file).each(&method(:puts))
      puts
    end
  end

  desc 'Generates useful information for the current release'
  task :release_info, [:auto, :manifest_file] do |_, args|
    args.with_defaults(:auto => false, :manifest_file => nil)

    manifest_file_path = args[:manifest_file] ?
      File.expand_path(args[:manifest_file]) :
      File.expand_path("manifest_#{Time.now.strftime('%Y%m%d-%H%M%S')}.txt")

    puts
    Rake::Task['manifest:release'].invoke(manifest_file_path, args[:auto])
    puts

    copy_cmd = "cat #{manifest_file_path} | pbcopy"
    puts 'Copying the manifest file contents to your clipboard...'
    puts
    puts "\t#{copy_cmd}"

    system(copy_cmd)
  end
end

def jira_query(git_log_output)
  commit_list = get_commits_with_jira(git_log_output)
  jira_ticket_numbers = commit_list.map { |commit| commit.keys.first.strip.match(jira_ticket_regex) }.uniq
  jira_query = "id in (#{jira_ticket_numbers.join(', ')}) "

  URI("https://socrata.atlassian.net/issues/?jql=#{URI.encode(jira_query)}").to_s
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

def get_commits_with_jira(git_log_output)
  if git_log_output.nil?
    []
  else
    git_log_output.lines.grep(ticket_regex).inject([]) do |list, line|
      id = line.match(ticket_regex).to_s.strip
      commit = line.strip
      atlassian = 'http://socrata.atlassian.net/browse/'
      list << { id => commit.gsub(id, "#{atlassian}#{id}") }
      list.uniq.sort_by(&:keys)
    end
  end
end

def get_commits_without_jira(git_log_output)
  commits_without_jira = []
  commits = git_log_output.split(/^commit /)
  commits.each do |commit|
    unless commit.match(ticket_regex) || commit == ''
      sha = commit[0..6] || ''
      author = commit.match(/^Author:(.*)</)[1].strip || ''
      first_line_of_commit = commit.match(/^Date:.*$\n\n^(.*)$/)[1].strip || ''
      commits_without_jira.push("#{author} - #{sha} - #{first_line_of_commit}")
    end
  end
  commits_without_jira.sort
end
