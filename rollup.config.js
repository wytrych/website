import babel from 'rollup-plugin-babel'
import uglify from 'rollup-plugin-uglify'

export default {
    entry: 'scripts/main.js',
    format: 'iife',
    plugins: [ babel(), uglify() ],
    dest: 'bundle.min.js',
}
