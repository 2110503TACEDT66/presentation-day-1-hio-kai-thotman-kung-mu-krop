const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const {xss} = require('express-xss-sanitizer');
const rateLimit = require('express-rate-limit');
const hpp=require('hpp');
const cors=require('cors');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

const connectDB = require('./config/db');



//Load env vars
dotenv.config({path:'./config/config.env'});


//Conntect to DB
connectDB();

const app=express();

//Body Parser
app.use(express.json());

//Cookie parser
app.use(cookieParser());

//Sanitize (injections)
app.use(mongoSanitize());

//helmet
app.use(helmet());

//Prevent XSS attacks
app.use(xss());

//Rate limiting
const limiter=rateLimit({
    windowsMs:10*60*1000,//10 mins
    max:100
});
app.use(limiter);

//Prevent http param pollutions

app.use(hpp());

//Enable CORS

app.use(cors());

//Route files
const dentists = require ('./routes/dentists');
const auth = require('./routes/auth');
const appointments=require('./routes/appointments');

app.use('/api/v1/dentists',dentists);
app.use('/api/v1/auth',auth);
app.use('/api/v1/appointments',appointments);

const PORT=process.env.PORT || 5000;

const server = app.listen(PORT, console.log('Server running in '
    , process.env.NODE_ENV
    , ' mode on port ', PORT));

//Handle unhandled promise rejection
process.on('unhandledRejection',(err,promise)=>{
    console.log(`Error: ${err.message}`);
    //Close server & exit process
    server.close(()=>process.exit(1));
})

//Route files
//const dentists = require('./routes/dentists');

//app.use('api/v1/dentists',dentists);

const swaggerOptions={
    swaggerDefinition:{
        openapi: '3.0.0',
        info:{
            title: 'Library API',
            version: '1.0.0',
            description: 'A simple Express VacQ API'
        },
        servers: [
            {
                url: process.env.HOST + ":" + PORT + '/api/v1'
            }
        ],

    },
    
    apis:['./routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs',swaggerUI.serve, swaggerUI.setup(swaggerDocs));
