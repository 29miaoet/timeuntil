// School usually starts 2 days after Labour Day, so 2 days after
// the first Monday in September.

function getSchoolYear(): [number, number] {
  const today = new Date();
  const currentYear = today.getFullYear();

  if (today.getMonth() >= 0 && today.getMonth() <= 6) {
    return [currentYear - 1, currentYear];
  } else if (today.getMonth() >= 8 && today.getMonth() <= 11) {
    return [currentYear, currentYear + 1];
  } else {
    // Summer
    return [currentYear, currentYear + 1];
  }
}

function getBackupStartDate(): Date {
  const firstDay = new Date(getSchoolYear()[0], 8, 1);
  const weekday = firstDay.getDay();
  let offset: number = 1 - weekday;

  if (offset < 0) offset += 7;
  // Add offset to get the first monday, then add 2 to get the
  // start date.
  return new Date(firstDay.getDate() + offset + 2);
}

function getBackupEndDate(): Date {
  // The majority of school years ends on June 19, but
  // the other ones are so chaotic it's not even predictable.
  const lastDay = new Date(getSchoolYear()[0], 5, 19);
  return lastDay;
}
