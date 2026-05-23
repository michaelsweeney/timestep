// Guards against duplicate short filenames in a getAllSeries batch (the
// key namespace collapses two .sql files with the same stem). Throws so
// the caller can surface a UI error; previously called `alert()`
// directly from the renderer-only world.
export function checkArray(sqlfiles: string[]): void {
  const seen: string[] = [];
  for (let i = 0; i < sqlfiles.length; i++) {
    const sqlfile = sqlfiles[i];
    const sqlfile_short = sqlfile
      .split('/')
      .pop()!
      .split('.')[0];
    if (seen.includes(sqlfile_short)) {
      throw new Error('All SQL files must have unique filenames');
    }
    seen.push(sqlfile_short);
  }
}
