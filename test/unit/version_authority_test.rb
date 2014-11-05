require 'test_helper'
require 'timecop'

class VersionAuthorityTest < Test::Unit::TestCase

  def setup
    init_current_domain
    @path = "path-test"
    @user = "user-test"
    @start = Time.now
    Timecop.freeze(@start)
    @complicated_manifest = {
        "search-views-some-stuff-that-does-not-matter" =>(@start - 5.minutes).to_i,
        "ab12-cd34" => @start.to_i,
        "cd12-ab34" => ( @start - 40.minutes).to_i,
        "pageUid-p4g3-srvc" => ( @start - 40.minutes).to_i
    }.sort
    @expect_datasets = ["ab12-cd34", "cd12-ab34"]
    @expect_page = "p4g3-srvc"
  end

  def test_no_manifest_available
    assert(!VersionAuthority.validate_manifest?("fake-path-yo", @user))
  end

  def set_test_manifest(test_manifest, check_age_override=nil)
    manifest = Manifest.new
    manifest.set_manifest(test_manifest)
    manifest.max_age=check_age_override if !check_age_override.nil?
    hash = VersionAuthority.set_manifest(@path, @user, manifest)
    assert_equal(Digest::MD5.hexdigest(test_manifest.to_json), hash)
  end

  def test_resource_mtime
    mtime = VersionAuthority.resource("test-version-authority")
    assert_nil(mtime)
    VersionAuthority.set_resource("test-version-authority", 1234)
    mtime = VersionAuthority.resource("test-version-authority")
    assert_equal(1234, mtime)
  end

  def test_set_invalid_manifest
    test_manifest = {"search-views-some-stuff-that-does-not-matter" => "wrong" ,
                     "ab12-cd34" => "so so wrong"}.sort
    manifest = Manifest.new
    manifest.set_manifest(test_manifest)
    hash = VersionAuthority.set_manifest(@path, @user, manifest)
    assert_equal(Digest::MD5.hexdigest({}.sort.to_json), hash)
  end

  def test_manifest_search_last_check_time_is_not_old_enough
    test_manifest = {"search-views-some-stuff-that-does-not-matter" =>(@start - 5.minutes).to_i,
                     "ab12-cd34" => @start.to_i}.sort
    set_test_manifest(test_manifest)
    assert(VersionAuthority.validate_manifest?(@path, @user))
  end

  def test_manifest_search_last_check_time_is_too_old
    test_manifest = {
        "search-views-some-stuff-that-does-not-matter" =>(@start - 20.minutes).to_i ,
        "ab12-cd34" => @start.to_i
    }.sort
    set_test_manifest(test_manifest)
    assert(!VersionAuthority.validate_manifest?(@path, @user))
  end

  def test_manifest_search_max_age_manifest_override
    test_manifest = {"search-views-some-stuff-that-does-not-matter" =>(@start - 30.minutes).to_i,
                     "ab12-cd34" => @start.to_i}.sort
    set_test_manifest(test_manifest, 60)
    assert(VersionAuthority.validate_manifest?(@path, @user))
    @truth_manifest = {}
    @expect_datasets = ["ab12-cd34"]
    set_test_manifest(test_manifest, 5)
    assert(!VersionAuthority.validate_manifest?(@path, @user, method(:the_truth)))
  end

  def test_manifest_dataset_max_age_manifest_override
    test_manifest = {
        "search-views-some-stuff-that-does-not-matter" => @start.to_i ,
        "ab12-cd34" => (@start - 30.minutes).to_i,
        "pageUid-p4g3-srvc" => @start.to_i
    }.sort
    set_test_manifest(test_manifest, 60)
    assert(VersionAuthority.validate_manifest?(@path, @user))
    @truth_manifest = {}
    @expect_datasets = ["ab12-cd34"]
    set_test_manifest(test_manifest, 5)
    assert(!VersionAuthority.validate_manifest?(@path, @user, method(:the_truth)))
  end

  def test_manifest_dataset_last_check_time_is_not_old_enough
    test_manifest = {
        "ab12-cd34" => @start.to_i,
        "cd12-ab34" => ( @start - 4.minutes).to_i
    }.sort
    set_test_manifest(test_manifest)
    assert(VersionAuthority.validate_manifest?(@path, @user))
  end

  def the_truth(datasets = [], resources = [], page = nil)
    @expect_datasets = @expect_datasets || []
    @expect_resources = @expect_resources || []
    @expect_page = @expect_page || nil
    assert_equal(@expect_datasets, datasets)
    assert_equal(@expect_resources, resources)
    assert_equal(@expect_page, page)
    return @truth_manifest || {}
  end

  def test_manifest_compare_dataset_to_truth_success
    @truth_manifest = {
        "ab12-cd34" => @start.to_i,
        "cd12-ab34" => ( @start - 40.minutes).to_i,
        "pageUid-p4g3-srvc" => ( @start - 40.minutes).to_i
    }
    set_test_manifest(@complicated_manifest)
    assert(VersionAuthority.validate_manifest?(@path, @user, method(:the_truth)))
  end

  def test_manifest_compare_dataset_to_truth_failure
    @truth_manifest = {
        "ab12-cd34" => ( @start - 60.minutes).to_i * 1000,
        "cd12-ab34" => ( @start - 10.minutes).to_i * 1000,
        "pageUid-p4g3-srvc" => ( @start - 10.minutes).to_i
    }
    set_test_manifest(@complicated_manifest)
    assert(!VersionAuthority.validate_manifest?(@path, @user, method(:the_truth)))
  end

  def test_manifest_different_size_than_truth
    @truth_manifest = {
        "ab12-cd34" => ( @start - 60.minutes).to_i * 1000
    }
    set_test_manifest(@complicated_manifest)
    assert(!VersionAuthority.validate_manifest?(@path, @user, method(:the_truth)))
  end

  def test_manifest_resources
    @truth_manifest = {
        "ab12-cd34" => @start.to_i,
        "pages" => @start.to_i,
        "some_resource" => @start.to_i,
        "pageUid-p4g3-srvc" => @start.to_i
    }.sort
    @expect_datasets = ["ab12-cd34"]
    @expect_resources = ["pages", "some_resource"]
    set_test_manifest(@truth_manifest)
    assert(VersionAuthority.validate_manifest?(@path, @user, method(:the_truth)))
  end

  def test_manifest_resources_out_of_date
    resource_test_manifest = {
        "ab12-cd34" => @start.to_i,
        "pages" => ( @start - 60.minutes).to_i,
        "some_resource" => @start.to_i,
        "pageUid-p4g3-srvc" => @start.to_i
    }.sort
    @truth_manifest = {
        "ab12-cd34" => @start.to_i * 1000,
        "pages" => @start.to_i * 1000,
        "some_resource" => @start.to_i * 1000,
        "pageUid-p4g3-srvc" => @start.to_i
    }
    @expect_datasets = ["ab12-cd34"]
    @expect_resources = ["pages", "some_resource"]
    set_test_manifest(resource_test_manifest)
    assert(!VersionAuthority.validate_manifest?(@path, @user, method(:the_truth)))
  end

end
