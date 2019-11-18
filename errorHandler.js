const errorHandler = function (err, res, req, next) {
    res.status(400);
    res.json({
        status: 400,
        message: err
    })
};
module.exports = errorHandler;
