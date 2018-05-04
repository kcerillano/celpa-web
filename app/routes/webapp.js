const dbhelper = require("../utils/dbhelper");
const validator = require("../form_validator");
const path = require("path");
const ip_address = require("ip").address();
const util = require("util");
const moment = require("moment");
const statshelper = require("../utils/statshelper");

const basePath = "/celpa";
const adminPath = "/admin";
const customerPath = "/customer";

function route(app) {
  // All routing are perform here
  app.get(basePath + "/login", async(req, res) => {
    return res.render("login");   
  });

  app.get(basePath + "/logout", async(req, res) => {
      return res.render("login");
  });

  app.post(basePath + "/validateLogin", async(req, res) => {
    const userName = req.body.userName;
    const password = req.body.password;
    const result = await dbhelper.getUser(userName, password);
    console.log(util.inspect(result, false, null));
    return res.json(result);
  });

  app.get(basePath + "/about", async(req, res) => {
    return res.render("about");
  })

  app.get(basePath + "/register", async(req, res) => {
    return res.render("register");
  })

  // Set paths for admin
  pathsForAdmin(app);
  pathsForCustomer(app);
}

function pathsForAdmin(app) {
  // Paths for admin
  app.get(basePath + adminPath + "/estimate", async(req, res) => {
    const crop_names = req.query.crop_names;
    console.log("Getting estimate: %s", crop_names);

    const ejsLocalVariables = {
      crop_names: crop_names || "",
      crop_name_param: crop_names || "",
      crops: [],
      searchResults: false,
      invalidParameters: false
    };

    const result = await dbhelper.getCropsByName(crop_names);
    if(result.length > 0) {
        result.forEach((crop) => {
            crop.img_path.photos[0] = "http://" + ip_address + ":" + process.env.PORT + crop.img_path.photos[0];
            crop.approx_date_harvest = moment(crop.approx_date_harvest * 1000).format("dddd, MMMM Do YYYY hh:ss a");
            crop.planted_start_date = moment(crop.planted_start_date * 1000).format("dddd, MMMM Do YYYY hh:ss a");
            crop.timestamp = moment(crop.timestamp * 1000).format("dddd, MMMM Do YYYY hh:ss a");
        });
        console.log(util.inspect(result, false, null));               
        ejsLocalVariables.crops = result;
        ejsLocalVariables.searchResults = true;
    }

    return res.render("admin/estimate", ejsLocalVariables);
  });

  app.get(basePath + adminPath + "/monitorcrops", async(req, res) => {
    const crop_name = req.query.crop_name;
    console.log("Getting index");

    const ejsLocalVariables = {
      crop_name: crop_name,
      crops: [],
      searchResults: false,
      invalidParameters: false
    };

    if(!validator.isValidInput(crop_name)) {
        ejsLocalVariables.invalidParameters = true;
        return res.render("admin/monitorcrops", ejsLocalVariables);
    }
    const result = await dbhelper.getCropsByName(crop_name);
    console.log("Result", result);
    if(result.length > 0) {
        result.forEach((crop) => {
            crop.img_path.photos[0] = "http://" + ip_address + ":" + process.env.PORT + crop.img_path.photos[0];
            crop.approx_date_harvest = moment(crop.approx_date_harvest * 1000).format("dddd, MMMM Do YYYY hh:ss a");
            crop.planted_start_date = moment(crop.planted_start_date * 1000).format("dddd, MMMM Do YYYY hh:ss a");
            crop.timestamp = moment(crop.timestamp * 1000).format("dddd, MMMM Do YYYY hh:ss a");
        });
        console.log(util.inspect(result, false, null));               
        ejsLocalVariables.crops = result;
        ejsLocalVariables.searchResults = true;
    }
    return res.render("admin/monitorcrops", ejsLocalVariables);
  }); 

  app.get(basePath + adminPath + "/main", async(req, res) => {
    return res.render("admin/main");
  });

  app.get(basePath + adminPath + "/reports/farmers", async(req, res) => {
    const farmer_name = req.query.farmer_name;
    console.log("Getting farmers for reports");

    const ejsLocalVariables = {
      farmer_name: farmer_name,
      farmers: [],
      searchResults: false,
      invalidParameters: false
    };

    if(!validator.isValidInput(farmer_name)) {
        ejsLocalVariables.invalidParameters = true;
        return res.render("admin/reports_farmers", ejsLocalVariables);
    }
    const result = await dbhelper.getFarmersByName(farmer_name);
    console.log("Result", result);
    if(result.length > 0) {
        console.log(util.inspect(result, false, null));               
        ejsLocalVariables.farmers = result;
        ejsLocalVariables.searchResults = true;
    }
    return res.render("admin/reports_farmers", ejsLocalVariables);
  }); 

  app.get(basePath + adminPath + "/reports/crops", async(req, res) => {
    const farmer_id = req.query.farmer_id || 1007;
    const crop_name = req.query.crop_name || "";
    const default_crops = req.query.default_crops || "";
    const dateOption = req.query.dateOption || "all";
    let from_date = req.query.from_date || "";
    let to_date = req.query.to_date || "";

    console.log("Getting crops => %s from farmer: %s for reports. Crop name param: %s", farmer_id, crop_name, default_crops);

    const ejsLocalVariables = {
      farmer_id: farmer_id,
      crop_name: crop_name,
      default_crops: default_crops,
      dateOption: dateOption,
      from_date: from_date,
      to_date: to_date,
      crops: [],
      searchResults: false,
      invalidParameters: false
    };

    if(!validator.isValidInput(crop_name)) {
        ejsLocalVariables.invalidParameters = true;
        return res.render("admin/reports_crops", ejsLocalVariables);
    }

    // include time in dates
    from_date = from_date + " 00:00";
    to_date = to_date + " 23:59";
    console.log("from_date with time: %s, to_date with time: %s", from_date, to_date);
    const from_unixtime = new Date(from_date) / 1000;
    const to_unixtime = new Date(to_date).getTime() / 1000;

    let result = [];
    if(crop_name.length > 0) {
      console.log("Getting crops: %s with farmer_id: %s", farmer_id, crop_name);
      result = await dbhelper.getCropsByFarmerId(farmer_id, crop_name);
      
      if(dateOption === "setdate") {
        console.log("Getting crops: %s with farmer_id: %s using setdate", farmer_id, crop_name);
        
        if(from_date && to_date) {
          result = await dbhelper.getCropsByFarmerId(farmer_id, crop_name, from_unixtime, to_unixtime);
        }
      }
    } else {
      console.log("Getting all crops with farmer_id: %s", farmer_id);
      result = await dbhelper.getCropsByFarmerId(farmer_id);
      
      if(dateOption === "setdate") {
        console.log("Getting all crops with farmer_id: %s using setdate", farmer_id);
        
        if(from_date && to_date) {
          result = await dbhelper.getCropsByFarmerId(farmer_id, "", from_unixtime, to_unixtime);
        }
      }
      
    }
    if(result.length > 0) {
      result.forEach((crop) => {
          crop.img_path.photos[0] = "http://" + ip_address + ":" + process.env.PORT + crop.img_path.photos[0];
          crop.approx_date_harvest = moment(crop.approx_date_harvest * 1000).format("dddd, MMMM Do YYYY hh:ss a");
          crop.planted_start_date = moment(crop.planted_start_date * 1000).format("dddd, MMMM Do YYYY hh:ss a");
          crop.timestamp = moment(crop.timestamp * 1000).format("dddd, MMMM Do YYYY hh:ss a");
      });
      ejsLocalVariables.crops = result;
      ejsLocalVariables.searchResults = true;
    }
    return res.render("admin/reports_crops", ejsLocalVariables);
  });

  app.get(basePath + adminPath + "/reports/uploadstats", async(req, res) => {
    const farmer_id = req.query.farmer_id || 0;
    const dateOption = req.query.dateOption || "all";
    let from_date = req.query.from_date || "";
    let to_date = req.query.to_date || "";

    console.log("Getting timestamps option: %s from %s to %s from farmer: %s for reports", dateOption, from_date, to_date, farmer_id);
    const ejsLocalVariables = {
      farmer_id: farmer_id,
      dateOption: dateOption,
      from_date: from_date,
      to_date: to_date,
      result: [],
      searchResults: false,
      invalidParameters: false
    };

    // include time in dates
    from_date = from_date + " 00:00";
    to_date = to_date + " 23:59";
    
    let result = [];
    if(dateOption === "all") {
      console.log("Getting all upload stats");
      result = await dbhelper.getReports(farmer_id);
    } else {
      console.log("From date: %s, to date: %s", from_date, to_date);
      const from_unixtime = new Date(from_date).getTime() / 1000;
      const to_unixtime = new Date(to_date).getTime() / 1000;
      
      console.log("Getting specific stats from %s to %s", from_unixtime, to_unixtime); 
      result = await dbhelper.getReports(farmer_id, from_unixtime, to_unixtime);
    }

    result = await statshelper.getDeterminedReports(result);
    console.log("Result", result);
    if(result) {
        // console.log(util.inspect(result, false, null));               
        ejsLocalVariables.result = result;
        ejsLocalVariables.searchResults = true;
    }
    
    return res.render("admin/reports_upload_stats", ejsLocalVariables);
  });
}


