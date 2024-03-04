const Dentist = require('../models/Dentist');



//@desc get all dentists
//@route GET /api/v1/dentists
//@access Public
exports.getDentists = async (req,res,next) => {
    let query;

    //Copy req.query
    const reqQuery = {...req.query};

    //Fields to exclude
    const removeField = ['select','sort','page','limit'];

    //Loop over remove fields and delete them from reqQuery
    removeField.forEach(param=>delete reqQuery[param]);
    console.log(reqQuery);

    //Create query string
    let queryStr=JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g,match=>`$${match}`);

    query = Dentist.find(JSON.parse(queryStr)).populate('appointments');

    //Select fields
    if(req.query.select){
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    } 

    //sort
    if(req.query.sort){
        const sortBy=req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else{
        query = query.sort('name'); //name
    }

    //Pagination
    const page = parseInt(req.query.page,10)||1;
    const limit = parseInt(req.query.limit,10)||25;
    const startIndex = (page-1)*limit;
    const endIndex = page*limit;
    try {
        const total = await Dentist.countDocuments();
        query = query.skip(startIndex).limit(limit);
        //Execute query
        const dentists = await query;

        //Pagination result
        const pagination={};

        if(endIndex<total){
            pagination.next={
                page:page+1,
                limit
            }
        }

        if(startIndex>0){
            pagination.prev={
                page:page-1,
                limit
            }
        }
        res.status(200).json({success:true,count: dentists.length, data:dentists});
        
    } catch (error) {
        res.status(400).json({success:false});
    }
}

//@desc get single dentist
//@route GET /api/v1/dentists/:id
//@access Public
exports.getDentist = async (req,res,next) => {
    try {
        const dentist = await Dentist.findById(req.params.id);
        
        if(!dentist)
            return res.status(400).json({success:false});

        res.status(200).json({success:true, data: dentist});
    } catch (err) {
        res.status(400).json({success:false});
    }
}

//@desc Create a dentist
//@route POST /api/v1/dentists
//@access Private
exports.createDentist = async (req,res,next) => {
    const dentist = await Dentist.create(req.body);
    res.status(201).json({
        success: true,
        data: dentist
    });
    // console.log(req.body);
    // res.status(200).json({success:true, msg:'Create a hopital'});
}

//@desc Update single dentist
//@route PUT /api/v1/dentists/:id
//@access Private
exports.updateDentist = async (req,res,next) => {
    try {
        const dentist = await Dentist.findByIdAndUpdate(req.params.id, req.body,{
            new:true,
            runValidators:true
        })
        if(!dentist)
            return res.status(400).json({success:false});
            res.status(200).json({success:true,data: dentist});
    } catch (error) {
        res.status(400).json({success:false});
    }
}

//@desc Delete single dentist
//@route DELETE /api/v1/dentists/:id
//@access Private
exports.deleteDentist = async (req,res,next) => {
    try {
        const dentist = await Dentist.findById(req.params.id);

        if(!dentist)
            return res.status(400).json({success:false});
        
        await dentist.deleteOne(); // await
        res.status(200).json({success:true,data:{}});
    } catch (err) {
        res.status(400).json({success:false});
    }
}
