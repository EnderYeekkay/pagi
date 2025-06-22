const {MessageComponentInteraction, EmbedBuilder, Client, Guild, GuildMember, GuildChannel, TextChannel} = require('discord.js')
const pg = require('pg');
const { Vector3 } = require('math3d');
const IsolationLevel = {
    Uncommited: 'Read uncommitted',
    Committed: 'Read committed',
    Repeatable: 'Repeatable read',
    Serializable: 'Serializable'
}
// #region Model
/**
 * Base Model
 */
class model {
    /**@type {pg.Client} */
    static pg

    /** @type {Guild}*/
    static guild

    /**@type {Client} */
    static client

    static debug = true

    static table = false

    static index = 'id'

    /**
    * @type {Date}
    * @example
    * ```
    * console.log(created_at) // 2024-03-15T10:27:35.155Z
    * ```
    */
    created_at

    /** @type {boolean} */
    is_saved

    //#region pg connection
    /**@type {pg.Connection | undefined} */
    #connection

    /**@param {pg.Connection} connection */
    set connection(connection) {
        this.#connection = connection
        let query = `START TRANSACTION ISOLATION LEVEL ${IsolationLevel.Serializable};\n`
        this.#connection.query(query)
    }
    get connection() {
        return this.#connection
    }
    //#endregion

    /**
     * 
     * @param {Object} values 
     */
    constructor(values) {
        for (let key in values) {
            this[key] = values.key
        }
        this.created_at = new Date()
        this.is_saved = false
    }

    // #region ANSI
    static sql(string) {
        return `\x1b[34m${string}\x1b[0m`
    }
    static ANSI = {
        sql: req => model.sql(req),
        class: class_name => `\x1b[38;2;255;160;35m${class_name}\x1b[0m`,
        method: method_name => `\x1b[38;2;192;152;219m${method_name}\x1b[0m`,
        instance: (type, id) => `instance${id ? id : ''}<${this.ANSI.class(type)}>`,
        staticMethod: (class_name, method_name) => `${this.ANSI.class(class_name)}.${this.ANSI.method(method_name)}`,
        instanceMethod: (class_name, method_name, id) => `${this.ANSI.instance(class_name, id)}.${this.ANSI.method(method_name)}`
    }
    // #endregion

    //#region Query formatters
    static format_for_sql_query(param) {
        // console.log(`In ${this.name}: ${param} {${typeof param}}`)
        switch (typeof param) {
            case 'string':
                return `'${param}'`
                break;
            case 'object':
                if (param == null) return 'null'
                switch(param.constructor.name) {
                    case 'Array':
                        return `'{${param.map(el => `"${el}"`).join(', ')}}'`
                        break
                    case 'Object':
                        return `'${JSON.stringify(param)}'::json`
                        break
                    case 'Date':
                        return `'${param.toISOString().replace('T', ' ').replace(/\.\d+Z/,'')}'`
                        break
                    case '_Vector3': 
                        return `'{"x": ${param.x}, "y": ${param.y}, "z": ${param.z}}'::json`
                        break
                    default:
                        throw new Error(`Invalid parameter object type: ${param.constructor.name}`)
                        break
                }
                break
            case 'undefined':
                return null
            default:
                return param
                break;
        }
    }
    static format_from_sql_res(param) {
        switch (typeof param) {
            case 'object':
                if (param == null) return null
                if (param?.x && param?.y && param?.z && Object.keys(param).length == 3)
                    return new Vector3(param.x, param.y, param.z)
                return param
                break
            default:
                return param
                break
        }
    }
    //#endregion

    //#region Core
    /**
     * @param {{
     * sort: string
     * conditions: string[]
     * limit: number
     * }} options
     * @example 
     * const arrayOfStandardCoordinates = await StandardCoordinate.all({ 
     *   sort: 'id',
     *   conditions: ["clearance > 5", "id != '125'"],
     *   limit: 1000
     * })
     * @returns {Promise<model[]>}
     */
    static async all(options = {}) {
        const defaultOptions = {
            sort: 'id',
            conditions: [],
            limit: 'ALL'
        }
        options = {...defaultOptions, ...options}


        if (!Object.getOwnPropertyNames(new this()).filter(key => key !== options.sort)) throw new Error(`Invalid sort field (${options.sort}) for ${this.name}`)
        const query = `SELECT ${Object.getOwnPropertyNames(new this()).filter(key => key != 'is_saved').join(', ')} FROM ${this.table} ${options.conditions.length > 0 ? 'WHERE' : ''} ${options.conditions.join(' AND ')} ORDER BY ${options.sort} LIMIT ${options.limit}`
        console.group(`• ${this.ANSI.staticMethod(this.name, 'all')}`)
        if (model.debug) console.log(`Executed request:\n${model.sql(query)}`)
        console.groupEnd()
        const res = await model.pg.query(query)
        return await Promise.all(res.rows.map(async row =>{ 
            let obj = new this(row); 
            obj.connection = await model.pg.connect(); 
            obj.is_saved = true; 
            return obj
        }))
    }

