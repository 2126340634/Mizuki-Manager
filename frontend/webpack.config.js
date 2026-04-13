export default {
	module: {
		mode: process.env.NODE_ENV || 'production',
		rules: [
			{ test: /\.(ts|tsx)?$/, use: ['ts-loader'] },
			{ test: /\.scss$/, use: ['style-loader', 'css-loader', 'sass-loader'] }
		]
	}
}
