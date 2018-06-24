const mysql = require("mysql");
const util = require("util");

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "celpa"
});

async function getFarmers() {
    return new Promise(async(resolve, reject) => {
        const sql = "SELECT * FROM farmer";
        await con.query(sql, (err, result) => {
            if (err) 
                reject(err);
            resolve(result);
        });
    });
}

async function getFarmersByName(name) {
    return new Promise(async(resolve, reject) => {
        const sql = util.format("SELECT * FROM farmer WHERE firstName LIKE '%s"+ "%'" + " OR lastName LIKE '%s" + "%'" + " ORDER BY firstName, lastName", 
                    name, name);
        await con.query(sql, (err, result) => {
            if (err) 
                reject(err);
            resolve(result);
        });
    });
}

async function getReports(farmerId, from, to) {
    return new Promise(async(resolve, reject) => {
        let sql = util.format("SELECT timestamp, quantity, planted_duration FROM crop WHERE farmer_id = %s ORDER BY timestamp", farmerId);
        if(from && to) {
            sql = util.format("SELECT timestamp, quantity, planted_duration FROM crop WHERE farmer_id = %s AND timestamp >= %s AND timestamp <= %s ORDER BY timestamp", farmerId, from, to);
        } 
        await con.query(sql, (err, result) => {
            if (err) 
                reject(err);
            resolve(result); // Return only the first index
        });
    });
}

async function getFarmer(userName, password) {
    return new Promise(async(resolve, reject) => {
        const sql = util.format("SELECT * FROM farmer WHERE userName = '%s' AND password = '%s'", userName, password);
        await con.query(sql, (err, result) => {
            if (err) 
                reject(err);
            resolve(result[0]); // Return only the first index
        });
    });
}

async function getFarmerById(id) {
    return new Promise(async(resolve, reject) => {
        const sql = util.format("SELECT * FROM farmer WHERE id = '%s'", id);
        await con.query(sql, (err, result) => {
            if (err) 
                reject(err);
            resolve(result[0]); // Return only the first index
        });
    });
}

async function registerFarmer(farmer) {
    return new Promise(async(resolve, reject) => {
        const sql = util.format("INSERT INTO farmer"
                            + " (firstName, lastName, mobile_number, email, userName, password)"
                            + " VALUES ('%s', '%s', '%s', '%s', '%s', '%s')",
                            farmer.firstName, farmer.lastName,
                            farmer.mobile_number,
                            farmer.email, farmer.userName,
                            farmer.password
                            );
        await con.query(sql, (err, result) => {
            if(err)
                reject(err);
            farmer.id = result.insertId;
            resolve(farmer);
        })
    })
}

async function getUser(userName, password) {
    return new Promise(async(resolve, reject) => {
        const sql = util.format("SELECT * FROM user WHERE userName = '%s' AND password = '%s'", userName, password);
        await con.query(sql, (err, result) => {
            if (err) 
                reject(err);
            if(result[0]) {   
                resolve(result[0]); // Return only the first index
            } else {
                resolve({});
            }
        });
    })
} 

async function registerUser(user) {
    return new Promise(async(resolve, reject) => {
        const sql = util.format("INSERT INTO user"
                            + " (firstName, lastName, email, userName, password, type)"
                            + " VALUES ('%s', '%s', '%s', '%s', '%s', 'customer')",
                            user.firstName, user.lastName,
                            user.email, user.userName,
                            user.password
                            );
        await con.query(sql, (err, result) => {
            if(err)
                reject(err);
            user.id = user.insertId;
            resolve(user);
        })
    })
}

async function getCrops(id, cropName) {
    return new Promise(async(resolve, reject) => {
        let sql = "";
        if(cropName)
            sql= util.format("SELECT * from crop WHERE farmer_id = %s AND name LIKE '%s" + "%' ORDER BY timestamp DESC", id, cropName);
        else
            sql= util.format("SELECT * from crop WHERE farmer_id = %s ORDER BY timestamp DESC", id);
            
        await con.query(sql, async(err, result) => {
            if(err)
                reject(err);            
            result.forEach((crop, index) => {
                // Save img path and location in db is written as string
                result[index].img_path = JSON.parse(crop.img_path);  
                result[index].location = JSON.parse(crop.location);              
            });
            resolve(result);
        });
    });
}

