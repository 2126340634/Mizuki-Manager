const express = require('express')
const router = express.Router()
const { BuildManager } = require('../managers/index.js')
const bm = new BuildManager()

router.post('/deploy', async (req, res) => {
	res.setHeader('Content-Type', 'text/event-stream')
	res.setHeader('Cache-Control', 'no-cache')
	res.setHeader('Connection', 'keep-alive')

	const sendLog = (log) => {
		res.write(`data: ${JSON.stringify({ log })}\n\n`)
	}
	bm.deploy(sendLog)
		.then((result) => {
			res.write(`data: ${JSON.stringify(result)}\n\n`)
			res.end()
		})
		.catch((err) => {
			res.write(`data: ${JSON.stringify(err)}\n\n`)
			res.end()
		})
})

router.post('/stop', async (req, res) => {
	const result = bm.stopProcess()
	res.status(result.code).json(result)
})

module.exports = router
