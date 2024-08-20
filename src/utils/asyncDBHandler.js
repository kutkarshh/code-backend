const asyncDBHandler = (requestHandler) => {
    (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((error) => next(error))
    }
}

export { asyncDBHandler }

// const asyncDBHandler = () => {}
// const asyncDBHandler = (func) => () =>{}
// const asyncDBHandler = (func) => async () =>{}

/* const asyncDBHandler = (fn) => async (req, res, next) => {
    try {

    } catch (error) {
        res.status(error.code || 500).json({
            success: false,
            message: error.message,
        })
    }
} */