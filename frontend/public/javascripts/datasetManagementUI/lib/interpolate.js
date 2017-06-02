export function interpolate(from, to, duration, easeFun, actionFun) {
  let startTime = null;

  function step(timestamp) {
    if (!startTime) {
      startTime = timestamp;
    }
    const elapsedTime = timestamp - startTime;
    const interpVal = easeFun(elapsedTime, from, (to - from), duration);
    actionFun(interpVal);
    if (elapsedTime < duration) {
      window.requestAnimationFrame(step);
    }
  }

  window.requestAnimationFrame(step);
}

// from https://github.com/danro/jquery-easing/blob/a6f21ff77c84cee11562d36c51fb5b9c95f2eec0/jquery.easing.js#L28
export function easeInOutQuad(time, begin, change, duration) {
  if ((time /= duration / 2) < 1) {
    return change / 2 * time * time + begin;
  }
  return -change / 2 * ((--time) * (time - 2) - 1) + begin;
}
