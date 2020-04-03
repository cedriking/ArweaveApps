import { App } from '../app';
import { Utils } from './utils';

export class DB {
  private internalDB;
  private isWebSQL: boolean = true;
  private rejectAll: boolean = false;

  constructor(dbName: string = 'test-db4', dbVersion: string = '1.0') {
    // @ts-ignore
    if (!window.openDatabase) {
      this.isWebSQL = false;

      if(!window.localStorage) {
        this.rejectAll = true;
      }
    } else {
      this.internalDB = window.openDatabase(dbName, dbVersion, '', 2 * 1024 * 1024);
    }
  }

  // Global
  async upsert(tableName: string, data: any, keyValue: string) {
    if(this.rejectAll) return false;

    data = JSON.stringify(data);
    
    if(this.isWebSQL) {
      try {
        await this.webSqlUpsert(tableName, data, keyValue);
      } catch(e) { console.log(e); return false; }

    } else {
      await this.localStorageUpsert(tableName, data, keyValue);
    }

    return true;
  }

  async find(tableName: string) {
    if(this.rejectAll) return false;

    let result = null;
    if(this.isWebSQL) {
      try {
        result = await this.webSqlFind(tableName);
      } catch(e) { console.log(e); return false; }
    } else {
      result = await this.localStorageFind(tableName);
    }

    return result;
  }

  async findOne(tableName: string, keyValue: string) {
    if(this.rejectAll) return false;

    let result = null;
    if(this.isWebSQL) {
      try {
        result = await this.webSqlFindOne(tableName, keyValue);
      } catch(e) { console.log(e); return false; }
    } else {
      result = await this.localStorageFindOne(tableName, keyValue);
    }

    return result? JSON.parse(result) : false;
  }

  // LocalStorage
  private async localStorageFind(tableName: string): Promise<any[]> {
    const result = [];
    for ( var i = 0, len = localStorage.length; i < len; ++i ) {
      if(localStorage.key(i).startsWith(`${Utils.toSlug(tableName)}:`)) {
        result.push(JSON.parse(localStorage.getItem( localStorage.key( i ) )));
      }
    }

    return result;
  }

  private async localStorageFindOne(tableName: string, keyValue: string): Promise<string> {
    return window.localStorage.getItem(`${Utils.toSlug(tableName)}:${keyValue}`);
  }

  private async localStorageUpsert(tableName: string, data: any, key: string): Promise<boolean> {
    window.localStorage.setItem(`${Utils.toSlug(tableName)}:${key}`, data);
    return true;
  }

  // WebSQL
  private async webSqlFind(tableName: string): Promise<any[]|boolean> {
    await this.createTable(tableName);

    const result = [];
    const res = await this.query(`SELECT * FROM ${tableName}`);
    if(res.rows.length) {
      for(let i = 0, j = res.rows.length; i < j; i++) {
        result.push(JSON.parse(res.rows[i].data));
      }
    }

    return (result.length? result : false);
  }

  private async webSqlFindOne(tableName: string, id: string): Promise<string> {
    await this.createTable(tableName);

    const result = await this.query(`SELECT * FROM ${tableName} WHERE id=?`, [id]);
    return ((result && result.rows.length)? result.rows[0].data : false);
  }

  private async webSqlUpsert(tableName: string, data: any, id: string): Promise<boolean> {
    await this.createTable(tableName);

    try {
      await this.query(`DELETE FROM ${tableName} WHERE id=?`, [id]);
    } catch(e) { console.log(e); }

    try {
      await this.query(`INSERT INTO ${tableName} (id, data) VALUES (?, ?)`, [id, data]);
    } catch(e) {
      console.log(e);
    }

    return true;
  }


  // Utilities
  private async createTable(name: string): Promise<boolean> {
    this.internalDB.transaction(function (tx) {   
      tx.executeSql(`CREATE TABLE IF NOT EXISTS ${name} (id unique, data)`); 
   });
    
    return true;
  }

  private query(sql: string, params: any[] = []): Promise<{ rows: any, rowsAffected: number, insertId?: string }> {
    return new Promise((resolve, reject) => {
      if (!this.internalDB) {
        return setTimeout(() => this.query(sql, params), 100);
      }

      // @ts-ignore
      window.internalDB = this.internalDB;

      this.internalDB.transaction((tx) => {
        tx.executeSql(sql, params||[], (tx ,res) => {
          // tidy up
          var rows = [];
          for(var i=res.rows.length; i; i--){
            rows.unshift(res.rows.item(i-1));
          }
          var out = {rows:rows, rowsAffected:res.rowsAffected};
          // don't worry about no insertId
          // @ts-ignore
          try{ out.insertId = res.insertId; }catch(e){}
          resolve(out);

        }, (tx, err) => {
          reject(err.message);
        });
      });
    });
  }
}