function pathsForCustomer(app) {

  app.post(basePath + customerPath + "/register", async(req, res) => {
    const user = req.body;    
    const result = await dbhelper.registerUser(user);
    return res.json(result);
  })

  app.get(basePath + customerPath + "/estimate", async(req, res) => {
    const crop_names = req.query.crop_names;
    console.log("Getting estimate: %s", crop_names);

    const ejsLocalVariables = {
      crop_names: crop_names || "",
      crop_name_param: crop_names || "",
      crops: [],
      searchResults: false,
      invalidParameters: false
    };

    const result = await dbhelper.getCropsByName(crop_names);
    if(result.length > 0) {
        result.forEach((crop) => {
            crop.img_path.photos[0] = "http://" + ip_address + ":" + process.env.PORT + crop.img_path.photos[0];
            crop.approx_date_harvest = moment(crop.approx_date_harvest * 1000).format("dddd, MMMM Do YYYY hh:ss a");
            crop.planted_start_date = moment(crop.planted_start_date * 1000).format("dddd, MMMM Do YYYY hh:ss a");
            crop.timestamp = moment(crop.timestamp * 1000).format("dddd, MMMM Do YYYY hh:ss a");
        });
        console.log(util.inspect(result, false, null));               
        ejsLocalVariables.crops = result;
        ejsLocalVariables.searchResults = true;
    }

    return res.render("customer/estimate", ejsLocalVariables);
  });

  app.get(basePath + customerPath + "/market", async(req, res) => {
    const crop_name = req.query.crop_name;
    console.log("Getting index");

    const ejsLocalVariables = {
      crop_name: crop_name,
      crops: [],
      searchResults: false,
      invalidParameters: false
    };

    if(!validator.isValidInput(crop_name)) {
        ejsLocalVariables.invalidParameters = true;
        return res.render("customer/market", ejsLocalVariables);
    }
    const result = await dbhelper.getCropsByNameFromMarket(crop_name);
    console.log("Result", result);
    if(result.length > 0) {
        result.forEach((crop) => {
            crop.img_path.photos[0] = "http://" + ip_address + ":" + process.env.PORT + crop.img_path.photos[0];
            crop.approx_date_harvest = moment(crop.approx_date_harvest * 1000).format("dddd, MMMM Do YYYY hh:ss a");
            crop.planted_start_date = moment(crop.planted_start_date * 1000).format("dddd, MMMM Do YYYY hh:ss a");
            crop.timestamp = moment(crop.timestamp * 1000).format("dddd, MMMM Do YYYY hh:ss a");
        });
        console.log(util.inspect(result, false, null));               
        ejsLocalVariables.crops = result;
        ejsLocalVariables.searchResults = true;
    }
    return res.render("customer/market", ejsLocalVariables);
  }); 

  app.get(basePath + customerPath + "/main", async(req, res) => {
    return res.render("customer/main");
  });
}


module.exports = route;
