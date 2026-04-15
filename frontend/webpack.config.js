const TerserPlugin = require('terser-webpack-plugin')

export default {
	module: {
		mode: process.env.NODE_ENV || 'production',
		rules: [
			{ test: /\.(ts|tsx)?$/, use: ['ts-loader'] },
			{ test: /\.scss$/, use: ['style-loader', 'css-loader', 'sass-loader'] }
		]
	},
	optimization: {
		minimize: true,
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					compress: {
						drop_console: true,
						drop_debugger: true
					}
				}
			})
		]
	}
}
