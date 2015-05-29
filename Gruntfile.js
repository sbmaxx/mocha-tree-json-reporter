module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-release');
  // Default task(s).
  grunt.registerTask('default', ['bump']);

};
