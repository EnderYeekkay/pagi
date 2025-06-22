var [,, action, type, ...args] = process.argv
const { log } = require('console');
const fs = require('fs');
const path = require('path')
var fields = args.map(val => {
    let splitted = val.split(':')
    return {
        name: splitted[0],
        value: splitted[1]
    }
})
var target_name = fields[0].value
// camel_case matching
if (!target_name.match(/^([a-z]|_)*$/)) throw new Error(`Invalid target name: "${target_name}"`)
switch (type) {
    case 'group':
        switch (action) {
            case 'delete':
                
                break
            case 'create':
                break
            default:
                throw new Error(`Invalid action: ${action}`)
                break
        }
        break;
    case 'model':
        switch (action) {
            case 'delete':
                fs.unlink(path.resolve(__dirname, `${target_name}.js`), (err) => log(err))
                break
            case 'create':
                fs.writeFileSync(path.resolve(__dirname, `${target_name}.js`), writeCode(target_name))
                let temp_models_str = fs.readFileSync(path.resolve(__dirname, '..', './scripts/models.js')).toString()
                temp_models_str = temp_models_str.slice(0, temp_models_str.lastIndexOf(',') + 1)
                temp_models_str += `\n\t${snakeToPascal(target_name)}: require('../models/${target_name}'),\n}\n`
                fs.writeFileSync(path.resolve(__dirname, '..', './scripts/models.js'), temp_models_str)
                break
            default:
                throw new Error(`Invalid action: "${action}"`)
                break
        }
        break;
    default:
        throw new Error(`Invalid type: "${type}"`)
}

// some_string -> SomeString
function snakeToPascal(str) {
    if (!str.match(/^([a-z]|_)*$/)) throw new Error(`String "${str}" isn't a snake_case string.`)
    
    return str
    .split('_')
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join()
}
/**
 * some_string -> some_strings
 * @param {String} str 
 * @returns 
 */
function snakeToMultiply(str) {
    if (!str.match(/^([a-z]|_)*$/)) throw new Error(`String "${str}" isn't a camel_case string.`)

    let words = str.split('_')
    let snakeCaseStr = '';
    for (let i = 0; i < words.length; i++) {
      if (i === words.length - 1) {
        // Add the last word in plural form
        let lastWord = words[i];
        if (lastWord.endsWith('s')) {
          // If the word already ends with 's', just add 'es'
          snakeCaseStr += lastWord + 'es';
        } else if (lastWord.endsWith('y')) {
          // If the word ends with 'y', replace 'y' with 'ies'
          snakeCaseStr += lastWord.slice(0, -1) + 'ies';
        } else {
          // For the rest of the words, add 's'
          snakeCaseStr += lastWord + 's';
        }
      } else {
        // Add the other words with an underscore
        snakeCaseStr += words[i] + '_';
      }
    }
    return snakeCaseStr
}

/**
 * This method writes JS script for new model or group with given params
 * @param {String} name 
 * @param {String} require_str 
 * @returns 
 */
function writeCode(name, require_str = './base_model') {
    return `
class ${snakeToPascal(name)} extends require('${require_str}') {
    static table = "${snakeToMultiply(name)}"
${fields.slice(1).map(field => `\t/** @type {${snakeToPascal(field.value)}} */\n\t${field.name}`).join('\n\n')}\n
    constructor(values) {
        super()
        for (let key in values) {
            if (!this.hasOwnProperty(key)) throw new Error (\`\${key} doesn't belong to \${this.constructor.name} model!\`)
            this[key] = values[key]
        }
    }
}

module.exports = ${snakeToPascal(name)}\n`
}
