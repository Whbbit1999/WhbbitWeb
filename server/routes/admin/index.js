module.exports = app => {
    const express = require('express')
    const jwt = require('jsonwebtoken')
    const AdminUser = require('../../models/AdminUser')

    const router = express.Router({
        margeParams: true
    })

    // 登录校验中间件
    const authMiddleware = require('../../middleware/auth')
    const resourceMiddlewear = require('../../middleware/resource')

    // 创建资源
    router.post('/', authMiddleware(), async (req, res) => {
        const model = await req.Model.create(req.body)
        res.send(model)
    })
    // 更新资源
    router.put('/:id', authMiddleware(), async (req, res) => {
        const model = await req.Model.findByIdAndUpdate(req.params.id, req.body)
        res.send(model)
    })
    // 删除资源
    router.delete('/:id', authMiddleware(), async (req, res) => {
        await req.Model.findByIdAndDelete(req.params.id, req.body)
        res.send({
            success: true,
        })
    })
    // 资源列表
    router.get('/', async (req, res) => {
        const queryOptions = {}
        if (req.Model.modelName === 'Category') {
            queryOptions.populate = 'parent'
        }
        const items = await req.Model.find().setOptions(queryOptions).limit(10)
        res.send(items)
    })
    // 资源详情
    router.get('/:id', async (req, res) => {
        const model = await req.Model.findById(req.params.id)
        res.send(model)
    })
    app.use('/admin/api/rest/:resource', authMiddleware(), resourceMiddlewear(), router)

    const multer = require('multer')
    const upload = multer({ dest: __dirname + '/../../uploads' })
    app.post('/admin/api/upload', authMiddleware(), upload.single('file'), async (req, res) => {
        const file = req.file
        file.url = `http://localhost:3000/uploads/${file.filename}`
        res.send(file)
    })

    // login
    app.post('/admin/api/login', async (req, res) => {
        const { username, password } = req.body
        const user = await AdminUser.findOne({ username }).select('+password');
        // assert(user, 422, '用户不存在')
        if (!user) {
            return res.status(422).send({
                message: "用户不存在"
            })
        }
        const isValid = require('bcryptjs').compareSync(password, user.password)

        if (!isValid) {
            return res.status(422).send({
                message: "密码错误"
            })
        }

        const token = jwt.sign({ id: user._id, }, app.get('secret'))
        res.send({ token })
    })

    // 错误处理函数
    // app.use(async (err, req, res, next) => {
    //     // console.log(err)
    //     res.status(err.status || 500).send({
    //         message: err.message
    //     })
    // })
}