async function getCropsByName(crop_name) {
    return new Promise(async(resolve, reject) => {
        const sql = util.format("SELECT crop.id, crop.name, crop.img_path,"
                    + " crop.no_of_ferts_used, crop.no_of_water_applied, crop.approx_date_harvest,"
                    + " crop.location, crop.weather, crop.timestamp, crop.planted_start_date, crop.quantity, crop.planted_duration, crop.square_meter, crop.post_to_market,"
                    + " farmer.id as 'farmer_id', farmer.firstName, farmer.lastName, farmer.mobile_number"
                    + " FROM crop "
                    + " INNER JOIN farmer ON crop.farmer_id = farmer.id" 
                    + " WHERE crop.name LIKE '%s' ORDER BY crop.timestamp DESC", crop_name + "%");
        await con.query(sql, async(err, result) => {
            if(err)
                reject(err); 
            result.forEach((crop, index) => {
                // Save img path and location in db is written as string
                result[index].img_path = JSON.parse(crop.img_path);  
                result[index].location = JSON.parse(crop.location);  
            });
            resolve(result);
        });
    });
}

async function getCropsByNameFromMarket(crop_name) {
    return new Promise(async(resolve, reject) => {
        const sql = util.format("SELECT crop.id, crop.name, crop.img_path,"
                    + " crop.no_of_ferts_used, crop.no_of_water_applied, crop.approx_date_harvest,"
                    + " crop.location, crop.weather, crop.timestamp, crop.planted_start_date, crop.quantity, crop.planted_duration, crop.square_meter, crop.post_to_market,"
                    + " farmer.id as 'farmer_id', farmer.firstName, farmer.lastName, farmer.mobile_number"
                    + " FROM crop "
                    + " INNER JOIN farmer ON crop.farmer_id = farmer.id" 
                    + " WHERE crop.name LIKE '%s'"
                    + " AND crop.post_to_market = 1 ORDER BY crop.timestamp DESC", crop_name + "%");
        await con.query(sql, async(err, result) => {
            if(err)
                reject(err); 
            result.forEach((crop, index) => {
                // Save img path and location in db is written as string
                result[index].img_path = JSON.parse(crop.img_path);  
                result[index].location = JSON.parse(crop.location);              
            });
            resolve(result);
        });
    });
}

