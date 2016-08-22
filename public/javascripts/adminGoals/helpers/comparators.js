export const string = (left, right) => left.toLowerCase().localeCompare(right.toLowerCase());

export const number = (left, right) => left === right ? 0 : (left < right ? -1 : 1);

export const date = (left, right) => {
  if (left.isBefore(right)) {
    return -1;
  } else if (left.isAfter(right)) {
    return 1;
  } else {
    return 0;
  }
};

export const bool = left => {
  return left ? 1 : -1;
};

export const negate = comparator => (left, right) => comparator(left, right) * -1;
