const moment = require("moment");

async function getDeterminedReports(params) {
    let result = [];
    const temp = {
        month: 0,
        day: 0,
        year: 0,
    };
    
    let index = -1;
    params.forEach((param) => {
        console.log("Timestamp: %s", param.timestamp);
        const date = new Date(param.timestamp * 1000);

        const month = date.getMonth();
        const day = date.getDay();
        const year = date.getFullYear();
        const holder = {
            date: "",
            uploadTimes: 0,
            quantity: 0,
            plantedDuration: 0,
        };
        if(temp.month === month && temp.day === day && temp.year === year) {
            let h = result[index];
            let uploadTime = h.uploadTimes;
            uploadTime++;
            let quantity = h.quantity + param.quantity;
            let plantedDuration = h.plantedDuration + param.planted_duration;

            h.uploadTimes = uploadTime;
            h.quantity = quantity;
            h.plantedDuration = plantedDuration;
            result[index] = h;
        } else {
            const formattedDate = moment(date).format("dddd, MMMM Do YYYY");            
            holder.date = formattedDate;
            holder.uploadTimes = 1;
            holder.quantity = param.quantity;
            holder.plantedDuration = param.planted_duration;

            result.push(holder);
            index++;

            // Assign processing date
            temp.month = month;
            temp.day = day;
            temp.year = year;
        }
    });
    console.log("Statshelper result: %s", JSON.stringify(result));
    return result;
}

module.exports = {
    getDeterminedReports,
}