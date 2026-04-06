const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({

title:String,

description:String,

fileUrl:String,

assignedTo:{
type:String,
default:""
},

assignedAt:{
type:Date,
default:null
},

investigationNotes:{
type:String,
default:""
},

investigatedAt:{
type:Date,
default:null
},

adminReply:{
type:String,
default:""
},

repliedAt:{
type:Date,
default:null
},

resolvedAt:{
type:Date,
default:null
},

status:{
type:String,
enum:["Pending","Submitted","Assigned","Investigating","Resolved"],
default:"Submitted"
},

userId:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},

repliedBy:{
type:mongoose.Schema.Types.ObjectId,
ref:"User",
default:null
},

createdAt:{
type:Date,
default:Date.now
}

});

module.exports = mongoose.model("Complaint",complaintSchema);