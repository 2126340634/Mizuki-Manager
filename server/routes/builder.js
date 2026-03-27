const express = require('express')
const router = express.Router()
const { BuildManager } = require('../managers/index.js')
const bm = new BuildManager()

// 上传图片(支持批量)
router.post('/deploy', async (req, res) => {
	const result = await bm.deploy()
	res.status(result.code).json(result)
})

module.exports = router
