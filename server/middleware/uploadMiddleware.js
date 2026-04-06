const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadsDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsDir)) {
	fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({

destination:(req,file,cb)=>{
cb(null,uploadsDir);
},

filename:(req,file,cb)=>{
cb(null,Date.now()+"-"+file.originalname);
}

});

const upload = multer({storage});

module.exports = upload;