import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/temp');
    },
    filename: function (req, file, cb) {
        // Generate a unique name using the current timestamp and original file extension
        const ext = path.extname(file.originalname);
        const uniqueName = `YT${Date.now()}${ext}`;
        cb(null, uniqueName);
    }
});

export const upload = multer({ storage });