    /**
     * 
     * @param {String} key field to search for
     * @param {String} substring value used to search by key
     * @param {{
     * sort: String
     * conditions: []
     * limit: Number
     * case_matters: false
     * }} options
     * default options:
     * ```
     * const options = {
        case_matters: false,
     *  sort: 'id',
     *  conditions: [],
     *  limit: 25,
     * }
     * ```
     * @returns {Promise<model[]>}
     */
    static async all_like_by(key, substring, options = {}) {
        const defaultOptions = {
            case_matters: false,
            sort: 'id',
            conditions: [],
            limit: 25,
        }
        options = {...defaultOptions, ...options}

        const query = `SELECT * FROM ${this.table} WHERE ${key} ${options.case_matters ? '' : 'I'}LIKE '%${substring}%' ${options.conditions.length > 0 ? 'AND' : ''} ${options.conditions.join(' AND ')} ORDER BY ${options.sort} LIMIT ${options.limit}` 
        console.group(`• ${this.ANSI.staticMethod(this.name, 'all_like_by')}`)
        if (model.debug) console.log(`Executed request:\n${model.sql(query)}`)
        console.groupEnd()
        const res = await model.pg.query(query)
        return await Promise.all(res.rows.map(async row => {
            const model_child = new this(row)
            model_child.is_saved = true
            model_child.connection = await model.pg.connect()
            return model_child
        }))
    }
    /**
     * @param {Number} max_columns
     * @param {String | undefined} sort fields to sort by 
     * @param {{
     * sort: string
     * conditions: string[]
     * }} options
     * @returns {Promise<model[][]>}
     */
    static async all_matrix(max_columns = 10, options = {}) {
        max_columns = Number(max_columns)
        const defaultOptions = {
            sort: 'id',
            conditions: [],
        }
        options = {...defaultOptions, ...options}

        if (max_columns < 1 || max_columns > 25) throw new Error(`${max_columns} doesn't belong to the range 1 to 25`)
        /** @type {Array<model>} */
        console.group(`• ${this.ANSI.staticMethod(this.name, 'all_matrix')}`)
        const models_linear = await this.all(options)
        console.groupEnd()

        /** @type {model[][]}*/
        var models_matrix = new Array()
        for (let i = 0; i < models_linear.length; i += max_columns) {
          models_matrix.push(models_linear.slice(i, i + max_columns));
        }
        return models_matrix
    }

    /**
     * Checking for the existence of a tuple in a table by id
     * @param {String} id 
     */
    static async is_exists_with_id(id) {
        if (typeof id !== 'string' && typeof id !== 'number') throw new Error(`Wrong type of id '${id}': ${typeof id}`)
        var query = `SELECT * FROM ${this.table} WHERE ${this.index} = ${model.format_for_sql_query(id)};`
        console.group(`• ${this.ANSI.staticMethod(this.name, 'is_exists_with_id')}`)
        if (model.debug) console.log(`Executed request:\n${model.sql(query)}`)
        console.groupEnd()
        var res = await model.pg.query(query)
        return Boolean(res?.rows[0])
    }

    /**
     * Get object by its id
     * @param {String | Number} id 
     */
    static async with_id(id) {
        var query = `SELECT * FROM ${this.table} WHERE ${this.index} = ${model.format_for_sql_query(id)};`
        console.group(`• ${this.ANSI.staticMethod(this.name, 'with_id')}`)
        if (model.debug) console.log(`Executed request:\n${model.sql(query)}`)
        console.groupEnd()
        var res = await this.pg.query(query)

        if (res.rowCount > 1) {
            throw new Error(`The uniqueness condition of the identifier in the table "${this.table}" is violated`)
        }

        if (res.rowCount == 0) throw new Error(`Instance of '${this.name}' with id = '${id}' not exist in table ${this.table}`)
        const instance = new this(res.rows[0])
        instance.is_saved = true
        instance.connection = await model.pg.connect()
        return instance
    }

