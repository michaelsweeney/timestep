export function checkArray(sqlfiles) {
  let checkarray = [];
  for (let i = 0; i < sqlfiles.length; i++) {
    let sqlfile = sqlfiles[i];
    let sqlfile_short = sqlfile
      .split('/')
      .pop()
      .split('.')[0];
    if (checkarray.includes(sqlfile_short)) {
      alert('Error: All SQL Files Must Have Unique Filenames');
      return;
    }
    checkarray.push(sqlfile_short);
  }
}
