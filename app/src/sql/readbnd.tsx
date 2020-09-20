import fs from 'fs';

export function readBnd(bnd) {
  let bndobj = {};
  fs.readFile(bnd, 'utf8', function(err, contents) {
    if (err) throw err;
    let lines = contents.split('\n');

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      let linesplit = line.split(',');
      if (linesplit[0] == ' Node') {
        bndobj[linesplit[2]] = linesplit[3];
      }
    }
  });
  return bndobj;
}
