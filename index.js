'use strict';

const MongoClient = require('mongodb').MongoClient;
const MongoLogger = require('mongodb').Logger;
const path = require('path');
const util = require('silence-js-util');
const CWD = process.cwd();
const fs = require('fs');

class MongoDatabaseStore {
  constructor(config) {
    this.logger = config.logger;
    this._db = null;
    this._url = config.url;
    this._logLevel = this.logger.level.toLowerCase();
    this._logFilter = config.logFiler || null;
  }
  init() {
    return new Promise((resolve, reject) => {
      MongoClient.connect(this._url, (err, db) => {
        if (err) {
          reject(err);
        } else {
          this._db = db;
          if (this._logLevel === 'none' || this._logLevel === 'access') {
            MongoLogger.setCurrentLogger(function() {}); // ignore
            return;
          }
          MongoLogger.setLevel(this._logLevel);
          if (this._logFilter) {
            MongoLogger.filter(this._logFilter.name, this._logFilter.value);
          }
          MongoLogger.setCurrentLogger((msg, context) => {
            this.logger.sinfo('mongodb', msg, context);
          });
          resolve();
        }
      });
    });
  }
  close() {
    this._db.close();
    return Promise.resolve();
  }
}

module.exports = SqliteDatabaseStore;
