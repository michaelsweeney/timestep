/* calculate  breakpoints*/

function idealSplit(str) {
  /*
  split by:

  ':'
  ','

  splits by criteria, returns array of two strings
  with the closest number of characters. pretty
  janky, consider alternate optimization.

  */
  let idealsplit;
  if (str.length > 20) {
    let splitby = [': ', ', ', '- '];
    let splitarray = splitby.map(s => {
      return str.split(s).length > 1 ? str.split(s) : [str, ''];
    });
    let splitminidx = 0;
    splitarray.forEach((d, i) => {
      let diff = Math.abs(d[0].length - d[1].length);
      if (splitminidx > diff) {
        splitminidx = i;
      }
    });
    idealsplit = splitarray[splitminidx];
  } else {
    idealsplit = [str];
  }
  return idealsplit;
}

export { idealSplit };
