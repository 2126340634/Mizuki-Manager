const express = require('express')
const router = express.Router()
const { BuildManager } = require('../managers/index.js')
const bm = new BuildManager()

router.post('/deploy', async (req, res) => {
	res.setHeader('Content-Type', 'text/event-stream')
	res.setHeader('Cache-Control', 'no-cache')
	res.setHeader('Connection', 'keep-alive')

	const sendLog = (str) => {
		res.write(`data: ${JSON.stringify({ log: str })}\n\n`)
	}
	const handleEnd = (data) => {
		res.write(`data: ${JSON.stringify(data)}\n\n`)
		res.end()
	}
	// 执行部署
	bm.deploy(sendLog, handleEnd, handleEnd)
})

// 状态重连
router.get('/', async (req, res) => {
	res.setHeader('Content-Type', 'text/event-stream')
	res.setHeader('Cache-Control', 'no-cache')
	res.setHeader('Connection', 'keep-alive')

	const statusCallback = {
		sendLog: (str) => {
			res.write(`data: ${JSON.stringify({ log: str })}\n\n`)
		},
		handleEnd: (data) => {
			res.write(`data: ${JSON.stringify(data)}\n\n`)
			res.end()
		}
	}
	bm.addCallback(statusCallback)

	req.on('close', () => {
		bm.removeCallback(statusCallback)
		res.end()
	})
})

router.post('/stop', async (req, res) => {
	const result = bm.stopProcess()
	res.status(result.code).json(result)
})

module.exports = router
