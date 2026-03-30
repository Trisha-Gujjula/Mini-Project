const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'prashikshan.db');

let SQL = null;
let rawDb = null;

// Wrapper that mimics better-sqlite3 API
const db = {
    _initialized: false,

    prepare(sql) {
        if (!this._initialized) throw new Error('Database not initialized');
        return {
            _db: rawDb,
            _sql: sql,

            run(...params) {
                rawDb.run(sql, params);
                saveToDisk();
                const result = rawDb.exec('SELECT last_insert_rowid() as id');
                const lastId = result.length > 0 ? result[0].values[0][0] : 0;
                return { lastInsertRowid: lastId, changes: rawDb.getRowsModified() };
            },

            get(...params) {
                const stmt = rawDb.prepare(sql);
                if (params.length > 0) stmt.bind(params);
                if (stmt.step()) {
                    const cols = stmt.getColumnNames();
                    const vals = stmt.get();
                    const row = {};
                    cols.forEach((col, i) => { row[col] = vals[i]; });
                    stmt.free();
                    return row;
                }
                stmt.free();
                return undefined;
            },

            all(...params) {
                const results = [];
                const stmt = rawDb.prepare(sql);
                if (params.length > 0) stmt.bind(params);
                while (stmt.step()) {
                    const cols = stmt.getColumnNames();
                    const vals = stmt.get();
                    const row = {};
                    cols.forEach((col, i) => { row[col] = vals[i]; });
                    results.push(row);
                }
                stmt.free();
                return results;
            }
        };
    },

    exec(sql) {
        if (!this._initialized) throw new Error('Database not initialized');
        rawDb.run(sql);
        saveToDisk();
    },

    pragma(pragma) {
        if (!this._initialized) throw new Error('Database not initialized');
        rawDb.run(`PRAGMA ${pragma}`);
    }
};

function saveToDisk() {
    if (rawDb) {
        const data = rawDb.export();
        fs.writeFileSync(dbPath, Buffer.from(data));
    }
}

async function setupDb() {
    SQL = await initSqlJs();
    if (fs.existsSync(dbPath)) {
        const buffer = fs.readFileSync(dbPath);
        rawDb = new SQL.Database(buffer);
    } else {
        rawDb = new SQL.Database();
    }
    rawDb.run('PRAGMA foreign_keys = ON');
    db._initialized = true;
    return db;
}

module.exports = db;
module.exports.setupDb = setupDb;
