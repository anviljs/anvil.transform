module.exports = function( _, anvil ) {

	anvil.addCompiler = function( ext, instance ) {
		anvil.config[ "anvil.transform" ].compilers[ ext ] = instance;
	};

	return anvil.plugin( {
		name: "anvil.transform",
		activity: "compile",
		config: { compilers: {} },
		compile: function( file, done ) {
			var self = this,
				ext = file.extension(),
				pluginConfig = anvil.config[ "anvil.transform" ],
				compilers = pluginConfig ? pluginConfig.compilers : {},
				compiler = compilers[ ext ];

			if( compiler ) {
				var rename = compiler.rename ? compiler.rename( file.name ) : file.name;
				anvil.fs.transform(
					[ file.workingPath, file.name ],
					compiler.compile,
					[ file.workingPath, rename ],
					function( err ) {
						if( err ) {
							anvil.log.error( "Error compiling '" + file.fullPath + "/" + file.name + "' : " + err );
							anvil.events.raise( "build.stop", "compiler error" );
						} else {
							file.name = rename;
							done();
						}
					} );
			} else {
				done();
			}
		},

		run: function( done ) {
			var files = _.filter( anvil.project.files, function( file ) {
				return file.dependents.length === 0;
			} );
			anvil.scheduler.parallel( files, this.compile, function() { done(); } );
		}
	} );
};