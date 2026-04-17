const TerserPlugin = require('terser-webpack-plugin')

export default {
	module: {
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
