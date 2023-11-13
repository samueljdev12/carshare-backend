const Vehicle = require("../models/vehicle");  

const filterAndSortVehicles = async (queryParams) => {
    let query = Vehicle.find();

    // Apply filters
    if (queryParams.name) {
        query = query.where('name').equals(queryParams.name);
    }
    if (queryParams.model) {
        query = query.where('model').equals(queryParams.model);
    }
    if (queryParams.minPrice) {
        query = query.where('price').gte(queryParams.minPrice);
    }
    if (queryParams.maxPrice) {
        query = query.where('price').lte(queryParams.maxPrice);
    }

    // Apply sorting
    if (queryParams.sortBy && queryParams.order) {
        query = query.sort({ [queryParams.sortBy]: queryParams.order });
    }

    return await query.exec();
};

module.exports = filterAndSortVehicles;