    /**
     * Get models by their properties
     * @param {Object} columns
     * @param {{
     * sort: string,
     * conditions: string[],
     * }} options
     * @example
     * ```
     *  // You can change User to any child of model
     *  @type {User<Array>}
     *  const Users = User.get_by({pvp_coins: 0, profile_category: '1089636806363988069'});
     * ```
     * @returns {Promise<model[]>}
     */
    static async get_by(columns, options = {}) {
        const defaultOptions = {
            sort: 'id',
            conditions: [],
        }
        options = {...defaultOptions, ...options}
        var fields = Object.keys(columns).map(key => `${key} = ${model.format_for_sql_query(columns[key])}`).join(' AND ')
        var query = `SELECT * FROM ${this.table} WHERE ${fields} ${options.conditions.length > 0 ? ' AND ' : ''}${options.conditions.join(' AND ')} ORDER BY ${options.sort}`
        console.group(`• ${this.ANSI.staticMethod(this.name, 'get_by')}`)
        if (model.debug) console.log(`Executed request:\n${model.sql(query)}`)
        console.groupEnd()
        const res = await model.pg.query(query)
        return await Promise.all(res.rows.map(async row => {
            var instance = new this(row); 
            instance.is_saved = true; 
            instance.connection = await model.pg.connect()
            return instance
        }))
    }

    async save() {
        if (this.is_saved) { 
            console.log(`Model: ${this.constructor.name}, tuple with id = ${this.id} in table "${this.constructor.table}" is already exist`)
            return this.update()
        }
        const fields_obj_messy = Object.keys(this)
        const values_obj_messy = Object.values(this)

        const fields_obj = []
        const values_obj = []
        values_obj_messy.map(function(value, index) {
            if (value && fields_obj_messy[index] != 'is_saved') {
                fields_obj.push(fields_obj_messy[index])
                values_obj.push(values_obj_messy[index])
            }
        })

        const fields = fields_obj.join(', ');
        const values = values_obj.map(value => model.format_for_sql_query(value)).join(', ')
        const query = `INSERT INTO ${this.constructor.table} (${fields}) VALUES (${values});\nSELECT * FROM ${this.constructor.table} WHERE ${this.constructor.index} = (SELECT MAX(${this.constructor.index}) FROM ${this.constructor.table});`
        console.group(`• ${model.ANSI.instanceMethod(this.constructor.name, 'save', undefined)}`)
        if (model.debug) console.log(`Executed request:\n${model.sql(query)}`)
        console.groupEnd()
        this.connection = await model.pg.connect()
        const res = (await this.connection.query(query))[1].rows[0];
        Object.keys(this).map(key => this[key] = res[key])
        return res;
    }

    async update() {
        if (!this.is_saved) throw new Error(`This instance of ${this.constructor.name} is not saved yet.`)

        delete this.is_saved
        const fields_obj_messy = Object.keys(this)
        const values_obj_messy = Object.values(this)

        const fields_obj = []
        const values_obj = []
        values_obj_messy.map(function(value, index) {
            if (typeof value != 'undefined') {
                fields_obj.push(fields_obj_messy[index])
                values_obj.push(values_obj_messy[index])
            }
        })

        const fields = fields_obj.filter(key => key !== this.constructor.index).map(key => `${key} = ${model.format_for_sql_query(this[key])}`).join(', ')

        const query_select = `SELECT * FROM ${this.constructor.table} WHERE ${this.constructor.index} = ${model.format_for_sql_query(this[this.constructor.index])}`
        const query_update = `UPDATE ${this.constructor.table} SET ${fields} WHERE ${this.constructor.index} = '${this[this.constructor.index]}'`

        console.group(`• ${model.ANSI.instanceMethod(this.constructor.name, 'update', this.id)}`)
        if (model.debug) console.log(`Executed request:\n${model.sql(query_select)}`)
        if (model.debug) console.log(`Executed request:\n${model.sql(query_update)}`)
        console.groupEnd()
        this.constructor.pg.query(query_update)
        const query_res = (await this.constructor.pg.query(query_select)).rows[0]

        for (let key in query_res) {
            this[key] = model.format_from_sql_res(query_res[key])
        }

        this.is_saved = true;
        return this;
    }
    async terminate(code = 0) {
        if (code == 0) await this.#connection.query('\nCOMMIT;')
        else await this.#connection.query('\nROLLBACK;')
        await this.#connection.release()
    }
    /**
     * 
     * @returns {Promise<Boolean>}
     */
    async delete() {
        if (!this.is_saved) return false
        const query = `DELETE FROM ${this.constructor.table} WHERE ${this.constructor.index} = ${this[this.constructor.index]}`
        console.group(`• ${model.ANSI.instanceMethod(this.constructor.name, 'delete', this.id)}`)
        if (model.debug) console.log(`Executed request:\n${model.sql(query)}`)
        console.groupEnd()
        const res = await model.pg.query(query)
        this.terminate()
        this.is_saved = false
        return Boolean(res.rowCount)
    }
    //#endregion
}
//#endregion

module.exports = model