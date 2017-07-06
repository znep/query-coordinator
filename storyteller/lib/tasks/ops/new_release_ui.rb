require 'mrdialog'
require 'clipboard'
require 'git'
require 'rake'
require 'semver'
require 'yaml'

require_relative 'jenkins'

class NewReleaseUi
  MAX_MANIFEST_COMMITS = 1000 # This must be provided to the git library.
  MANIFEST_FILE = 'manifest.txt'
  RELEASE_BRANCH_NAME = 'storyteller/release'
  ACTUALLY_PUSH_TAG = true # Set this to false if you're debugging

  attr_reader :dialog, :git, :new_release_commit, :new_semver, :jenkins_build_number, :last_released_commit_sha, :current_master_commit, :merge_instead_of_reset

  def initialize
    @dialog = MRDialog.new
    @git = open_git_repo
    @merge_instead_of_reset = false
  end

  def open
    begin
      Rake.application['ops:jenkins:check_creds'].invoke
      Rake.application['ops:check_vpn'].invoke
    rescue => e
      dialog.msgbox(e.message)
      return
    end

    return unless git_clean?

    dialog.infobox('Fetching origin...', 3, 40)
    git.fetch('origin')

    # git.object('branch') returns a reference, not a sha. This means
    # if the branch moves, so will that reference.
    # Grab the sha to have an immutable reference, since we need to use
    # last_released_commit_sha even after we push to origin.
    @last_released_commit_sha = git.object("origin/#{RELEASE_BRANCH_NAME}").sha
    @current_master_commit = git.object('origin/master')
    @new_release_commit = input_release_commit

    return unless @new_release_commit && user_approves_manifest?

    @new_semver = input_semver

    return unless @new_semver && user_approves_task_summary?

    make_the_release!

    provide_manifest_and_instructions_to_user

    @jenkins_build_number = wait_for_jenkins_build

    @docker_tag = find_docker_tag(@jenkins_build_number)

    puts("\nComplete.\nDocker tag is #{@docker_tag}\nManifest written to #{MANIFEST_FILE}")
  end

  private

  def make_the_release!
    # 1- Reset or merge local release to new_release_commit
    dialog.infobox('Preparing release branch...')
    git.checkout(RELEASE_BRANCH_NAME)

    if merge_instead_of_reset
      git.reset_hard("origin/#{RELEASE_BRANCH_NAME}")
      if current_master_commit.sha == new_release_commit.sha
        git.merge('origin/master')
      else
        dialog.msgbox('We only support merging origin/master right now.
Either something went wrong with the script, or origin/master moved while we were working.
Aborted.'
        )
        return
      end
    else
      git.reset_hard(new_release_commit)
    end

    # 2- Commit semver
    dialog.infobox('Committing semver...')
    new_semver.save(SemVer.find_file)
    git.add(SemVer.find_file)
    git.commit("Bump version #{new_semver}")

    # 3- Apply tag.
    dialog.infobox('Tagging release...')
    tag_name = "storyteller-#{new_semver.to_s.tr('v', '')}"
    git.add_tag(tag_name)

    # 4- Push origin
    dialog.infobox("Pushing to origin/#{RELEASE_BRANCH_NAME}...")
    git.push('origin', RELEASE_BRANCH_NAME, tags: ACTUALLY_PUSH_TAG, force: true)

    # 5- Merge release back to master
    dialog.infobox("Merging #{RELEASE_BRANCH_NAME} back to master...")
    git.checkout('master')
    git.pull('origin', 'master')
    if new_semver > SemVer.find
      git.merge("origin/#{RELEASE_BRANCH_NAME}")
      git.push('origin', 'master')
    else
      dialog.msgbox("Did not merge #{RELEASE_BRANCH_NAME} back to master; compare semver on each branch.")
    end
    git.checkout(RELEASE_BRANCH_NAME)
  end

  def wait_for_jenkins_build
    build_number = nil
    dialog.infobox('Waiting for Jenkins build to complete successfully...', 4, 50)
    loop do
      begin
        build_number = Jenkins.find_storyteller_release_build(git.object(RELEASE_BRANCH_NAME).sha)
        break if build_number
        sleep 15
      rescue
        retry
      end
    end

    dialog.msgbox("Build complete (Build #{build_number})")

    build_number
  end

  def find_docker_tag(release_build_number)
    main_build_number = Jenkins.find_downstream_storyteller_build(release_build_number)
    Jenkins.get_docker_tag_from_build(main_build_number)
  end

  def input_release_commit
    release_type_menu_items = [
      [ 'master', "Merge origin/master into origin/#{RELEASE_BRANCH_NAME}" ],
      [ 'custom', "Reset origin/#{RELEASE_BRANCH_NAME} to an arbitrary commit" ]
    ]

    release_type = dialog.menu('Create a release from...', release_type_menu_items, 20, 80)

    return unless release_type

    case release_type
      when 'master'
        if is_mergeable_into_release?(current_master_commit)
          @merge_instead_of_reset = true
          current_master_commit
        else
          @merge_instead_of_reset = false
          if dialog.yesno(
            "WARNING: Master will not merge cleanly into #{RELEASE_BRANCH_NAME}. Do a hard reset instead?"
          )
            current_master_commit
          else
            nil
          end
        end
      when 'custom'
        @merge_instead_of_reset = false
        create_custom_release_commit
    end
  end

  def is_mergeable_into_release?(commit)
    is_ok = true

    dialog.infobox("Checking mergeability into origin/#{RELEASE_BRANCH_NAME}...")
    git.checkout(RELEASE_BRANCH_NAME)
    git.reset_hard("origin/#{RELEASE_BRANCH_NAME}")
    begin
      git.merge(commit)
    rescue
      is_ok = false
    ensure
      git.reset_hard("origin/#{RELEASE_BRANCH_NAME}")
    end

    is_ok
  end

  def input_semver
    with_major_bump = current_release_semver.clone.tap { |v| v.major += 1; v.minor = 0; v.patch = 0 }
    with_minor_bump = current_release_semver.clone.tap { |v| v.minor += 1; v.patch = 0 }
    with_patch_bump = current_release_semver.clone.tap { |v| v.patch += 1 }


    menu_items = [
      [ 'minor', "Minor release (#{with_minor_bump})" ],
      [ 'patch', "Patch release (#{with_patch_bump})" ],
      [ 'major', "Major release (#{with_major_bump})" ]
    ]

    version_bump_type = dialog.menu(
      "What kind of release is this?\nCurrent version: #{current_release_semver}",
      menu_items
    )

    case version_bump_type
      when 'major'
        with_major_bump
      when 'minor'
        with_minor_bump
      when 'patch'
        with_patch_bump
    end
  end

  def user_approves_manifest?
    # Note that we're removing backticks and double quotes herehere.
    # If there are backticks in the commit messages, sh will try to run the text inside the backticks.
    # If there are double quotes, MRDialog will construct a bad command and fail.
    # Can we get rid of MRDialog?
    dialog.yesno("----------
Here is the manifest. Does this look good? Scroll with j/k/pgup/pgdown.
You'll have an opportunity to copy this to the clipboard momentarily.
----------

#{manifest_text.tr('`', "'").tr('"', "'")}")
  end

  def user_approves_task_summary?
    merge_or_reset = if merge_instead_of_reset
      'Merge master into release'
    else
      "Reset release to: #{new_release_commit.sha}\n#{new_release_commit.message}"
    end

    dialog.yesno("Here's what will be done:
* Version bump from #{current_release_semver} to #{new_semver}
* #{merge_or_reset}

Proceed?
")
  end

  # Generate a manifest between last_released_commit_sha and new_release_commit.
  # If new_semver is set, a header will be generated mentioning the new
  # version. Example header:
  #   Storyteller v1.0.1 Manifest (old version: v1.0.0).
  def manifest_text
    storyteller_gblob = git.gblob('../storyteller')
    common_gblob = git.gblob('../common')

    storyteller_commits = get_commits_for(storyteller_gblob)
    common_commits = get_commits_for(common_gblob)

    storyteller_summary = jira_summary(storyteller_commits, 'Storyteller Tickets:')
    common_summary = jira_summary(common_commits, 'Common Tickets:')

    if new_semver
      "Storyteller #{new_semver} manifest (old version: #{current_release_semver})\n\n#{storyteller_summary}\n\n#{common_summary}"
    else
      "#{storyteller_summary}\n\n#{common_summary}"
    end
  end

  def provide_manifest_and_instructions_to_user
    File.open(MANIFEST_FILE, 'w') { |f| f.write(manifest_text) }

    copy_manifest_to_clipboard if dialog.yesno("Manifest written to #{MANIFEST_FILE}.
Please send the manifest to:

  release-manifests-l@socrata.com

Copy manifest to clipboard?")
  end


  def create_custom_release_commit
    dialog.infobox('Checking out release...')
    git.checkout(RELEASE_BRANCH_NAME)
    git.reset_hard("origin/#{RELEASE_BRANCH_NAME}")

    dialog.msgbox("I've checked out the #{RELEASE_BRANCH_NAME} branch for you.
In another terminal, please get this branch into what you intend to release.
Don't worry about updating semver, that will be done in a minute.
DON'T push to github! (I'll notice).

Cherry-pick example:
# git cherry-pick abcd1234

Reset to arbitrary commit example:
# git reset --hard some_branch_tag_or_commit

Press <enter> when you're done.")

    if current_origin_release_commit.sha != last_released_commit_sha
      dialog.msgbox("You pushed to origin/#{RELEASE_BRANCH_NAME}! I told you not to!
Reset origin/#{RELEASE_BRANCH_NAME} to #{last_released_commit_sha} and try again!")
      while current_origin_release_commit.sha != last_released_commit_sha
        dialog.msgbox("Srsly, reset origin/#{RELEASE_BRANCH_NAME} to #{last_released_commit_sha} (or ctrl-c if you must)")
      end
    end

    local_release_commit = git.object(RELEASE_BRANCH_NAME)

    if last_released_commit_sha == local_release_commit.sha
      dialog.msgbox("Looks like you didn't make any changes to the #{RELEASE_BRANCH_NAME} branch. Aborting.")
      nil
    else
      local_release_commit
    end
  end

  def get_commits_for(gblob)
    gblob.log(MAX_MANIFEST_COMMITS).between(last_released_commit_sha, new_release_commit).select do |commit|
      commit.parents.length == 1 # Ignore merge commits.
    end
  end

  def jira_query(jira_tickets)
    jira_query = "id in (#{jira_tickets.join(',')})"
    URI("https://socrata.atlassian.net/issues/?jql=#{URI.encode(jira_query)}").to_s
  end

  def jira_summary(commits, section_header)
    jira_tickets = commits.map(&:message).map do |message|
      message.scan(/EN-\d+/)
    end.flatten.sort.uniq

    jira_tickets_text = jira_tickets.map do |ticket_id|
      "#{ticket_id}: https://socrata.atlassian.net/browse/#{ticket_id}"
    end.join("\n")

    commits_summary = "#{section_header}\n\n"
    commits_summary << "Link to Jira query for current issues...\n"
    commits_summary << jira_query(jira_tickets)

    commits_summary << "\n\nJIRA tickets:\n#{jira_tickets_text}\n\n"
    commits_summary << "Diff: https://github.com/socrata/platform-ui/compare/#{last_released_commit_sha}...#{new_release_commit.sha}\n\n"
    commits_summary << commits.map do |commit|
      "#{commit.author.name} #{commit.date.strftime('%m-%d-%y')} #{commit.sha}:\n#{commit.message.strip}"
    end.join("\n\n")
  end

  def copy_manifest_to_clipboard
    Clipboard.copy(manifest_text)
  end

  def current_release_semver
    semver_yaml = git.gblob("#{last_released_commit_sha}:storyteller/.semver").contents
    semver = YAML.load(semver_yaml)
    SemVer.new(semver[:major], semver[:minor], semver[:patch], semver[:special])
  end

  def git_clean?
    dialog.infobox('Checking git status...', 3, 30)
    status = git.status
    dialog.infobox('Checking working copy state...', 3, 30)
    clean = status.changed.empty? && status.added.empty?
    dialog.msgbox('Git working copy not clean. Cannot proceed.', 6, 35) unless clean

    clean
  end

  def current_origin_release_commit
    git.object("origin/#{RELEASE_BRANCH_NAME}")
  end

  def open_git_repo
    Git.open(File.expand_path('../', Rake.application.original_dir))
  end
end
