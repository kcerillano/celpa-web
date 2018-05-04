const dbhelper = require("../utils/dbhelper");
const multer = require("multer");
const path = require("path");
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'app/public/uploads/crops');
  },
  filename: (req, file, callback) => {
    // const fname = file.fieldname + "-" + Date.now() + path.extname(file.originalname);
    const fname = file.originalname;
    callback(null, fname);
  }
})
const upload = multer({storage: storage});
const util = require("util");

const basePath = "/celpa";
const farmerPath = "/farmer";
const cropPath = "/crop";

const maxPhotos = 5;
const photoBasePath = "/uploads/crops/";

function route(app) {
  
  // All routing are perform here
  app.get(basePath + farmerPath + "/getFarmers", async(req, res) => {
    const value = await dbhelper.getFarmers();
    res.json(value);
  }); 

  app.get(basePath + farmerPath + "/getFarmer", async(req, res) => {
    const userName = req.query.userName;
    const passWord = req.query.password;
    const value = await dbhelper.getFarmer(userName, passWord);
    res.json(value);
  });

  app.post(basePath + farmerPath + "/registerFarmer", async(req, res) => {
    const farmer = req.body;
    console.log("Farmer: %s", util.inspect(farmer, false, null));
    const result = await dbhelper.registerFarmer(farmer);
    res.json(result);
  })

  app.get(basePath + cropPath + "/getCrops", async(req, res) => {
    const farmerId = req.query.farmerId;
    const values = await dbhelper.getCrops(farmerId);
    res.json(values);
  });

  // To access img in browser, e.g http://192.168.1.33:3000/uploads/crops/photos-1523209997886.jpg
  app.post(basePath + cropPath + "/details", upload.array("photos", maxPhotos), async(req, res, next) => {
    const crop = JSON.parse(req.body.json);
    const files = req.files;
    let fileArr = [];
    await files.forEach((file) => {
      fileArr.push(photoBasePath + file.filename);
      return;
    }); 
    // Override img path because image was saved before executing this
    crop.img_path = JSON.stringify({
      "photos": fileArr
    });
    crop.location = JSON.stringify(crop.location);
    console.log(util.inspect(crop, false, null));       
    const value = await dbhelper.saveCrop(crop);
    console.log("Returned value: %s", util.inspect(value, false, null));
    res.json(value);
  })

}

module.exports = route;
