// Only skip a rebuild when every effective input to its owned buffers is equal.
// This stays independent of visibility: hidden surfaces are still valid on seek.
export function shapeState() {
  let previous;
  return (...values) => {
    if (
      previous &&
      values.length === previous.length &&
      values.every((value, index) => Object.is(value, previous[index]))
    )
      return false;
    previous = values;
    return true;
  };
}
