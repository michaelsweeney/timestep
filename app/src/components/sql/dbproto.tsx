import sqlite3 from 'sqlite3';
function dbProto() {
  sqlite3.Database.prototype.getAsync = function(sql) {
    let that = this;
    return new Promise(function(resolve, reject) {
      that.get(sql, function(err, row) {
        if (err) reject(err);
        else {
          console.log(row);
          resolve(row);
        }
      });
    });
  };

  sqlite3.Database.prototype.allAsync = function(sql) {
    let that = this;
    return new Promise(function(resolve, reject) {
      that.all(sql, function(err, rows) {
        if (err) reject(err);
        else {
          resolve(rows);
        }
      });
    });
  };

  sqlite3.Database.prototype.runAsync = function(sql) {
    let that = this;
    return new Promise(function(resolve, reject) {
      that.run(sql, function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
  };
}

export { dbProto };
