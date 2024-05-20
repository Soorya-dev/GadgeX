const isAdminLogin = async (req, res, next) => {
    try {
        if (req.session.admin) {
            next();
        } else {
            res.redirect('/admin/adminLogin')
        }


    } catch (error) {
        console.log('admin auth error ', error.message)
    }
}
//----------------------
const isAdminLogout = async (req, res, next) => {
    try {

        if (req.session.admin) {
            res.redirect('/admin/adminDashboard')
        }

        next();
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = { isAdminLogin, isAdminLogout };