import { asyncDBHandler } from "../utils/asyncDBHandler.js";

const registerUser = asyncDBHandler(async (req, res) => {
    res.status(200).json({
        message: "ok"
    })
});

export { registerUser };
