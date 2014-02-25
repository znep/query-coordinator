require File.dirname(__FILE__) + '/../test_helper'
require 'humane_date_helper'

class HumaneDateHelperTest < Test::Unit::TestCase
  def test_humane_date_right_now
    output = HumaneDateHelper.humane_date(Time.now.to_i)
    assert_equal('just now', output)
  end

  def test_humane_date_in_a_bit
    later = Time.now + 1.second
    assert_equal('just now', HumaneDateHelper.humane_date(later.to_i))
  end

  def test_humane_date_one_minute_ago
    earlier = Time.now - 1.minute
    assert_equal('1 minute ago', HumaneDateHelper.humane_date(earlier.to_i))
  end
    
  def test_humane_date_one_minute_from_now
    earlier = Time.now + 1.minute
    assert_equal('1 minute from now', HumaneDateHelper.humane_date(earlier.to_i))
  end

  def test_humane_date_three_minutes_ago
    earlier = Time.now - 3.minutes
    assert_equal('3 minutes ago',HumaneDateHelper.humane_date(earlier.to_i))
  end
    
  def test_humane_date_three_minutes_from_now
    earlier = Time.now + 3.minutes
    assert_equal('3 minutes from now',HumaneDateHelper.humane_date(earlier.to_i))
  end

  def test_humane_date_one_hour_ago
    earlier = Time.now - 1.hour
    assert_equal('1 hour ago',HumaneDateHelper.humane_date(earlier.to_i))
  end
    
  def test_humane_date_one_hour_from_now
    earlier = Time.now + 1.hour
    assert_equal('1 hour from now',HumaneDateHelper.humane_date(earlier.to_i))
  end
    
  def test_humane_date_three_hours_ago
    earlier = Time.now - 3.hours
    assert_equal('3 hours ago',HumaneDateHelper.humane_date(earlier.to_i))
  end

  def test_humane_date_three_hours_from_now
    earlier = Time.now + 3.hours
    assert_equal('3 hours from now',HumaneDateHelper.humane_date(earlier.to_i))
  end

  def test_humane_date_one_day_ago
    earlier = Time.now - 1.day
    assert_equal('yesterday',HumaneDateHelper.humane_date(earlier.to_i))
  end

  def test_humane_date_one_day_from_now
    earlier = Time.now + 1.day
    assert_equal('tomorrow',HumaneDateHelper.humane_date(earlier.to_i))
  end

  def test_humane_date_two_days_ago
    earlier = Time.now - 2.day
    assert_equal('2 days ago',HumaneDateHelper.humane_date(earlier.to_i))
  end

  def test_humane_date_two_days_from_now
    earlier = Time.now + 2.day
    assert_equal('2 days from now',HumaneDateHelper.humane_date(earlier.to_i))
  end

  def test_humane_date_one_week_ago
    earlier = Time.now - 1.week
    assert_equal('last week',HumaneDateHelper.humane_date(earlier.to_i))
  end

  def test_humane_date_one_week_from_now
    earlier = Time.now + 1.week
    assert_equal('next week',HumaneDateHelper.humane_date(earlier.to_i))
  end

  def test_humane_date_two_weeks_ago
    earlier = Time.now - 2.weeks
    assert_equal('2 weeks ago',HumaneDateHelper.humane_date(earlier.to_i))
  end

  def test_humane_date_two_weeks_from_now
    earlier = Time.now.to_i + 2.weeks
    assert_equal('2 weeks from now',HumaneDateHelper.humane_date(earlier.to_i))
  end

  def test_humane_date_one_month_ago
    earlier = Time.now - 1.month
    assert_equal('last month',HumaneDateHelper.humane_date(earlier.to_i))
  end

  def test_humane_date_one_month_from_now
    earlier = Time.now + 31.days
    assert_equal('next month',HumaneDateHelper.humane_date(earlier.to_i))
  end

  def test_humane_date_two_months_ago
    earlier = Time.now - 2.months
    assert_equal('2 months ago',HumaneDateHelper.humane_date(earlier.to_i))
  end

  def test_humane_date_two_months_from_now
    earlier = Time.now + 2.months
    assert_equal('2 months from now',HumaneDateHelper.humane_date(earlier.to_i))
  end

  def test_humane_date_one_year_ago
    earlier = Time.now - 1.year
    assert_equal('last year',HumaneDateHelper.humane_date(earlier.to_i))
  end

  def test_humane_date_one_year_from_now
    earlier = Time.now + 1.year
    assert_equal('next year',HumaneDateHelper.humane_date(earlier.to_i))
  end

  def test_humane_date_two_years_ago
    earlier = Time.now - 2.years
    assert_equal('2 years ago',HumaneDateHelper.humane_date(earlier.to_i))
  end

  def test_humane_date_two_years_from_now
    earlier = Time.now + 2.years
    assert_equal('2 years from now',HumaneDateHelper.humane_date(earlier.to_i))
  end

  def test_humane_date_one_century_ago
    earlier = Time.now - 100.years
    assert_equal('last century',HumaneDateHelper.humane_date(earlier.to_i))
  end

  # Fails because we can't parse that far in the future.
  #def test_humane_date_one_century_from_now
  #  earlier = Time.now + 100.years
  #  assert_equal('next century',HumaneDateHelper.humane_date(earlier.to_i))
  #end

  # Fails because we can't parse that far in the past.
  #def test_humane_date_two_centurys_ago
  #  earlier = Time.now - 200.years
  #  assert_equal('2 centurys ago',HumaneDateHelper.humane_date(earlier.to_i))
  #end

  def test_humane_date_nil
    assert_equal('None',HumaneDateHelper.humane_date(nil))
  end

  # Fails because Ruby's date.parse sucks.
  # Refactor the function to not parse a string and just use a direct Time object.
  #def test_humane_date_unparseable
  #  assert_equal('foo',HumaneDateHelper.humane_date('foo'))
  #end

end
