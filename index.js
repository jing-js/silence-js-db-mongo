'use strict';

const MongoClient = require('mongodb').MongoClient;
const MongoLogger = require('mongodb').Logger;
const path = require('path');
const CWD = process.cwd();
const fs = require('fs');

class MongoDatabaseStore {
  constructor(config) {
    this.logger = config.logger;
    this._db = null;
    this._url = config.url;
    this._logLevel = (config.logLevel || this.logger.level).toLowerCase();
    this._logFilter = config.logFilter || null;
    this._closed = false;
  }
  init() {
    return new Promise((resolve, reject) => {
      this.logger.sdebug('mongodb', 'Init connect:', this._url);
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

          MongoLogger.setCurrentLogger((msg, err) => {
            if (err.type === 'debug') {
              this.logger.sdebug('mongodb', err.message);              
            } else if (err.type === 'info') {
              this.logger.sinfo('mongodb', err.message);   
            } else if (err.type === 'error') {
              this.logger.serror('mongodb', err.message);   
            } else if (err.type === 'warn') {
              this.logger.swarn('mongodb', err.message);   
            }
          });
          resolve();
        }
      });
    });
  }
  close() {
    if (this._closed || !this._db) {
      return;
    }
    this._closed = true;
    return this._db.close(true);
  }
  collection(name) {
    return this._db.collection(name);
  }
  createCollection(name, options) {
    return this._db.createCollection(name, options);
  }
  command(cmd) {
    return this._db.command(cmd);
  }
  initField(field) {
    field.type = field.type.toLowerCase();
    if (field.type === 'binary') {
      field.type = 'any';
    } else if (['timestamp', 'int', 'integer'].indexOf(field.type) >= 0) {
      field.type = 'number';
    } else if (['string', 'boolean', 'any'].indexOf(field.type) < 0) {
      return -1;
    }
    return 0;
  }
}

module.exports = MongoDatabaseStore;
