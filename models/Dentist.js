const mongoose = require('mongoose');

const DestistSchema = new mongoose.Schema({
    name : {
        type: String,
        required: [true,'Please add a name'],
        trim: true,
        maxlength: [50,'Name can not be more than 50 characters']
    },
    year_of_experience:{
        type: Number,
        required: [true,'Please add a years of experience']
    },
    area_of_expertise:{
        type: String,
        required:  [true,'Please add an area of expertise'],
        trim: true,
    },
    medical_fee:{
        type: Number,
        required:[true,'Please add a medical_fee'],
        default: 0
    }
},{
    toJSON: {virtuals:true},
    toObject: {virtuals:true}
});

//Cascade delete appointments when a Dentist is deleted

DestistSchema.pre('deleteOne', {document : true,query: false}, async function(next){
    console.log(`Appointments being removed from dentist ${this._id}`);
    await this.model('Appointment').deleteMany({dentist: this._id});
    next();
});

//Reverse populate with virtuals
DestistSchema.virtual('appointments',{
    ref: 'Appointment',
    localField: '_id',
    foreignField:'dentist',
    justOne:false
});

module.exports=mongoose.model('Dentist',DestistSchema);