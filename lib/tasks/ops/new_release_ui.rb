require 'mrdialog'
require 'clipboard'
require 'git'
require 'rake'
require 'semver'
require 'yaml'

require_relative 'jenkins'

class NewReleaseUi
  ADDITIONAL_MANIFEST_EMAIL = 'emily.rund@socrata.com'
  MAX_MANIFEST_COMMITS = 1000 # This must be provided to the git library.
  MANIFEST_FILE = 'manifest.txt'

  attr_reader :dialog, :git, :new_release_commit, :new_semver, :jenkins_build_number

  def initialize
    @dialog = MRDialog.new
    @git = open_git_repo
  end

  def open
    begin
      Rake.application['ops:jenkins:check_creds'].invoke
      Rake.application['ops:check_aws_creds'].invoke
      Rake.application['ops:check_vpn'].invoke
    rescue => e
      dialog.msgbox(e.message)
      return
    end

    return unless git_clean?

    @new_release_commit = input_release_commit

    return unless @new_release_commit && user_approves_manifest?

    @new_semver = input_semver

    return unless @new_semver && user_approves_task_summary?

    make_the_release!

    provide_manifest_and_instructions_to_user

    @jenkins_build_number = wait_for_jenkins_build

    puts("\nComplete. Manifest written to #{MANIFEST_FILE}")
  end

  private

  def make_the_release!
    # 1- Reset or merge local release to new_release_commit
    dialog.infobox('Prepare release branch')
    git.checkout('release')
    git.reset_hard('origin/release')

    if merge_instead_of_reset?
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
      git.reset_hard(current_release_commit)
    end

    # 2- Commit semver
    dialog.infobox('Commit semver')
    new_semver.save(SemVer.find_file)
    git.add(SemVer.find_file)
    git.commit("Bump version #{new_semver}")


    # 3- Apply tag.
    dialog.infobox('Tag release')
    Rake.application['tag:release'].execute

    # 4- Push origin
    dialog.infobox('Git push')
    git.push
  end

  def wait_for_jenkins_build
    dialog.infobox('Waiting for Jenkins build to complete successfully', 4, 50)
    loop do
      build_number = Jenkins.find_storyteller_release_build(git.object('release').sha)
      break if build_number
      sleep 15
    end

    dialog.msgbox("Build complete (#{build_number}")

    build_number
  end

  def input_release_commit
    release_type_menu_items = [
      [ 'master', 'Merge origin/master into origin/release' ],
      [ 'custom', 'Reset origin/release to an arbitrary commit' ]
    ]

    release_type = dialog.menu('Create a release from...', release_type_menu_items, 20, 80)

    return unless release_type

    dialog.infobox('Fetching origin...', 3, 40)
    git.fetch

    case release_type
      when 'master'
        current_master_commit
      when 'custom'
        create_custom_release_commit
    end
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
    dialog.yesno("----------
Here is the manifest. Does this look good? Scroll with j/k/pgup/pgdown.
You'll have an opportunity to copy this to the clipboard momentarily.
----------

#{manifest_text}")
  end

  def user_approves_task_summary?
    merge_or_reset = if merge_instead_of_reset?
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

  # Generate a manifest between current_release_commit and new_release_commit.
  # If new_semver is set, a header will be generated mentioning the new
  # version. Example header:
  #   Storyteller v1.0.1 Manifest (old version: v1.0.0).
  def manifest_text
    commits = git.log(MAX_MANIFEST_COMMITS).between(current_release_commit, new_release_commit).select do |commit|
      commit.parents.length == 1 # Ignore merge commits.
    end

    jira_tickets = commits.map(&:message).map do |message|
      message.scan(/EN-\d+/)
    end.flatten.sort

    commits_summary = "JIRA tickets: #{jira_tickets.join(', ')}\n\n"
    commits_summary << commits.map do |commit|
      "#{commit.author.name} #{commit.date.strftime('%m-%d-%y')} #{commit.sha}:\n#{commit.message.strip}"
    end.join("\n\n")

    if new_semver
      "Storyteller #{new_semver} manifest (old version: #{current_release_semver})\n\n#{commits_summary}"
    else
      commits_summary
    end
  end

  def provide_manifest_and_instructions_to_user
    File.open(MANIFEST_FILE, 'w') { |f| f.write(manifest_text) }

    copy_manifest_to_clipboard if dialog.yesno("Manifest written to #{MANIFEST_FILE}.
Please send the manifest to:

  * engineering@socrata.com
  * #{ADDITIONAL_MANIFEST_EMAIL}

Copy manifest to clipboard?")
  end


  def create_custom_release_commit
    original_release = current_release_commit
    dialog.msgbox("In another terminal, please get HEAD into the state you wish to release.
Don't worry about updating semver, that will be done in a minute.
DON'T push release to github! (I'll notice).

Cherry-pick example:
# git checkout release       # Could be anything, really.
# git cherry-pick abcd1234
                  
Press <enter> when you're done.")

    if original_release.sha != current_release_commit.sha
      dialog.msgbox("You pushed to origin/release! I told you not to!
Reset origin/release to #{original_release.sha} and try again!")
      while original_release.sha != current_release_commit.sha
        dialog.msgbox("Srsly, reset origin/release to #{original_release.sha} (or ctrl-c if you must)")
      end
    end

    head_commit = git.object('HEAD')

    if current_release_commit.sha == head_commit.sha
      dialog.msgbox('Your release branch is the same as origin/release!')
      nil
    else
      head_commit
    end
  end

  def copy_manifest_to_clipboard
    Clipboard.copy(manifest_text)
  end

  def current_release_semver
    semver_yaml = git.gblob("#{current_release_commit.sha}:.semver").contents
    semver = YAML.load(semver_yaml)
    SemVer.new(semver[:major], semver[:minor], semver[:patch], semver[:special])
  end

  def current_release_commit
    git.object('origin/release')
  end

  def current_master_commit
    git.object('origin/master')
  end

  # Our policy is:
  #   * If we're releasing from master, merge master into release.
  #   * Otherwise, hard reset release to desired point.
  def merge_instead_of_reset?
    current_master_commit.sha == new_release_commit.sha
  end

  def git_clean?
    dialog.infobox('Checking git status...', 3, 30)
    status = git.status
    clean = status.changed.empty? && status.added.empty?
    dialog.msgbox('Git working copy not clean. Cannot proceed.', 6, 35) unless clean

    clean
  end

  def open_git_repo
    Git.open(Rake.application.original_dir)
  end
end
