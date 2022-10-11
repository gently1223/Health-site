require("events").EventEmitter.defaultMaxListeners = Infinity;

const NodeGeocoder = require('node-geocoder');

var bodyParser = require("body-parser");
var timezoneoffset = "+00:00";
var http = require("https");
var fs = require("fs");
var path = require("path");
var uuid = require('uuid');
var md5 = require('md5');

const mailchimpFactory = require("@mailchimp/mailchimp_transactional/src/index.js");
const mailchimpClient = mailchimpFactory("rfp0DPBp5KrrJveGczUZCw");

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

const stripe = require('stripe')('sk_test_zdC43mC0zWS9anYNO29aRLm7');

const stripePlaid = require('stripe')('sk_test_nLokeSl0PKT8NO9DFvk688Ta0082qAyqcJ');
const serverBase = 'https://veritap.conciergehealth.co';

// Posgress connection
const {
    Pool,
    Client
} = require('pg');


const connectionString = 'postgresql://doadmin:u3ue7itosyz79gqt@db-postgresql-sfo3-67017-do-user-441183-0.a.db.ondigitalocean.com:25060/defaultdb?sslmode=require?sslmode=require&ssl=true&rejectUnauthorized: false'
// const connectionString = 'postgresql://doadmin:tjoeiuwtzqalk7y0@db-postgresql-sfo2-82165-test-do-user-441183-0.b.db.ondigitalocean.com:25060/defaultdb?sslmode=require?sslmode=require&ssl=true&rejectUnauthorized: false'


const ppool = new Pool({
    connectionString: connectionString,
    ssl: false,
});


function main() {

                ppool.query("select * from memberships_1", function(err, rows) {
                
                    if (err) {
                        console.log("Load error: " + err);
                      process.exit(1);
                    } else {

                            if (rows.rows.length == 0) {
                                 console.log("NO ROWS !!!!");
                                process.exit(1);
                            } else {
                             
                                    for (let row of rows.rows) {

                                                var sql = "select * from public.user where LOWER(fname) = LOWER('" + row.firstName + "') and LOWER(lname) = LOWER('" + row.lastName + "')";
                                                console.log(sql);
                                            

                                             ppool.query(sql, function(err, person) {

                                                 if (err) {
                                                    console.log("Load error: " + err);
                                                   process.exit(1);
                                                 } 

                                                 if (person.rows.length > 0) {
                                                    
                                                         var program_id = 34;
                                                         var code =  "";
                                                         code = row.primaryCode;

                                                        if (code.substring(0,1) == "B") 
                                                        program_id = 35;


                                                        var a = "insert into member_program (status,user_id,program_id,membership) values (1," + person.rows[0].id + "," + program_id + ",'"  + code + "')  ON CONFLICT(user_id,program_id,membership) DO NOTHING;";
                                            
                                                        console.log(a);

                                                        ppool.query(a,  function(err, client_rows) { if (err)  console.log(err);});



                                                 } else {

                                                 }


                                             });


                                     }
                                        // console.log("======================================================");
                                       // process.exit(1);

                            }

                         
                    }


                });

                }

main();