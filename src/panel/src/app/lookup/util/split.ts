export function splitArray<Type>(array: Type[], predicate: (item: any) => boolean): Type[][] {
  const splitSegments = [];

  let i = 0;
  while (i < array.length? !predicate(array[i]) : false) {
    i++;
  }

  while (i < array.length) {
    const segment = [array[i]];
    splitSegments.push(segment);
    for (
      i++;
      i < array.length && !predicate(array[i]);
      i++
    ) {
      segment.push(array[i]);
    }
  }

  return splitSegments;
}
