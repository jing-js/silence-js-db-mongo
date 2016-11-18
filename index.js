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
    this._onInitHandlers = [];
  }
  _onInit(handler) {
    if (this._db !== null) {
      handler(this._db);
    } else {
      this._onInitHandlers.push(handler);
    }
  }
  __collectStatus() {
    return 'todo: collect mongodb status';
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

          this._onInitHandlers.forEach(handler => handler(this._db));
          this._onInitHandlers.length = 0;
          
          resolve();
        }
      });
    });
  }
  close() {
    if (this._closed || !this._db) {
      return Promise.resolve();
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
}

module.exports = MongoDatabaseStore;
