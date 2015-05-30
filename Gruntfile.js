module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-release');

  grunt.registerTask('default', ['release']);

};