async function getCropsByFarmerId(farmerId, cropName, from, to) {
    return new Promise(async(resolve, reject) => {
        let sql = "";
        if(cropName) {
            sql = util.format("SELECT crop.id, crop.name, crop.img_path,"
            + " crop.no_of_ferts_used, crop.no_of_water_applied, crop.approx_date_harvest,"
            + " crop.location, crop.weather, crop.timestamp, crop.planted_start_date, crop.quantity, crop.planted_duration, crop.square_meter,"
            + " farmer.id as 'farmer_id', farmer.firstName, farmer.lastName, farmer.mobile_number"
            + " FROM crop "
            + " INNER JOIN farmer ON crop.farmer_id = farmer.id" 
            + " WHERE crop.farmer_id = %s AND crop.name LIKE '%s" + "%' ORDER BY crop.timestamp DESC", farmerId, cropName);

            if(from && to) {
                sql = util.format("SELECT crop.id, crop.name, crop.img_path,"
                + " crop.no_of_ferts_used, crop.no_of_water_applied, crop.approx_date_harvest,"
                + " crop.location, crop.weather, crop.timestamp, crop.planted_start_date, crop.quantity, crop.planted_duration, crop.square_meter,"
                + " farmer.id as 'farmer_id', farmer.firstName, farmer.lastName, farmer.mobile_number"
                + " FROM crop "
                + " INNER JOIN farmer ON crop.farmer_id = farmer.id" 
                + " WHERE crop.farmer_id = %s AND crop.name LIKE '%s" + "%'"
                + " AND crop.timestamp >= %s AND crop.timestamp <= %s ORDER BY crop.timestamp DESC", farmerId, cropName, from, to);
            }
        } else {
            
            sql = util.format("SELECT crop.id, crop.name, crop.img_path,"
            + " crop.no_of_ferts_used, crop.no_of_water_applied, crop.approx_date_harvest,"
            + " crop.location, crop.weather, crop.timestamp, crop.planted_start_date, crop.quantity, crop.planted_duration, crop.square_meter,"
            + " farmer.id as 'farmer_id', farmer.firstName, farmer.lastName, farmer.mobile_number"
            + " FROM crop "
            + " INNER JOIN farmer ON crop.farmer_id = farmer.id" 
            + " WHERE crop.farmer_id = %s ORDER BY crop.timestamp DESC", farmerId);

            if(from && to) {
                sql = util.format("SELECT crop.id, crop.name, crop.img_path,"
                + " crop.no_of_ferts_used, crop.no_of_water_applied, crop.approx_date_harvest,"
                + " crop.location, crop.weather, crop.timestamp, crop.planted_start_date, crop.quantity, crop.planted_duration, crop.square_meter,"
                + " farmer.id as 'farmer_id', farmer.firstName, farmer.lastName, farmer.mobile_number"
                + " FROM crop "
                + " INNER JOIN farmer ON crop.farmer_id = farmer.id" 
                + " WHERE crop.farmer_id = %s AND crop.timestamp >= %s AND crop.timestamp <= %s ORDER BY crop.timestamp DESC", farmerId, from, to);    
            }
        }
        await con.query(sql, async(err, result) => {
            if(err)
                reject(err); 
            result.forEach((crop, index) => {
                // Save img path and location in db is written as string
                result[index].img_path = JSON.parse(crop.img_path);  
                result[index].location = JSON.parse(crop.location);              
            });
            resolve(result);
        });
    });
}

async function saveCrop(crop) {
    return new Promise(async(resolve, reject) => {
        const add = toAdd(crop.name);
        crop.approx_date_harvest = 0;
        if(add > 0) {
            crop.approx_date_harvest = addDays(new Date(crop.planted_start_date * 1000), add).getTime() / 1000;
        }
        const sql = util.format("INSERT INTO crop"
                                + " (farmer_id, name, img_path, no_of_ferts_used, no_of_water_applied, planted_start_date, location, weather, timeStamp, approx_date_harvest, quantity, planted_duration, square_meter, post_to_market)"
                                + " VALUES ('%s', '%s', '%s', '%s', '%s', %s, '%s', '%s', %s, %s, %s, %s, %s, %s)",
                                crop.farmer_id,
                                crop.name, crop.img_path, 
                                crop.no_of_ferts_used, 
                                crop.no_of_water_applied, 
                                crop.planted_start_date,  
                                crop.location,
                                crop.weather, 
                                crop.timeStamp,
                                crop.approx_date_harvest,
                                crop.quantity,
                                crop.planted_duration,
                                crop.square_meter,
                                crop.post_to_market,
                            );
        await con.query(sql, (err, result) => {
            if (err) 
                reject(err);
            crop.id = result.insertId;                
            resolve(crop);
        });
    })
}

function toAdd(name) {
    if(name.toLowerCase() === "lettuce") {
        return 30;
    } else if(name.toLowerCase() === "cucumber") {
        return 45;
    } else if(name.toLowerCase() === "chili(pangsigang)") {
        return 180;
    }
    return 0;
}

function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

module.exports = {
    getFarmers,
    getFarmer,
    getFarmerById,
    registerFarmer,
    getFarmersByName,    
    getUser,    
    registerUser,
    getCrops,
    saveCrop,
    getCropsByName,
    getCropsByNameFromMarket,
    getCropsByFarmerId,
    getReports,
}