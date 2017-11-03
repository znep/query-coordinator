JIRA_TICKET_REGEX = /EN\W\d+/i # EN-12345, en 12345

namespace :manifest do
  # Entry point, which sets up the file and calls manifest:release
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
    puts "\t#{copy_cmd}"

    system(copy_cmd)
  end

  # Generates the actual manifest
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

      # Manifest Output Begins
      manifest_output = ("\n\n------- Frontend Manifest")
      manifest_output << "\nGit diff: https://github.com/socrata/frontend/compare/#{from_tag}...#{to_tag}\n\n"

      # Shared git params
      git_log_flags = '--no-color --right-only --cherry-pick --reverse --no-merges'
      git_log_revision_range = "#{from_tag}...#{to_tag}"

      # Story time!
      # `git log -- :/` is a way to log the full repository from a subdirectory. The exclude command
      # requires either `:/` for repo root or `.` for current directory, and we want to be sure changes to
      # the Rakefile, bin, .ruby-version, /dev-server etc show up somewhere, so we include them in the
      # frontend manifest.
      #
      # NOTE: Excluding storyteller via -- :/ ':(exclude)../storyteller' also ends up ignoring empty merge
      # commits (because the ':/' is required for excludes to work). If you need to get merges,
      # pass --full-history (though note this will end up including non-frontend merges).
      frontend_log_query = "-- :/ ':(exclude)../storyteller' ':(exclude)../common'"
      frontend_log_cmd = "git log #{git_log_flags} #{git_log_revision_range} #{frontend_log_query}"
      frontend_log_output = `#{frontend_log_cmd}`

      common_log_query = "-- '../common/*'"
      common_log_cmd = "git log #{git_log_flags} #{git_log_revision_range} #{common_log_query}"
      common_log_output = `#{common_log_cmd}`

      common_summary = jira_summary(common_log_output, 'Common Tickets:')
      frontend_summary = jira_summary(frontend_log_output, 'Frontend Tickets:')
      manifest_output << "#{frontend_summary}\n\n#{common_summary}"

      commits_without_jira_tickets = get_commits_without_jira("#{frontend_log_output} #{common_log_output}").join("\n")
      if commits_without_jira_tickets.present?
        manifest_output << "\n\n------- Commits without JIRA tickets:\n"
        manifest_output << commits_without_jira_tickets
      end

      # because frontend and common git log output have duplicate commits, just run another git log for
      # this section, with everything but storyteller
      manifest_output << "\n\n\n------- Git log\n\n" << `git log #{git_log_flags} #{git_log_revision_range} -- :/ ':(exclude)../storyteller'`
      puts manifest_output
      puts "\n\n>>>>>>>>>>>>>>>>>>>>>>>>>>EMAIL END<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<\n\n" if (args.auto.present? && args.auto == 'true')

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
end

def jira_summary(git_log_output, section_header)
  commits_summary = "------- #{section_header}\n"
  commits_summary << jira_query( jira_tickets(git_log_output) )
end

def jira_query(jira_tickets)
  jira_query = "id in (#{jira_tickets.join(', ')}) "
  URI("https://socrata.atlassian.net/issues/?jql=#{URI.encode(jira_query)}").to_s
end

# This is all we care about for now, no need to pull in heavyweight library
def escape(str)
  str.gsub('/', '%2F')
end

# Returns an array of jira tickets ['EN-123', 'EN-456', ...]
def jira_tickets(git_log_output)
  tickets = git_log_output.lines.map { |line| line.scan(JIRA_TICKET_REGEX) }
  tickets.flatten!.uniq! # get rid of [] entries for non-matching lines
  tickets.map { |ticket| ticket.gsub!(/EN\W/i, 'EN-') } # "en 14590" => "EN-14590"
end

def get_commits_without_jira(git_log_output)
  commits_without_jira = []
  commits = git_log_output.split(/^commit /)
  commits.each do |commit|
    unless commit.match(JIRA_TICKET_REGEX) || commit == ''
      sha = commit[0..6] || ''
      author = commit.match(/^Author:(.*)</)[1].strip || ''
      first_line_of_commit = commit.match(/^Date:.*$\n\n^(.*)$/)[1].strip || ''
      commits_without_jira.push("#{author} - #{sha} - #{first_line_of_commit}")
    end
  end
  commits_without_jira.sort
end
