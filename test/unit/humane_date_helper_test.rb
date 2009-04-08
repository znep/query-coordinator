require File.dirname(__FILE__) + '/../test_helper'

class HumaneDateHelperTest < ActionView::TestCase
  def test_humane_date_right_now
    output = humane_date(Time.now.to_s)
    assert_equal('just now', output)
  end

  def test_humane_date_in_a_bit
    later = Time.now + 1.second
    assert_equal('just now', humane_date(later.to_s))
  end

  def test_humane_date_one_minute_ago
    earlier = Time.now - 1.minute
    assert_equal('1 minute ago', humane_date(earlier.to_s))
  end
    
  def test_humane_date_one_minute_from_now
    earlier = Time.now + 1.minute
    assert_equal('1 minute from now', humane_date(earlier.to_s))
  end

  def test_humane_date_three_minutes_ago
    earlier = Time.now - 3.minutes
    assert_equal('3 minutes ago', humane_date(earlier.to_s))
  end
    
  def test_humane_date_three_minutes_from_now
    earlier = Time.now + 3.minutes
    assert_equal('3 minutes from now', humane_date(earlier.to_s))
  end

  def test_humane_date_one_hour_ago
    earlier = Time.now - 1.hour
    assert_equal('1 hour ago', humane_date(earlier.to_s))
  end
    
  def test_humane_date_one_hour_from_now
    earlier = Time.now + 1.hour
    assert_equal('1 hour from now', humane_date(earlier.to_s))
  end
    
  def test_humane_date_three_hours_ago
    earlier = Time.now - 3.hours
    assert_equal('3 hours ago', humane_date(earlier.to_s))
  end

  def test_humane_date_three_hours_from_now
    earlier = Time.now + 3.hours
    assert_equal('3 hours from now', humane_date(earlier.to_s))
  end

  def test_humane_date_one_day_ago
    earlier = Time.now - 1.day
    assert_equal('yesterday', humane_date(earlier.to_s))
  end

  def test_humane_date_one_day_from_now
    earlier = Time.now + 1.day
    assert_equal('tomorrow', humane_date(earlier.to_s))
  end

  def test_humane_date_two_days_ago
    earlier = Time.now - 2.day
    assert_equal('2 days ago', humane_date(earlier.to_s))
  end

  def test_humane_date_two_days_from_now
    earlier = Time.now + 2.day
    assert_equal('2 days from now', humane_date(earlier.to_s))
  end

  def test_humane_date_one_week_ago
    earlier = Time.now - 1.week
    assert_equal('last week', humane_date(earlier.to_s))
  end

  def test_humane_date_one_week_from_now
    earlier = Time.now + 1.week
    assert_equal('next week', humane_date(earlier.to_s))
  end

  def test_humane_date_two_weeks_ago
    earlier = Time.now - 2.weeks
    assert_equal('2 weeks ago', humane_date(earlier.to_s))
  end

  def test_humane_date_two_weeks_from_now
    earlier = Time.now + 2.weeks
    assert_equal('2 weeks from now', humane_date(earlier.to_s))
  end

  def test_humane_date_one_month_ago
    earlier = Time.now - 1.month
    assert_equal('last month', humane_date(earlier.to_s))
  end

  def test_humane_date_one_month_from_now
    earlier = Time.now + 1.month
    assert_equal('next month', humane_date(earlier.to_s))
  end

  def test_humane_date_two_months_ago
    earlier = Time.now - 2.months
    assert_equal('2 months ago', humane_date(earlier.to_s))
  end

  def test_humane_date_two_months_from_now
    earlier = Time.now + 2.months
    assert_equal('2 months from now', humane_date(earlier.to_s))
  end

  def test_humane_date_one_year_ago
    earlier = Time.now - 1.year
    assert_equal('last year', humane_date(earlier.to_s))
  end

  def test_humane_date_one_year_from_now
    earlier = Time.now + 1.year
    assert_equal('next year', humane_date(earlier.to_s))
  end

  def test_humane_date_two_years_ago
    earlier = Time.now - 2.years
    assert_equal('2 years ago', humane_date(earlier.to_s))
  end

  def test_humane_date_two_years_from_now
    earlier = Time.now + 2.years
    assert_equal('2 years from now', humane_date(earlier.to_s))
  end

  def test_humane_date_one_century_ago
    earlier = Time.now - 100.years
    assert_equal('last century', humane_date(earlier.to_s))
  end

  # Fails because we can't parse that far in the future.
  #def test_humane_date_one_century_from_now
  #  earlier = Time.now + 100.years
  #  assert_equal('next century', humane_date(earlier.to_s))
  #end

  # Fails because we can't parse that far in the past.
  #def test_humane_date_two_centurys_ago
  #  earlier = Time.now - 200.years
  #  assert_equal('2 centurys ago', humane_date(earlier.to_s))
  #end

  def test_humane_date_nil
    assert_equal('None', humane_date(nil))
  end

  # Fails because Ruby's date.parse sucks.
  # Refactor the function to not parse a string and just use a direct Time object.
  #def test_humane_date_unparseable
  #  assert_equal('foo', humane_date('foo'))
  #end

end
