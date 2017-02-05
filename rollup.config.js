import babel from 'rollup-plugin-babel'

export default {
    entry: 'scripts/main.js',
    format: 'iife',
    plugins: [ babel() ],
    dest: 'bundle.js',
}
