require("events").EventEmitter.defaultMaxListeners = Infinity;

const NodeGeocoder = require('node-geocoder');

var request = require("request");
var express = require("express");
var mysql = require("mysql");
var bodyParser = require("body-parser");
var app = express();
var timezoneoffset = "+00:00";
var http = require("https");
var jwt = require("jsonwebtoken");
var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
const pug = require("pug");
var uuid = require('uuid');
var md5 = require('md5');

const rawBodySaver =  (req, res, buf, encoding) =>{
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
}

const options = {
  verify: rawBodySaver
};

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

//Your api key, from Mailgun’s Control Panel
var api_key = '4485207e2be96d4ae96868cf41c96210-f135b0f1-d1ef1f39';

var plaid_url = 'https://sandbox.plaid.com';

//Your domain, from the Mailgun Control Panel
var domain = 'emailer.conciergehealth.com';

//Your sending email address
var from_who = 'Concierge Health<support@conciergehealth.com>';

var renewError = 'It appears we are having trouble verifying your eligibility. Make sure you copied your code or typed it correctly. If you are still having trouble, please call the Customer Service phone number on your health plan member ID card and they will be glad to assist you.';
var onePassError = 'We are having trouble verifying your eligibility. Make sure you copied your code or typed it correctly. Please call the One Pass team at 877-504-6830 and they will be glad to assist you.';


var pool = mysql.createPool({
    connectionLimit: 100, //important
    host: "104.131.80.77",
    user: "alonehealthdata",
    password: "4tqYFLTdXdksTQC",
    database: "hdn",
    debug: false,
});

const ppool = new Pool({
    connectionString: connectionString,
    ssl: false,
});

var eic = "4tqYFLTdXdksTQC";

var router = express.Router();

var allowCrossDomain = function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, Content-Length, X-Requested-With"
    );

    next();
};

app.use(allowCrossDomain);
app.use(bodyParser.json(options)); // to support JSON-encoded bodies
app.use(
    bodyParser.urlencoded({
        // to support URL-encoded bodies
        extended: true,
    })
);



// ******************************************************************************************************************************************************************************************
// TEST SPECIFIC CODE
// ******************************************************************************************************************************************************************************************
// update beacons_list set date_last_seen = NOW() where applicationID = '123-123-123-13123-12313-12312-001'

// ******************************************************************************************************************************************************************************************
// USER SPECIFIC CODE
// ******************************************************************************************************************************************************************************************

// NEW USERS
//  select count(day) as count, day ,DATE_FORMAT(lastUpdate,'%m-%d-%Y') as date from (
//     SELECT b1.user_id  , MIN(b1.day) as day,lastUpdate FROM beacon_daily_counter_user as b1 GROUP BY b1.user_id
// ) as b2 group by day

// TOTAL USERS
// select  count(day) as count,day as day,DATE_FORMAT(lastUpdate,'%m-%d-%Y') as date from beacon_daily_counter_user group by day order by day

// select count(day),day as newusers from (
//  select b1.user_id, b1.applicationID,b1.lastUpdate, min(day) as day from beacon_daily_counter_user as b1  group by b1.user_id
// ) as b2  group by day

// EXCEPTION REPORT
// insert into `beacon_daily_counter_user` (applicationID,checkin,lastUpdate,user_id,`day`)
// SELECT "123-123-123-13123-12313-12312-125",1,createDate,objectID,DAYOFYEAR(createDate) FROM beacon_import_users WHERE id > 831 and createDate AND objectID NOT IN (SELECT distinct user_id FROM beacon_daily_counter_user)

// function add_event(appid, userid, eventType) {

//    pool.getConnection(function(err, connection) {

//         if (err) {
//             res.json({
//                 "code": 100,
//                 "status": err
//             });

//             return;
//         }

//          console.log("insert into hdn_events (applicationID,user_id,day,lastUpdate,event_name,event,state,type) values ('" + appid + "', '" + userid + "'" + ",DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')),CONVERT_TZ(NOW(),'+00:00','+00:00'),'" + eventType + "'" + ",0,1,'member')");
//             connection.query("insert into hdn_events (applicationID,user_id,day,lastUpdate,event_name,event,state,type) values ('" + appid + "', '" + userid + "'" + ",DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')),CONVERT_TZ(NOW(),'+00:00','+00:00'),'" + eventType + "'" + ",0,1,'member')", function(err, rows) {

//         });

//         connection.release();

//         connection.on('error', function(err) {
//             connection.release();
//             res.json({
//                 "code": 100,
//                 "status": err
//             });

//             return;
//         });
//     });

function handle_all_user_total_analytics(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var appid = req.params.appid;
        //var day = DAYOFYEAR(CONVERT_TZ(CURDATE(),'+00:00','+00:00'));
        // var user = req.body.user;

        if (appid) {
            console.log(
                "select count(day) as value,day as day,DATE_FORMAT(lastUpdate,'%m-%d-%Y') as date from beacon_daily_counter_user where  year = YEAR(NOW()) and applicationID = '" +
                appid +
                "' group by  DAY(lastUpdate) order by  DAY(lastUpdate)"
            );

            connection.query(
                "select count(day) as value,day as day,DATE_FORMAT(lastUpdate,'%m-%d-%Y') as date from beacon_daily_counter_user where  year = YEAR(NOW()) and applicationID = '" +
                appid +
                "' group by  DAY(lastUpdate) order by  DAY(lastUpdate)",
                function(err, rows) {
                    res.header("Access-Control-Allow-Origin", "*");
                    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                    res.header("Access-Control-Allow-Headers", "Content-Type");
                    res.header(
                        "Access-Control-Allow-Headers",
                        "Content-Type, Authorization, Content-Length, X-Requested-With"
                    );

                    //if (!err) {
                    res.json(rows);
                    //}
                }
            );
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_all_new_user_total_analytics(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        //var appid = req.params.appid;
        //var day = DAYOFYEAR(CONVERT_TZ(CURDATE(),'+00:00','+00:00'));
        // var user = req.body.user;

        //if (appid) {
        console.log(
            "select b3.company, b2.username, b1.user_id, b1.applicationID,b1.lastUpdate, min(day) as day from beacon_daily_counter_user as b1, beacon_import_users as b2, hdn_company as b3  where   year=YEAR(NOW()) and b1.applicationID = b3.applicationID and b1.user_id = b2.objectId group by applicationID,b1.user_id order by  DAY(lastUpdate) desc, applicationID"
        );

        connection.query(
            "select b3.company, b2.username, b1.user_id, b1.applicationID,b1.lastUpdate, min(day) as day from beacon_daily_counter_user as b1, beacon_import_users as b2, hdn_company as b3  where   year= YEAR(NOW()) and b1.applicationID = b3.applicationID and b1.user_id = b2.objectId group by applicationID,b1.user_id order by  DAY(lastUpdate) desc, applicationID",
            function(err, rows) {
                //if (!err) {
                res.json(rows);
                //}
            }
        );
        //}

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_new_user_total_analytics(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var appid = req.params.appid;
        //var day = DAYOFYEAR(CONVERT_TZ(CURDATE(),'+00:00','+00:00'));
        // var user = req.body.user;

        if (appid) {
            console.log(
                "select count(day) as value,day as day,DATE_FORMAT(lastUpdate,'%m-%d-%Y') as date from (select b1.user_id, b1.applicationID,b1.lastUpdate, min(day) as day from beacon_daily_counter_user as b1 where  year=YEAR(NOW()) and applicationID = '" +
                appid +
                "' group by b1.user_id) as b2  group by day"
            );

            connection.query(
                "select count(day) as value,day as day,DATE_FORMAT(lastUpdate,'%m-%d-%Y') as date from (select b1.user_id, b1.applicationID,b1.lastUpdate, min(day) as day from beacon_daily_counter_user as b1 where  year=YEAR(NOW()) and applicationID = '" +
                appid +
                "' group by b1.user_id) as b2  group by day",
                function(err, rows) {
                    res.header("Access-Control-Allow-Origin", "*");
                    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                    res.header("Access-Control-Allow-Headers", "Content-Type");
                    res.header(
                        "Access-Control-Allow-Headers",
                        "Content-Type, Authorization, Content-Length, X-Requested-With"
                    );

                    //if (!err) {
                    res.json(rows);
                    //}
                }
            );
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

// SELECT IF(COUNT(1) > 0, 1, 0) AS has_consec FROM (SELECT * FROM ( SELECT IF(b.lastUpdate IS NULL, @val:=@val+1, @val) AS consec_set FROM beacon_daily_counter_user a CROSS JOIN (SELECT @val:=0) var_init LEFT JOIN beacon_daily_counter_user b ON  a.user_id = b.user_id AND DATE(a.lastUpdate) = DATE(b.lastUpdate) + INTERVAL 1 DAY WHERE a.user_id = 'Sb1yWVSNqI' ) a GROUP BY a.consec_set HAVING COUNT(1) >= 5) a

function handle_user_information_class_members(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        console.log(
            "select userid,fname,lname, source_id,MAX(date) as date from device_heart_monitor,users where users.id = device_heart_monitor.userid  and DATE(date) = DATE(NOW()) group by DATE(date),userid order by date desc"
        );

        connection.query(
            "select userid,fname,lname, source_id,MAX(date) as date from device_heart_monitor,users where users.id = device_heart_monitor.userid  and DATE(date) = DATE(NOW()) group by DATE(date),userid order by date desc",
            function(err, rows) {
                //if (!err) {
                res.json(rows);
                //}
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_user_information_booking(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        if (userid) {
            console.log(
                "select * from hdn_myschedule,hdn_classes where  hdn_myschedule.user_id = " +
                userid +
                " and hdn_myschedule.class_id  = hdn_classes.id order by event_date desc limit 1"
            );

            connection.query(
                "select * from hdn_myschedule,hdn_classes where  hdn_myschedule.user_id = " +
                userid +
                " and hdn_myschedule.class_id  = hdn_classes.id order by event_date desc limit 1",
                function(err, rows) {
                    //if (!err) {
                    res.json(rows);
                    //}
                }
            );
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_user_information_classes(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        if (userid) {
            console.log(
                "select * from hdn_report_booking where MONTH(event_date) = MONTH(CURDATE()) and YEAR(event_date) = YEAR(CURDATE()) and user_id = " +
                userid +
                " limit 31"
            );

            connection.query(
                "select * from hdn_report_booking where MONTH(event_date) = MONTH(CURDATE()) and YEAR(event_date) = YEAR(CURDATE()) and user_id = " +
                userid +
                " limit 31",
                function(err, rows) {
                    //if (!err) {
                    res.json(rows);
                    //}
                }
            );
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_user_information_checkin(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        if (userid) {
            console.log(
                "select * from hdn_report_checkin where MONTH(checkin) = MONTH(CURDATE())  and YEAR(checkin) = YEAR(CURDATE()) and user_ID = " +
                userid +
                " limit 311"
            );

            connection.query(
                "select * from hdn_report_checkin where MONTH(checkin) = MONTH(CURDATE())  and YEAR(checkin) = YEAR(CURDATE()) and user_ID = " +
                userid +
                " limit 31",
                function(err, rows) {
                    //if (!err) {
                    res.json(rows);
                    //}
                }
            );
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

// insert ignore into hdn_report_checkin (fname,lname,memnum,checkin, company, name,address,city,state,zip,lat,lng,company_id,user_id,location_id)
// select fname,lname,memnum,NOW() as checkin, hdn_company.company, hdn_locations.name,hdn_locations.address,hdn_locations.city,hdn_locations.state,hdn_locations.zip,hdn_locations.lat,hdn_locations.lng,users.company_id,users.id,hdn_locations.id
// from users left join hdn_company on users.company_id = hdn_company.id left join hdn_locations on users.source_id = hdn_locations.id and hdn_locations.company_id = users.company_id where users.id = 155722020

function handle_post_user_checkin(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.body.userid;
        var locationid = req.body.locationid;

        if (userid && locationid) {
            console.log(
                "insert ignore into hdn_report_checkin (fname,lname,memnum,scancode,checkin, company, name,address,city,state,zip,lat,lng,company_id,user_id,location_id) select fname,lname,memnum,scancode,NOW() as checkin, hdn_company.company,hdn_locations.name,hdn_locations.address,hdn_locations.city,hdn_locations.state,hdn_locations.zip,hdn_locations.lat,hdn_locations.lng,users.company_id,users.id,hdn_locations.id from users left join hdn_locations on " +
                locationid +
                " = hdn_locations.id left join hdn_company on hdn_locations.company_id = hdn_company.id where users.id = " +
                userid
            );
            connection.query(
                "insert ignore into hdn_report_checkin (fname,lname,memnum,scancode,checkin, company, name,address,city,state,zip,lat,lng,company_id,user_id,location_id) select fname,lname,memnum,scancode,NOW() as checkin, hdn_company.company,hdn_locations.name,hdn_locations.address,hdn_locations.city,hdn_locations.state,hdn_locations.zip,hdn_locations.lat,hdn_locations.lng,users.company_id,users.id,hdn_locations.id from users left join hdn_locations on " +
                locationid +
                " = hdn_locations.id left join hdn_company on hdn_locations.company_id = hdn_company.id where users.id = " +
                userid,
                function(err, rows) {

                    connection.query(
                        "insert into ch_activities (user_id,location_id,timestamp,checkin,name) select users.id as user_id,hdn_locations.id as location_id ,NOW() as timestamp,1 as checkin,company as name from users left join hdn_locations on " +
                        locationid +
                        " = hdn_locations.id left join hdn_company on hdn_locations.company_id = hdn_company.id where users.id = " + userid,
                        function(err, rows) {


                        }
                    );

                    res.json({
                        code: 200,
                    });

                }
            );
        } else {
            res.json({
                code: 200,
            });
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_get_user_checkin_demo(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        console.log(
            "select hdn_report_checkin.*,users.avatar,users.eligibility_status,users.eligibility_reason from hdn_report_checkin left join users on users.id = hdn_report_checkin.user_id  WHERE `checkin` BETWEEN (DATE_SUB(NOW(),INTERVAL 5 MINUTE)) AND NOW() order by id desc limit 30"
        );

        connection.query(
            "select hdn_report_checkin.*,users.avatar,users.eligibility_status,users.eligibility_reason from hdn_report_checkin left join users on users.id = hdn_report_checkin.user_id  WHERE `checkin` BETWEEN (DATE_SUB(NOW(),INTERVAL 5 MINUTE)) AND NOW() order by id desc limit 30",
            function(err, rows) {
                //if (!err) {
                res.json(rows);
                //}
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_get_user_checkin(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        if (userid) {
            console.log(
                "select * from hdn_report_checkin where  YEAR(checkin) = YEAR(CURDATE()) and user_ID = " +
                userid +
                " limit 365"
            );

            connection.query(
                "select * from hdn_report_checkin where  YEAR(checkin) = YEAR(CURDATE()) and user_ID = " +
                userid +
                " limit 365",
                function(err, rows) {
                    //if (!err) {
                    res.json(rows);
                    //}
                }
            );
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_user_information_visits(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        if (userid) {
            console.log(
                "select * from hdn_report_hrclass where MONTH(event_date) = MONTH(CURDATE()) and YEAR(event_date) = YEAR(CURDATE()) and user_ID = '" +
                userid +
                "' limit 31"
            );

            connection.query(
                "select * from hdn_report_hrclass where MONTH(event_date) = MONTH(CURDATE())  and YEAR(event_date) = YEAR(CURDATE()) and user_ID = '" +
                userid +
                "' limit 31",
                function(err, rows) {
                    //if (!err) {
                    res.json(rows);
                    //}
                }
            );
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_user_information_visits_v2(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        if (userid) {
            console.log(
                "select * from hdn_report_checkin where MONTH(checkin) = MONTH(CURDATE()) and YEAR(checkin) = YEAR(CURDATE()) and user_ID = '" +
                userid +
                "' limit 31"
            );

            connection.query(
                "select * from hdn_report_checkin where MONTH(checkin) = MONTH(CURDATE())  and YEAR(checkin) = YEAR(CURDATE()) and user_ID = '" +
                userid +
                "' limit 31",
                function(err, rows) {
                    //if (!err) {
                    res.json(rows);
                    //}
                }
            );
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_set_activation(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var activationcode = req.params.activationcode;
        var membershipid = req.params.membershipid;

        console.log(
            "replace hdn_activation set code = '" +
            activationcode +
            "', gymfarm_id = '" +
            membershipid +
            "'"
        );
        connection.query(
            "replace hdn_activation set code = '" +
            activationcode +
            "', gymfarm_id = '" +
            membershipid +
            "'",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_get_activation(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var activationcode = req.params.activationcode;

        if (activationcode) {
            console.log(
                "select * from hdn_activation where code = '" + activationcode + "'"
            );

            connection.query(
                "select * from hdn_activation where code = '" + activationcode + "'",
                function(err, rows) {
                    res.json(rows);
                }
            );
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_get_checkin_info(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        console.log(
            "select users.id, users.fname,users.lname,hdn_company.applicationID from users,hdn_company  where hdn_company.id = users.company_id and (users.id = " +
            userid +
            " or memnum = '" +
            userid +
            "')"
        );
        connection.query(
            "select users.id, users.fname,users.lname,hdn_company.applicationID from users,hdn_company  where hdn_company.id = users.company_id and (users.id = " +
            userid +
            " or memnum = '" +
            userid +
            "')",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_user_membership(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var membershipid = req.params.membershipid;

        if (membershipid) {
            console.log(
                "select * from users where gymfarm_id = '" + membershipid + "'"
            );

            connection.query(
                "select * from users where gymfarm_id = '" + membershipid + "'",
                function(err, rows) {
                    //if (!err) {
                    res.json(rows);
                    //}
                }
            );
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_user_consecutive_visits(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        if (userid) {
            console.log(
                "select PreQuery.user_ID,sum( PreQuery.NextVisit ) as DistinctVisits,count(*) as TotalDays from (  select v.user_id,  if( @LUser <> v.User_ID OR @LDate < ( date( v.lastUpdate ) - Interval 1 day ), 1, 0 ) as NextVisit,  @LUser := v.user_id, @LDate := date( v.lastUpdate ) from  beacon_daily_counter_user v,( select @LUser := -1, @LDate := date(now()) ) AtVars  where  year=YEAR(NOW()) and user_ID = '" +
                userid +
                "' order by v.user_id, v.lastUpdate  ) PreQuery group by  PreQuery.User_ID"
            );

            connection.query(
                "select PreQuery.user_ID,sum( PreQuery.NextVisit ) as DistinctVisits,count(*) as TotalDays from (  select v.user_id,  if( @LUser <> v.User_ID OR @LDate < ( date( v.lastUpdate ) - Interval 1 day ), 1, 0 ) as NextVisit,  @LUser := v.user_id, @LDate := date( v.lastUpdate ) from  beacon_daily_counter_user v,( select @LUser := -1, @LDate := date(now()) ) AtVars  where  year=YEAR(NOW()) and user_ID = '" +
                userid +
                "' order by v.user_id, v.lastUpdate  ) PreQuery group by  PreQuery.User_ID",
                function(err, rows) {
                    //if (!err) {
                    res.json(rows);
                    //}
                }
            );
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_user_consecutive_days(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;
        var days = req.params.days;

        if (userid) {
            console.log(
                "SELECT IF(COUNT(1) > 0, 1, 0) AS has_consec FROM (SELECT * FROM ( SELECT IF(b.lastUpdate IS NULL, @val:=@val+1, @val) AS consec_set FROM beacon_daily_counter_user a CROSS JOIN (SELECT @val:=0) var_init LEFT JOIN beacon_daily_counter_user b ON  a.user_id = b.user_id AND DATE(a.lastUpdate) = DATE(b.lastUpdate) + INTERVAL 1 DAY WHERE a.user_id = '" +
                userid +
                "' ) a GROUP BY a.consec_set HAVING COUNT(1) >= " +
                days +
                ") a"
            );

            connection.query(
                "SELECT IF(COUNT(1) > 0, 1, 0) AS has_consec FROM (SELECT * FROM ( SELECT IF(b.lastUpdate IS NULL, @val:=@val+1, @val) AS consec_set FROM beacon_daily_counter_user a CROSS JOIN (SELECT @val:=0) var_init LEFT JOIN beacon_daily_counter_user b ON  a.user_id = b.user_id AND DATE(a.lastUpdate) = DATE(b.lastUpdate) + INTERVAL 1 DAY WHERE a.user_id = '" +
                userid +
                "' ) a GROUP BY a.consec_set HAVING COUNT(1) >= " +
                days +
                ") a",
                function(err, rows) {
                    //if (!err) {
                    res.json(rows);
                    //}
                }
            );
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_user_analytics(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        // var appid = req.body.appid;
        var userid = req.params.userid;

        if (userid) {
            console.log(
                "select * from beacon_daily_counter_user where   YEAR(lastUpdate)=YEAR(NOW()) and user_id = " +
                userid +
                " and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))"
            );

            connection.query(
                "select * from beacon_daily_counter_user where   YEAR(lastUpdate)=YEAR(NOW()) and user_id = " +
                userid +
                " and day =  DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))",
                function(err, rows) {
                    //if (!err) {
                    res.json(rows);
                    //}
                }
            );
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_beacon_event(req, res, eventType) {
    // !!!!!! DISABLE FOR THE MOMENT!!!!!!
    /*    pool.getConnection(function(err, connection) {

              if (err) {
                  res.json({
                      "code": 100,
                      "status": err
                  });

                  return;
              }

              var appid = req.body.appid;
              var userid = req.body.userid;
              var user = req.body.user;

              if (user) {
                  userid = user;
              }
              if (!userid) {
                  userid = 0;
              }

              // Check for first time member
              console.log("!!! select * from hdn_events where user_id = '" + userid + "' and applicationID = '" + appid + "'");
              connection.query("select * from hdn_events where user_id = '" + userid + "' and applicationID = '" + appid + "'", function(err, rows) {

                  if (rows.length == 0) {
                      console.log("insert into hdn_events (applicationID,user_id,day,lastUpdate,event_name,event,state,type) values ('" + appid + "', '" + userid + "'" + ",DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')),CONVERT_TZ(NOW(),'+00:00','+00:00'),'" + eventType + "'" + ",0,1,'member')");
                      connection.query("insert into hdn_events (applicationID,user_id,day,lastUpdate,event_name,event,state,type) values ('" + appid + "', '" + userid + "'" + ",DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')),CONVERT_TZ(NOW(),'+00:00','+00:00'),'" + eventType + "'" + ",0,1,'member')", function(err, rows) {
                          // res.json(rows);
                      });
                  }

              });


              connection.release();

              connection.on('error', function(err) {
                  connection.release();
                  res.json({
                      "code": 100,
                      "status": err
                  });

                  return;
              });
          });*/
}

function handle_user_class_rating(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var classid = req.body.classid;
        var rate = req.body.rate;

        console.log(
            "update hdn_classes set rating = (rating + " +
            rate +
            ") * .5 where id = " +
            classid
        );
        connection.query(
            "update hdn_classes set rating = (rating + " +
            rate +
            ") * .5 where id = " +
            classid,
            function(err, rows) {
                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_user_analytics_add(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var appid = req.body.appid;
        var count = 0;
        var field = "usage";
        var user = req.body.user;

        // // THIS IS TEMP CODE UNTIL I CAN UPDATE THE MOBILE PLATFORMS!!!!!
        //if (!appid)
        //  appid = "123-123-123-13123-12313-12312-125";

        // if (user) {

        //     console.log("select * from beacon_daily_counter_user where year= YEAR(NOW()) and user_id = '" + user + "' and  applicationID = '" + appid + "'  and day =  DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))");
        //     connection.query("select * from beacon_daily_counter_user where year= YEAR(NOW()) and user_id = '" + user + "' and  applicationID = '" + appid + "'  and day =  DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))", function(err, rows) {

        //         if (rows.length > 0) {
        //             console.log("update beacon_daily_counter_user a set  a." + field + " = 1 where   year= YEAR(NOW()) and user_id = '" + user + " and  applicationID = '" + appid + "'  and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))");
        //             connection.query("update beacon_daily_counter_user a set  a." + field + " = 1 where   year= YEAR(NOW()) and user_id = '" + user + "' and  applicationID = '" + appid + "'  and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))", function(err, rows) {
        //                 res.json(rows);
        //             });
        //         } else {
        //             console.log("insert into beacon_daily_counter_user (applicationID,`day`,lastUpdate,user_id) values ('" + appid + "' ,  DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')) ,CONVERT_TZ(NOW(),'+00:00','+00:00'),'" + user + "')");
        //             connection.query("insert into beacon_daily_counter_user (applicationID,`day`,lastUpdate,user_id) values ('" + appid + "' ,  DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')) ,CONVERT_TZ(NOW(),'+00:00','+00:00'),'" + user + "')", function(err, rows) {

        //                 console.log("update beacon_daily_counter_user a set  a." + field + " = 1  where   year= YEAR(NOW()) and user_id = '" + user + " and  applicationID = '" + appid + "'  and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))");
        //                 connection.query("update beacon_daily_counter_user a set  a." + field + " = 1   year= YEAR(NOW()) and where  user_id = '" + user + "' and  applicationID = '" + appid + "'  and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))", function(err, rows) {
        //                     res.json(rows);
        //                 });

        //             });

        //             handle_beacon_event(req, res, 'NEW');
        //         }

        //     });

        // }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_user_information_add(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var appid = req.body.appid;
        var count = 0;
        // var field = "usage";
        var user = req.body.user;
        var name = req.body.name;
        var email = req.body.email;

        var field = "checkin";

        // TEMP CODE TILL ALL FRAMEWORKS APLLE ARE
        //if (!appid)
        //  appid = "123-123-123-13123-12313-12312-125";

        //Add the user to the production database
        connection.query(
            "insert into beacon_import_users set objectID = '" +
            user +
            "', username = '" +
            name +
            "', email = '" +
            email +
            "', applicationID = '" +
            appid +
            "', createDate = CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')",
            function(err, rows) {
                //res.json(rows);
                // Create a daily record for this user to balance out the books
                // if (user) {
                //     console.log("select * from beacon_daily_counter_user where  user_id = '" + user + "' and  applicationID = '" + appid + "'  and day =  DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))");
                //     connection.query("select * from beacon_daily_counter_user where  user_id = '" + user + "' and  applicationID = '" + appid + "'  and day =  DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))", function(err, rows) {
                //      if(rows.length  > 0){
                //             console.log("update beacon_daily_counter_user a set  a." + field + " =  1  where  user_id = '" + user +  " and  applicationID = '" + appid + "'  and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))");
                //             connection.query("update beacon_daily_counter_user a set  a." + field + " = 1  where  user_id = '" + user + "' and  applicationID = '" + appid + "'  and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))", function(err, rows) {
                //                 res.json(rows);
                //             });
                //     }
                //     else
                //     {
                //               connection.query("insert into beacon_daily_counter_user (applicationID,`day`,lastUpdate,user_id) values ('" + appid + "' ,  DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')) ,CONVERT_TZ(NOW(),'+00:00','+00:00'),'" + user + "')", function(err, rows) {
                //                 console.log("update beacon_daily_counter_user a set  a." + field + " =  1  where  user_id = '" + user +  " and  applicationID = '" + appid + "'  and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))");
                //                     connection.query("update beacon_daily_counter_user a set  a." + field + " = 1  where  user_id = '" + user + "' and  applicationID = '" + appid + "'  and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))", function(err, rows) {
                //                      res.json(rows);
                //                  });
                //         });
                //     }
                //   });
                // }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function getDateTime(ddate) {
    var date = new Date(ddate);

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + "-" + month + "-" + day + " " + hour + ":" + min + ":" + sec;
}

function handle_user_analytics_update_stats(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var appid = req.body.appid;
        var count = req.body.count;
        var field = req.body.field;
        var user = req.body.user;
        var day = req.body.day;
        var transaction = req.body.transaction;
        var zone = req.body.zone;
        var calories = req.body.calories;

        if (zone) {} else {
            zone = 0;
        }

        if (transaction) {} else {
            transaction = day;
        }

        if (calories === undefined) {
            calories = 0;
        }

        // } else {
        //     calories = 0;
        // }

        // Only let chekin value eqaul 0 or 1

        // STOP stpe date from running
        // STOP stpe date from running
        if (!appid) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        console.log(
            "!============================================================================================================================================"
        );

        console.log(
            "select * from beacon_daily_counter_user where year = YEAR(NOW()) and user_id = " +
            user +
            " and  applicationID = '" +
            appid +
            "'  and day =  DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))"
        );
        connection.query(
            "select * from beacon_daily_counter_user where year = YEAR(NOW()) and  user_id = " +
            user +
            " and  applicationID = '" +
            appid +
            "'  and day =  DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))",
            function(err, rows) {
                if (rows.length > 0) {
                    console.log(
                        "update beacon_daily_counter_user a set  a." +
                        field +
                        " = " +
                        count +
                        " where year = YEAR(NOW()) and user_id = " +
                        user +
                        " and  applicationID = '" +
                        appid +
                        "'  and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))"
                    );
                    connection.query(
                        "update beacon_daily_counter_user a set  a." +
                        field +
                        " =  " +
                        count +
                        " where year = YEAR(NOW()) and user_id = " +
                        user +
                        " and  applicationID = '" +
                        appid +
                        "'  and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))",
                        function(err, rows) {
                            if (field != "checkin" && field != "steps" && field != "heart") {
                                res.json(rows);
                            }
                        }
                    );
                } else {
                    console.log(
                        "insert into beacon_daily_counter_user (applicationID,`day`,lastUpdate,user_id) values ('" +
                        appid +
                        "' ,  DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')) ,CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')," +
                        user +
                        ")"
                    );
                    connection.query(
                        "insert into beacon_daily_counter_user (applicationID,`day`,lastUpdate,user_id) values ('" +
                        appid +
                        "' ,  DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')) ,CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')," +
                        user +
                        ")",
                        function(err, rows) {
                            console.log(
                                "update beacon_daily_counter_user set  " +
                                field +
                                " = " +
                                count +
                                " where  user_id = " +
                                user +
                                " and  applicationID = '" +
                                appid +
                                "' and YEAR(lastUpdate) = YEAR(NOW())"
                            );
                            connection.query(
                                "update beacon_daily_counter_user set  " +
                                field +
                                " = " +
                                count +
                                " where  user_id = " +
                                user +
                                " and  applicationID = '" +
                                appid +
                                "' and YEAR(lastUpdate) = YEAR(NOW())",
                                function(err, rows) {
                                    if (
                                        field != "checkin" &&
                                        field != "steps" &&
                                        field != "heart"
                                    ) {
                                        res.json(rows);
                                    }
                                }
                            );
                        }
                    );

                    handle_beacon_event(req, res, "NEW");
                }
            }
        );

        if (field == "checkin") {
            count = 1;

            console.log(
                "!============================================================================================================================================"
            );

            console.log(
                "select * from beacon_daily_counter_user where year = YEAR(NOW()) and user_id = " +
                user +
                " and  applicationID = '" +
                appid +
                "'  and day =  DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))"
            );
            connection.query(
                "select * from beacon_daily_counter_user where year = YEAR(NOW()) and  user_id = " +
                user +
                " and  applicationID = '" +
                appid +
                "'  and day =  DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))",
                function(err, rows) {
                    if (rows.length > 0) {
                        console.log(
                            "update beacon_daily_counter_user a set  a." +
                            field +
                            " = " +
                            count +
                            " where year = YEAR(NOW()) and user_id = " +
                            user +
                            " and  applicationID = '" +
                            appid +
                            "'  and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))"
                        );
                        connection.query(
                            "update beacon_daily_counter_user a set  a." +
                            field +
                            " =  " +
                            count +
                            " where year = YEAR(NOW()) and user_id = " +
                            user +
                            " and  applicationID = '" +
                            appid +
                            "'  and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))",
                            function(err, rows) {
                                res.json(rows);
                            }
                        );
                    } else {
                        //update_reward_points(user,10);

                        console.log(
                            "insert into beacon_daily_counter_user (applicationID,`day`,lastUpdate,user_id) values ('" +
                            appid +
                            "' ,  DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')) ,CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')," +
                            user +
                            ")"
                        );
                        connection.query(
                            "insert into beacon_daily_counter_user (applicationID,`day`,lastUpdate,user_id) values ('" +
                            appid +
                            "' ,  DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')) ,CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')," +
                            user +
                            ")",
                            function(err, rows) {
                                console.log(
                                    "update beacon_daily_counter_user a set  a." +
                                    field +
                                    " = " +
                                    count +
                                    "  where  year = YEAR(NOW()) and user_id = " +
                                    user +
                                    " and  applicationID = '" +
                                    appid +
                                    "'  and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))"
                                );
                                connection.query(
                                    "update beacon_daily_counter_user a set  a." +
                                    field +
                                    " = " +
                                    count +
                                    " year = YEAR(NOW()) and where  user_id = " +
                                    user +
                                    " and  applicationID = '" +
                                    appid +
                                    "'  and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))",
                                    function(err, rows) {}
                                );
                            }
                        );

                        handle_beacon_event(req, res, "NEW");
                    }
                }
            );

            console.log(
                "!============================================================================================================================================"
            );
        } else if (field == "steps") {
            console.log(
                "!============================================================================================================================================"
            );

            if (count > 0) {
                console.log(
                    "replace into exercise_entry_user (minutes,calories,date,exerciseid,userid,steps) VALUES (" +
                    (count / 1000 / 3) * 60 +
                    "," +
                    count / 20 +
                    ",CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'),730," +
                    user +
                    "," +
                    count +
                    ")"
                );
                connection.query(
                    "replace into exercise_entry_user (minutes,calories,date,exerciseid,userid,steps) VALUES (" +
                    (count / 1000 / 3) * 60 +
                    "," +
                    count / 20 +
                    ",CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'),730," +
                    user +
                    "," +
                    count +
                    ")",
                    function(err, rows) {}
                );
            }

            console.log(
                "select * from hdn_checkin_steps_year where user_id = " +
                user +
                " and  applicationID = '" +
                appid +
                "' and YEAR(lastUpdate) = YEAR(NOW())"
            );
            connection.query(
                "select * from hdn_checkin_steps_year where user_id = " +
                user +
                " and  applicationID = '" +
                appid +
                "' and YEAR(lastUpdate) = YEAR(NOW())",
                function(err, rows) {
                    if (rows.length > 0) {
                        // update_reward_points(user,1);

                        console.log(
                            "update hdn_checkin_steps_year set  `" +
                            day +
                            "` = " +
                            count +
                            " where  user_id = " +
                            user +
                            " and  applicationID = '" +
                            appid +
                            "' and YEAR(lastUpdate) = YEAR(NOW())"
                        );
                        connection.query(
                            "update hdn_checkin_steps_year set  `" +
                            day +
                            "` = " +
                            count +
                            " where  user_id = " +
                            user +
                            " and  applicationID = '" +
                            appid +
                            "' and YEAR(lastUpdate) = YEAR(NOW())",
                            function(err, rows) {
                                res.json(rows);
                            }
                        );
                    } else {
                        console.log(
                            "insert into hdn_checkin_steps_year (applicationID,`" +
                            day +
                            "`,lastUpdate,user_id) values ('" +
                            appid +
                            "' ,  " +
                            count +
                            " ,CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')," +
                            user +
                            ")"
                        );
                        connection.query(
                            "insert into hdn_checkin_steps_year (applicationID,`" +
                            day +
                            "`,lastUpdate,user_id) values ('" +
                            appid +
                            "' ,  " +
                            count +
                            " ,CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')," +
                            user +
                            ")",
                            function(err, rows) {
                                res.json(rows);
                            }
                        );
                    }
                }
            );

            console.log(
                "!============================================================================================================================================"
            );
        } else if (field == "heart") {
            console.log(
                "!============================================================================================================================================"
            );

            console.log(
                "!!!!! select * from device_heart_monitor where transaction = " +
                transaction +
                " and userid = " +
                user +
                " and date > DATE_SUB( CURRENT_TIME(), INTERVAL 10 SECOND)"
            );
            connection.query(
                "select * from device_heart_monitor where transaction = " +
                transaction +
                " and userid = " +
                user +
                " and date > DATE_SUB( CURRENT_TIME(), INTERVAL 10 SECOND)",
                function(err, rrows) {
                    if (rrows.length == 0) {
                        console.log(
                            "!!!!!! INSERT INTO device_heart_monitor (userid,hr_heartrate,transaction,intensity,calories,date) VALUES (" +
                            user +
                            "," +
                            count +
                            "," +
                            transaction +
                            "," +
                            zone +
                            "," +
                            calories +
                            ", NOW() )"
                        );
                        connection.query(
                            "INSERT INTO device_heart_monitor (userid,hr_heartrate,transaction,intensity,calories,date) VALUES (" +
                            user +
                            "," +
                            count +
                            "," +
                            transaction +
                            "," +
                            zone +
                            "," +
                            calories +
                            ", NOW() )",
                            function(err, rows) {
                                console.log(
                                    "replace hdn_realtime_heart(deviceNumber,heartRate) VALUES('" +
                                    user +
                                    "'," +
                                    count +
                                    ")"
                                );
                                connection.query(
                                    "replace hdn_realtime_heart(deviceNumber,heartRate) VALUES('" +
                                    user +
                                    "'," +
                                    count +
                                    ")",
                                    function(err, rows) {}
                                );
                            }
                        );
                    }
                }
            );

            console.log(
                "select * from hdn_checkin_heart_year where user_id = " +
                user +
                " and  applicationID = '" +
                appid +
                "' and YEAR(lastUpdate) = YEAR(NOW())"
            );
            connection.query(
                "select * from hdn_checkin_heart_year where user_id = " +
                user +
                " and  applicationID = '" +
                appid +
                "' and YEAR(lastUpdate) = YEAR(NOW())",
                function(err, rows) {
                    if (rows.length > 0) {
                        console.log(
                            "update hdn_checkin_heart_year set  `" +
                            day +
                            "` = " +
                            count +
                            " where  user_id = " +
                            user +
                            " and  applicationID = '" +
                            appid +
                            "' and YEAR(lastUpdate) = YEAR(NOW())"
                        );
                        connection.query(
                            "update hdn_checkin_heart_year set  `" +
                            day +
                            "` = " +
                            count +
                            " where  user_id = " +
                            user +
                            " and  applicationID = '" +
                            appid +
                            "' and YEAR(lastUpdate) = YEAR(NOW())",
                            function(err, rows) {
                                res.json(rows);
                            }
                        );
                    } else {
                        // update_reward_points(user,5);

                        console.log(
                            "insert into hdn_checkin_heart_year (applicationID,`" +
                            day +
                            "`,lastUpdate,user_id) values ('" +
                            appid +
                            "' ,  " +
                            count +
                            " ,CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')," +
                            user +
                            ")"
                        );
                        connection.query(
                            "insert into hdn_checkin_heart_year (applicationID,`" +
                            day +
                            "`,lastUpdate,user_id) values ('" +
                            appid +
                            "' ,  " +
                            count +
                            " ,CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')," +
                            user +
                            ")",
                            function(err, rows) {
                                res.json(rows);
                            }
                        );
                    }
                }
            );

            console.log(
                "!============================================================================================================================================"
            );
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_user_analytics_update_usage(req, res) {
    handle_user_analytics_update_stats(req, res);
}

// ******************************************************************************************************************************************************************************************
// DEVICE SPECIFIC CODE
// ******************************************************************************************************************************************************************************************

function handle_all_device_get(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var appid = req.body.appid;

        if (appid) {
            console.log(
                "select * from beacons_list where  applicationID = '" +
                appid +
                "' and active = 1"
            );

            connection.query(
                "select * from beacons_list where  applicationID = '" +
                appid +
                "' and active = 1 ",
                function(err, rows) {
                    // if (!err) {
                    res.json(rows);
                    // }
                }
            );
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_device_get(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var uuid = req.body.uuid;
        var major = req.body.major;
        var minor = req.body.minor;

        var appid = req.body.appid;

        if (uuid) {
            console.log(
                "select * from beacons_list where  applicationID = '" +
                appid +
                "' and active = 1 and uuid = '" +
                uuid +
                "' and  major = " +
                major +
                " and  minor = " +
                minor
            );

            connection.query(
                "select * from beacons_list where  applicationID = '" +
                appid +
                "' and active = 1 and uuid = '" +
                uuid +
                "' and  major = " +
                major +
                " and  minor = " +
                minor,
                function(err, rows) {
                    // if (!err) {
                    res.json(rows);
                    // }
                }
            );
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_device_type_add(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var model = req.body.model;
        var systemVersion = req.body.systemVersion;
        var language = req.body.language;

        var country = req.body.country;
        var appVersion = req.body.appVersion;

        var deviceId = req.body.deviceId;

        var bundleIdentifier = req.body.bundleIdentifier;

        var appid = req.body.appid;

        if (deviceId) {
            console.log(
                "select * from beacon_user_device where bundleIdentifier = '" +
                bundleIdentifier +
                "' and deviceId = '" +
                deviceId +
                "'" +
                " and applicationID = '" +
                appid +
                "'"
            );

            connection.query(
                "select * from beacon_user_device where bundleIdentifier = '" +
                bundleIdentifier +
                "' and deviceId = '" +
                deviceId +
                "'" +
                " and applicationID = '" +
                appid +
                "'",
                function(err, rows) {
                    if (!err) {
                        if (rows.length < 1) {
                            console.log(
                                "insert into beacon_user_device (applicationID,model,systemVersion,language,country,appVersion,deviceId,bundleIdentifier) values ('" +
                                appid +
                                "','" +
                                model +
                                "' , '" +
                                systemVersion +
                                "','" +
                                language +
                                "','" +
                                country +
                                "','" +
                                appVersion +
                                "','" +
                                deviceId +
                                "','" +
                                bundleIdentifier +
                                "')"
                            );

                            connection.query(
                                "insert into beacon_user_device (applicationID,model,systemVersion,language,country,appVersion,deviceId,bundleIdentifier) values ('" +
                                appid +
                                "','" +
                                model +
                                "' , '" +
                                systemVersion +
                                "','" +
                                language +
                                "','" +
                                country +
                                "','" +
                                appVersion +
                                "','" +
                                deviceId +
                                "','" +
                                bundleIdentifier +
                                "')",
                                function(err, rows) {
                                    // if (!err) {
                                    res.json(rows);
                                    // }
                                }
                            );
                        } else {
                            res.json(rows);
                        }
                    }
                }
            );
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

// ******************************************************************************************************************************************************************************************
// BEACON SPECIFIC CODE
// ******************************************************************************************************************************************************************************************

function handle_update_beacon_location(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var lat = req.body.lat;
        var lng = req.body.lng;
        var uuid = req.body.uuid;
        var major = req.body.major;
        var minor = req.body.minor;
        var location = req.body.location;

        var appid = req.body.appid;

        if (uuid) {
            console.log(
                "update beacons_list set  date_last_seen = CONVERT_TZ(NOW(),'+00:00','+00:00'),lat = " +
                lat +
                ",lng=" +
                lng +
                " where uuid = '" +
                uuid +
                "' and  major = " +
                major +
                " and  minor = " +
                minor +
                " and applicationID = '" +
                appid +
                "'"
            );

            if (!location) {
                connection.query(
                    "update beacons_list set  date_last_seen = CONVERT_TZ(NOW(),'+00:00','+00:00'),lat = " +
                    lat +
                    ",lng=" +
                    lng +
                    " where uuid = '" +
                    uuid +
                    "' and  major = " +
                    major +
                    " and  minor = " +
                    minor +
                    " and applicationID = '" +
                    appid +
                    "'",
                    function(err, rows) {
                        res.json(rows);
                    }
                );
            } else {
                connection.query(
                    "update beacons_list set  date_last_seen = CONVERT_TZ(NOW(),'+00:00','+00:00'),lat = " +
                    lat +
                    ",lng=" +
                    lng +
                    ",location = '" +
                    location +
                    "' where uuid = '" +
                    uuid +
                    "' and  major = " +
                    major +
                    " and  minor = " +
                    minor +
                    " and applicationID = '" +
                    appid +
                    "'",
                    function(err, rows) {
                        res.json(rows);
                    }
                );
            }
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_update_beacon_counter(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var uuid = req.body.uuid;

        var major = req.body.major;
        var minor = req.body.minor;

        var appid = req.body.appid;
        var day = req.body.day;
        var field = req.body.field;

        var userid = req.params.userid;

        if (uuid) {
            console.log(
                "update beacon_daily_counter a set  a." +
                field +
                " = a." +
                field +
                " + 1 where  user_id = '" +
                user_id +
                "' and  applicationID = '" +
                appid +
                "' and  uuid = '" +
                uuid +
                "' and  major = " +
                major +
                " and  minor = " +
                minor +
                "  and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))"
            );

            connection.query(
                "update beacon_daily_counter a set  a." +
                field +
                " = a." +
                field +
                " + 1 where   user_id = '" +
                user_id +
                "' and applicationID = '" +
                appid +
                "' and  uuid = '" +
                uuid +
                "' and  major = " +
                major +
                " and  minor = " +
                minor +
                "  and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))",
                function(err, rows) {
                    handle_system_stats_add(req, res);
                    handle_update_beacon_status(req, res);
                    handle_beacon_room_analytics_update_usage(req, res);

                    // if (!err) {
                    res.json(rows);
                    // }
                }
            );
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_beacon_analytics(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var uuid = req.body.uuid;
        var major = req.body.major;
        var minor = req.body.minor;

        var appid = req.body.appid;
        var day = req.body.day;

        if (uuid) {
            console.log(
                "select * from beacon_daily_counter where  applicationID = '" +
                appid +
                "' and  uuid = '" +
                uuid +
                "' and  major = " +
                major +
                " and  minor = " +
                minor +
                "  and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))"
            );

            connection.query(
                "select * from beacon_daily_counter where  applicationID = '" +
                appid +
                "' and  uuid = '" +
                uuid +
                "' and  major = " +
                major +
                " and  minor = " +
                minor +
                "  and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))",
                function(err, rows) {
                    // if (!err) {
                    res.json(rows);
                    // }
                }
            );
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_beacon_analytics_add(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var uuid = req.body.uuid;
        var major = req.body.major;
        var minor = req.body.minor;

        var appid = req.body.appid;
        var day = req.body.day;

        var date = new Date().toISOString();

        var userid = req.body.userid;

        if (uuid) {
            if (!userid) {
                userid = 0;
            }

            console.log(
                "select * from beacon_daily_counter where  user_id = '" +
                userid +
                "' and applicationID = '" +
                appid +
                "' and  uuid = '" +
                uuid +
                "' and  major = " +
                major +
                " and  minor = " +
                minor +
                "  and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))"
            );
            connection.query(
                "select * from beacon_daily_counter where   user_id = '" +
                userid +
                "' and applicationID = '" +
                appid +
                "' and  uuid = '" +
                uuid +
                "' and  major = " +
                major +
                " and  minor = " +
                minor +
                "  and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))",
                function(err, rows) {
                    if (rows.length == 0) {
                        console.log(
                            "insert into beacon_daily_counter (applicationID,uuid,major,minor,user_id,day,lastUpdate) values ('" +
                            appid +
                            "' , '" +
                            uuid +
                            "'," +
                            major +
                            "," +
                            minor +
                            "' , '" +
                            userid +
                            "'" +
                            ",DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')),CONVERT_TZ(NOW(),'+00:00','+00:00'))"
                        );
                        connection.query(
                            "insert into beacon_daily_counter (applicationID,uuid,major,minor,user_id,day,lastUpdate) values ('" +
                            appid +
                            "' , '" +
                            uuid +
                            "'," +
                            major +
                            "," +
                            minor +
                            "' , '" +
                            userid +
                            "'" +
                            ",DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')),CONVERT_TZ(NOW(),'+00:00','+00:00'))",
                            function(err, rows) {
                                res.json(rows);
                            }
                        );
                    }
                }
            );

            // Check for first time member
            handle_beacon_event(req, res, "NEW");
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_beacon_update_provision(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var uuid = req.body.uuid;
        var major = req.body.major;
        var minor = req.body.minor;

        var appid = req.body.appid;
        var day = req.body.day;
        var count = req.body.count;
        var date = new Date().toISOString();

        if (uuid) {
            console.log(
                "update beacons_list set  provisioned = 1 where  applicationID = '" +
                appid +
                "' and  uuid = '" +
                uuid +
                "' and  major = " +
                major +
                " and  minor = " +
                minor
            );

            connection.query(
                "update beacons_list set  provisioned = 1  where  applicationID = '" +
                appid +
                "' and  uuid = '" +
                uuid +
                "' and  major = " +
                major +
                " and  minor = " +
                minor,
                function(err, rows) {
                    res.json(rows);
                }
            );
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_update_beacon_status(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var uuid = req.body.uuid;
        var major = req.body.major;
        var minor = req.body.minor;

        var appid = req.body.appid;
        var day = req.body.day;
        var count = req.body.count;
        var date = new Date().toISOString();

        if (uuid) {
            console.log(
                "update beacons_list set  date_last_seen = CONVERT_TZ(NOW(),'+00:00','+00:00') where  applicationID = '" +
                appid +
                "' and  uuid = '" +
                uuid +
                "' and  major = " +
                major +
                " and  minor = " +
                minor
            );

            connection.query(
                "update beacons_list set  date_last_seen = CONVERT_TZ(NOW(),'+00:00','+00:00') where  applicationID = '" +
                appid +
                "' and  uuid = '" +
                uuid +
                "' and  major = " +
                major +
                " and  minor = " +
                minor,
                function(err, rows) {}
            );
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_beacon_room_analytics_update_usage(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var uuid = req.body.uuid;
        var major = req.body.major;
        var minor = req.body.minor;

        var appid = req.body.appid;
        var day = req.body.day;
        var count = req.body.count;
        var date = new Date().toISOString();

        var userid = req.body.userid;

        var classname = "";
        var classroom = "";
        var classtime = "";
        var classday = "";
        var classid = 0;

        if (!userid) {
            console.log("!!!! NO USERID");
            return;
        }

        if (uuid) {
            // Test for Ochsner
            console.log(
                "select hdn_classes.class,hdn_classes.dayname,hdn_classes.time,hdn_classes.room,hdn_classes.id from hdn_classes,beacons_list,beacon_group where beacon_group.`beacon_id` = beacons_list.id and beacon_group.`group` =  hdn_classes.beacon_group_id and day =  DAYOFWEEK(CONVERT_TZ(NOW(),'+0:00','-06:00'))-1  and hdn_classes.numbertime = (HOUR(CONVERT_TZ(NOW(),'+0:00','-06:00')) * 100) and applicationID = '" +
                appid +
                "' and uuid = '" +
                uuid +
                "' and  major = " +
                major +
                " and  minor = " +
                minor +
                ""
            );

            connection.query(
                "select * from hdn_classes,beacons_list,beacon_group where beacon_group.`beacon_id` = beacons_list.id and beacon_group.`group` =  hdn_classes.beacon_group_id and day =  DAYOFWEEK(CONVERT_TZ(NOW(),'+0:00','-06:00')) -1  and hdn_classes.numbertime = (HOUR(CONVERT_TZ(NOW(),'+0:00','-06:00')) * 100) and applicationID = '" +
                appid +
                "' and uuid = '" +
                uuid +
                "' and  major = " +
                major +
                " and  minor = " +
                minor +
                "",
                function(err, rows) {
                    if (rows.length > 0) {
                        var row = rows[0];
                        classname = row.class;
                        classroom = row.room;
                        classtime = row.time;
                        classday = row.dayname;
                        classid = row.id;

                        console.log(
                            "select * from beacon_daily_room_counter where classid = " +
                            classid +
                            " and user_id = '" +
                            userid +
                            "' and applicationID = '" +
                            appid +
                            "' and  uuid = '" +
                            uuid +
                            "' and  major = " +
                            major +
                            " and  minor = " +
                            minor +
                            "  and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))"
                        );
                        connection.query(
                            "select * from beacon_daily_room_counter where classid = " +
                            classid +
                            " and  user_id = '" +
                            userid +
                            "' and applicationID = '" +
                            appid +
                            "' and  uuid = '" +
                            uuid +
                            "' and  major = " +
                            major +
                            " and  minor = " +
                            minor +
                            "  and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))",
                            function(err, rows) {
                                if (rows.length == 0) {
                                    console.log(
                                        "!!!! insert into beacon_daily_room_counter (classname,classroom,classtime,classday,classid,applicationID,uuid,major,minor,user_id,day,lastUpdate) values ('" +
                                        classname +
                                        "','" +
                                        classroom +
                                        "','" +
                                        classtime +
                                        "','" +
                                        classday +
                                        "'," +
                                        classid +
                                        ",'" +
                                        appid +
                                        "' , '" +
                                        uuid +
                                        "'," +
                                        major +
                                        "," +
                                        minor +
                                        ",'" +
                                        userid +
                                        "'" +
                                        ",DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')),CONVERT_TZ(NOW(),'+00:00','+00:00'))"
                                    );
                                    connection.query(
                                        "insert into beacon_daily_room_counter (classname,classroom,classtime,classday,classid,applicationID,uuid,major,minor,user_id,day,lastUpdate) values ('" +
                                        classname +
                                        "','" +
                                        classroom +
                                        "','" +
                                        classtime +
                                        "','" +
                                        classday +
                                        "'," +
                                        classid +
                                        ",'" +
                                        appid +
                                        "' , '" +
                                        uuid +
                                        "'," +
                                        major +
                                        "," +
                                        minor +
                                        ",'" +
                                        userid +
                                        "'" +
                                        ",DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')),CONVERT_TZ(NOW(),'+00:00','+00:00'))",
                                        function(err, rows) {
                                            //res.json(rows);
                                        }
                                    );
                                } else {
                                    console.log(
                                        "!!!! update beacon_daily_room_counter a set  a.usage = a.usage + " +
                                        count +
                                        ",lastUpdate = CONVERT_TZ(NOW(),'+00:00','+00:00') where  classid = " +
                                        classid +
                                        " and applicationID = '" +
                                        appid +
                                        "' and  uuid = '" +
                                        uuid +
                                        "' and  major = " +
                                        major +
                                        " and  minor = " +
                                        minor +
                                        " and user_id = '" +
                                        userid +
                                        "'  and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))"
                                    );

                                    connection.query(
                                        "update beacon_daily_room_counter a set  a.usage = a.usage + " +
                                        count +
                                        ",lastUpdate = CONVERT_TZ(NOW(),'+00:00','+00:00') where  classid = " +
                                        classid +
                                        " and applicationID = '" +
                                        appid +
                                        "' and  uuid = '" +
                                        uuid +
                                        "' and  major = " +
                                        major +
                                        " and  minor = " +
                                        minor +
                                        " and user_id = '" +
                                        userid +
                                        "'  and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))",
                                        function(err, rows) {
                                            //res.json(rows);
                                        }
                                    );
                                }
                            }
                        );
                    }
                }
            );
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_beacon_analytics_update_usage(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var uuid = req.body.uuid;
        var major = req.body.major;
        var minor = req.body.minor;

        var appid = req.body.appid;
        var day = req.body.day;
        var count = req.body.count;
        var date = new Date().toISOString();

        var userid = req.body.userid;

        if (uuid) {
            if (!userid) {
                userid = 0;
            }

            console.log(
                "select * from beacon_daily_counter where  user_id = '" +
                userid +
                "' and applicationID = '" +
                appid +
                "' and  uuid = '" +
                uuid +
                "' and  major = " +
                major +
                " and  minor = " +
                minor +
                "  and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))"
            );
            connection.query(
                "select * from beacon_daily_counter where  user_id = '" +
                userid +
                "' and applicationID = '" +
                appid +
                "' and  uuid = '" +
                uuid +
                "' and  major = " +
                major +
                " and  minor = " +
                minor +
                "  and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))",
                function(err, rows) {
                    if (rows.length == 0) {
                        console.log(
                            "insert into beacon_daily_counter (applicationID,uuid,major,minor,user_id,day,lastUpdate) values ('" +
                            appid +
                            "' , '" +
                            uuid +
                            "'," +
                            major +
                            "," +
                            minor +
                            ",'" +
                            userid +
                            "'" +
                            ",DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')),CONVERT_TZ(NOW(),'+00:00','+00:00'))"
                        );
                        connection.query(
                            "insert into beacon_daily_counter (applicationID,uuid,major,minor,user_id,day,lastUpdate) values ('" +
                            appid +
                            "' , '" +
                            uuid +
                            "'," +
                            major +
                            "," +
                            minor +
                            ",'" +
                            userid +
                            "'" +
                            ",DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')),CONVERT_TZ(NOW(),'+00:00','+00:00'))",
                            function(err, rows) {
                                res.json(rows);
                            }
                        );
                    } else {
                        console.log(
                            "update beacon_daily_counter a set  a.usage = a.usage + " +
                            count +
                            ",lastUpdate = CONVERT_TZ(NOW(),'+00:00','+00:00') where  applicationID = '" +
                            appid +
                            "' and  uuid = '" +
                            uuid +
                            "' and  major = " +
                            major +
                            " and  minor = " +
                            minor +
                            " and user_id = '" +
                            userid +
                            "'  and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))"
                        );

                        connection.query(
                            "update beacon_daily_counter a set  a.usage = a.usage + " +
                            count +
                            ",lastUpdate = CONVERT_TZ(NOW(),'+00:00','+00:00') where  applicationID = '" +
                            appid +
                            "' and  uuid = '" +
                            uuid +
                            "' and  major = " +
                            major +
                            " and  minor = " +
                            minor +
                            " and user_id = '" +
                            userid +
                            "'  and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))",
                            function(err, rows) {
                                handle_system_stats_add(req, res);
                                handle_update_beacon_status(req, res);
                                handle_beacon_room_analytics_update_usage(req, res);

                                // if (!err) {
                                res.json(rows);
                                // }
                            }
                        );
                    }
                }
            );
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_beacon_analytics_update_stats(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var uuid = req.body.uuid;
        var major = req.body.major;
        var minor = req.body.minor;

        var appid = req.body.appid;
        var day = req.body.day;
        var count = req.body.count;
        var field = req.body.field;

        if (uuid) {
            console.log(
                "update beacon_daily_counter a set  a." +
                field +
                " = a." +
                field +
                " +1  where  applicationID = '" +
                appid +
                "' and  uuid = '" +
                uuid +
                "' and  major = " +
                major +
                " and  minor = " +
                minor +
                " and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))"
            );

            connection.query(
                "update beacon_daily_counter a set  a." +
                field +
                " = a." +
                field +
                " +1  where  applicationID = '" +
                appid +
                "' and  uuid = '" +
                uuid +
                "' and  major = " +
                major +
                " and  minor = " +
                minor +
                "  and day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00'))",
                function(err, rows) {
                    handle_system_stats_add(req, res);
                    handle_update_beacon_status(req, res);
                    //handle_beacon_room_analytics_update_usage(req, res);

                    // if (!err) {
                    res.json(rows);
                    // }
                }
            );
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_beacons_provision(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        if (req.params.appid) {
            console.log(
                "select * from beacons_list where active = 0 and provisioned = 0 and applicationID = '" +
                req.params.appid +
                "' group by uuid"
            );

            connection.query(
                "select * from beacons_list where active = 0 and provisioned = 0 and applicationID = '" +
                req.params.appid +
                "' group by uuid",
                function(err, rows) {
                    // if (!err) {
                    res.json(rows);
                    // }
                }
            );
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_beacons(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        if (req.params.appid) {
            console.log(
                "beacon: " + connection.threadId + " UUID[ " + req.params.appid + "]"
            );

            connection.query(
                "select * from beacons_list where active = 1 and applicationID = '" +
                req.params.appid +
                "' group by uuid",
                function(err, rows) {
                    // if (!err) {
                    res.json(rows);
                    // }
                }
            );
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_license(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            //connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        if (req.params.appid) {
            console.log(
                "beacon license: " +
                connection.threadId +
                " UUID[ " +
                req.params.appid +
                "]"
            );

            connection.query(
                "select * from hdn_company where parent = 1 and active = 1 and applicationID = '" +
                req.params.appid +
                "'",
                function(err, rows) {
                    // if (!err) {
                    res.json(rows);
                    // }
                }
            );
        }

        connection.release();

        connection.on("error", function(err) {
            res.json({
                code: 100,
                status: "Error in connection database",
            });
            return;
        });
    });
}

// ******************************************************************************************************************************************************************************************
// STATISTICS CODE
// ******************************************************************************************************************************************************************************************

function handle_system_stats_add(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        //CONVERT_TZ(CURDATE(),'+00:00','+00:00')
        console.log(
            "select * from beacon_transactions where `day` = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')) and `hour` = HOUR(CONVERT_TZ(NOW(),'+00:00','+00:00'))"
        );

        connection.query(
            "select * from beacon_transactions where `day` = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')) and `hour` = HOUR(CONVERT_TZ(NOW(),'+00:00','+00:00'))",
            function(err, rows) {
                if (!err) {
                    if (rows.length < 1) {
                        console.log(
                            "insert into beacon_transactions (`hour`,`day`,`usage`) values ( HOUR(CONVERT_TZ(NOW(),'+00:00','+00:00')) ,DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')),1)"
                        );

                        connection.query(
                            "insert into beacon_transactions (`hour`,`day`,`usage`) values ( HOUR(CONVERT_TZ(NOW(),'+00:00','+00:00')) ,DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')),1)",
                            function(err, rows) {}
                        );
                    } else {
                        console.log(
                            "update beacon_transactions a set  a.usage = a.usage + 1  where `day` = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')) and `hour` = HOUR(CONVERT_TZ(NOW(),'+00:00','+00:00'))"
                        );

                        connection.query(
                            "update beacon_transactions a set  a.usage = a.usage + 1  where `day` = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')) and `hour` = HOUR(CONVERT_TZ(NOW(),'+00:00','+00:00'))",
                            function(err, rows) {}
                        );
                    }
                } else {
                    res.json(rows);
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

// ******************************************************************************************************************************************************************************************
// REPORTS CODE
// ******************************************************************************************************************************************************************************************
function handle_report_day_retention_analytics(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var appid = req.params.appid;
        var day = req.params.day;
        //var userid = req.params.userid;
        //var day = DAYOFYEAR(CONVERT_TZ(CURDATE(),'+00:00','+00:00'));
        // var user = req.body.user;

        console.log(
            "select *, (bb.ReturningPlayerCount/aa.FirstTimePlayerCount) *100 as Retention from ( SELECT Date_format(MinDate, '%Y-%m-%d') AS SourceDate, count(*) AS FirstTimePlayerCount FROM (SELECT DISTINCT user_id AS pid, min(lastUpdate) AS MinDate FROM beacon_daily_counter_user WHERE `applicationID` = '" +
            appid +
            "' GROUP BY pid) b GROUP BY SourceDate ORDER BY SourceDate ASC ) as aa inner join ( SELECT Count(DISTINCT a.user_id) AS ReturningPlayerCount, Date_format(b.lastUpdate, '%Y-%m-%e') AS RetentionDate, Date_format(a.JoinDate, '%Y-%m-%d') AS SourceDate FROM (SELECT DISTINCT user_id, Min(lastUpdate) AS JoinDate FROM beacon_daily_counter_user WHERE `applicationID` = '" +
            appid +
            "' GROUP BY user_id) a JOIN beacon_daily_counter_user b ON a.user_id = b.user_id AND Datediff(b.lastUpdate, a.JoinDate) = " +
            day +
            " GROUP BY RetentionDate ORDER BY RetentionDate ASC ) as bb on aa.SourceDate = bb.SourceDate order by aa.SourceDate desc"
        );

        connection.query(
            "select *, (bb.ReturningPlayerCount/aa.FirstTimePlayerCount) *100 as Retention from ( SELECT Date_format(MinDate, '%Y-%m-%d') AS SourceDate, count(*) AS FirstTimePlayerCount FROM (SELECT DISTINCT user_id AS pid, min(lastUpdate) AS MinDate FROM beacon_daily_counter_user  WHERE applicationID = '" +
            appid +
            "' GROUP BY pid) b GROUP BY SourceDate ORDER BY SourceDate ASC ) as aa inner join ( SELECT Count(DISTINCT a.user_id) AS ReturningPlayerCount, Date_format(b.lastUpdate, '%Y-%m-%e') AS RetentionDate, Date_format(a.JoinDate, '%Y-%m-%d') AS SourceDate FROM (SELECT DISTINCT user_id, Min(lastUpdate) AS JoinDate FROM beacon_daily_counter_user  WHERE applicationID = '" +
            appid +
            "' GROUP BY user_id) a JOIN beacon_daily_counter_user b ON a.user_id = b.user_id AND Datediff(b.lastUpdate, a.JoinDate) = " +
            day +
            " GROUP BY RetentionDate ORDER BY RetentionDate ASC ) as bb on aa.SourceDate = bb.SourceDate order by aa.SourceDate desc",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                //if (!err) {
                res.json(rows);
                //}
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_report_all_user_total_hourly_analytics(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var appid = req.params.appid;
        var userid = req.params.userid;
        //var day = DAYOFYEAR(CONVERT_TZ(CURDATE(),'+00:00','+00:00'));
        // var user = req.body.user;

        console.log(
            "select CAST(count(day)as CHAR(50)) as `usage`,DATE_FORMAT(lastUpdate,'%m-%d') as date,day as day from beacon_daily_counter_user,hdn_company where year=YEAR(NOW()) and beacon_daily_counter_user.applicationID = hdn_company.applicationID AND hdn_company.id_user = " +
            userid +
            "  group by  date order by date desc"
        );

        connection.query(
            "SELECT DATE_FORMAT(CONVERT_TZ(lastUpdate,'+00:00','" +
            timezoneoffset +
            "'),'%Y-%m-%d') as day, CAST(HOUR(CONVERT_TZ(lastUpdate,'+00:00','" +
            timezoneoffset +
            "')) as CHAR(50)) as hour, CAST(count(*)  as CHAR(50)) as `usage` FROM beacon_daily_counter_user,hdn_company,users where year=YEAR(NOW()) and beacon_daily_counter_user.applicationID = hdn_company.applicationID AND hdn_company.id = users.company_id AND users.id =  " +
            userid +
            " and DATE_FORMAT(CONVERT_TZ(lastUpdate,'+00:00','" +
            timezoneoffset +
            "'),'%Y-%m-%d') = DATE_FORMAT(CONVERT_TZ(NOW(),'+00:00','" +
            timezoneoffset +
            "'),'%Y-%m-%d') GROUP BY DATE_FORMAT(lastUpdate,'%Y-%m-%d'), hour(lastUpdate) order by HOUR(CONVERT_TZ(lastUpdate,'+00:00','" +
            timezoneoffset +
            "')) desc",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                //if (!err) {
                res.json(rows);
                //}
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_report_all_user_total_analytics(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var appid = req.params.appid;
        var userid = req.params.userid;
        //var day = DAYOFYEAR(CONVERT_TZ(CURDATE(),'+00:00','+00:00'));
        // var user = req.body.user;

        console.log(
            "select CAST(count(day)as CHAR(50)) as `usage`,DATE_FORMAT(lastUpdate,'%m-%d') as date,day as day from beacon_daily_counter_user,hdn_company where year=YEAR(NOW()) and  beacon_daily_counter_user.applicationID = hdn_company.applicationID AND hdn_company.id_user = " +
            userid +
            "  group by  date order by date desc"
        );

        connection.query(
            "select CAST(count(day)as CHAR(50)) as `usage`,DATE_FORMAT(CONVERT_TZ(lastUpdate,'+00:00','" +
            timezoneoffset +
            "'),'%m-%d') as date,day as day from beacon_daily_counter_user,hdn_company,users where year=YEAR(NOW()) and  beacon_daily_counter_user.applicationID = hdn_company.applicationID AND hdn_company.id = users.company_id AND users.id  = " +
            userid +
            "   group by  date order by date desc limit 31",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                //if (!err) {
                res.json(rows);
                //}
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_report_new_user_total_analytics(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var appid = req.params.appid;
        var userid = req.params.userid;
        //var day = DAYOFYEAR(CONVERT_TZ(CURDATE(),'+00:00','+00:00'));
        // var user = req.body.user;

        console.log(
            "select count(day) as `usage`,day as day,DATE_FORMAT(lastUpdate,'%m-%d-%Y') as date from (select b1.user_id, b1.applicationID,b1.lastUpdate, min(day) as day from beacon_daily_counter_user as b1  group by b1.user_id) as b2  group by day  limit 30"
        );

        connection.query(
            "select CAST(count(day)as CHAR(50)) as `usage`,DATE_FORMAT(CONVERT_TZ(lastUpdate,'+00:00','" +
            timezoneoffset +
            "'),'%m-%d') as date,DAY(CONVERT_TZ(lastUpdate,'+00:00','" +
            timezoneoffset +
            "')) as day from (select b1.user_id, b1.applicationID,b1.lastUpdate, min(day) as day from beacon_daily_counter_user as b1 ,hdn_company, users where b1.year=YEAR(NOW()) and b1.applicationID = hdn_company.applicationID AND hdn_company.id = users.company_id AND users.id = " +
            userid +
            " group by b1.user_id) as b2  group by date desc  limit 31 ",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                //if (!err) {
                res.json(rows);
                //}
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_report_beacon_transactions(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            //connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        console.log(
            "SELECT day,hour as thehour, `usage` FROM beacon_transactions WHERE day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')) GROUP BY thehour"
        );

        connection.query(
            "SELECT day,hour as thehour, `usage` FROM beacon_transactions WHERE day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')) GROUP BY thehour",
            function(err, rows) {
                // if (!err) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
                // }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            res.json({
                code: 100,
                status: "Error in connection database",
            });
            return;
        });
    });
}

function handle_report_daily_usage(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            //connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        console.log(
            "SELECT CAST(SUM(`usage` / 3600 ) as CHAR(50)) as `usage`  , CAST(DATE_ADD(DATE_FORMAT(CONVERT_TZ(CURDATE(),'+00:00','+00:00') ,'%Y-01-01') ,INTERVAL day DAY) as CHAR(50)) as `day` FROM `beacon_daily_counter` group by  DAY(lastUpdate) order by  DAY(lastUpdate) desc limit 30"
        );

        connection.query(
            "SELECT CAST(SUM(`usage`  / 3600 ) as CHAR(50)) as `usage`,CAST(SUM(`becomeactive` ) as CHAR(50)) as `becomeactive`,CAST(SUM(`becomeinactive` ) as CHAR(50)) as `becomeinactive`,CAST(SUM(`didenterregion`  ) as CHAR(50)) as `didenterregion`,CAST(SUM(`didexitregion` ) as CHAR(50)) as `didexitregion` , CAST(DATE_FORMAT(`lastUpdate`,'%m-%d')  as CHAR(50)) as `day` FROM beacon_daily_counter,hdn_company,users where beacon_daily_counter.applicationID = hdn_company.applicationID AND hdn_company.id = users.company_id AND users.id = " +
            userid +
            " group by  DATE_FORMAT(CONVERT_TZ(lastUpdate,'+00:00','" +
            timezoneoffset +
            "'),'%Y-%m-%d') order by  DATE_FORMAT(CONVERT_TZ(lastUpdate,'+00:00','" +
            timezoneoffset +
            "'),'%Y-%m-%d') desc limit 31",
            function(err, rows) {
                // if (!err) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
                // }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            res.json({
                code: 100,
                status: "Error in connection database",
            });
            return;
        });
    });
}

function handle_report_daily_active(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            //connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        console.log(
            "SELECT CAST(COUNT(*) as CHAR(50)) as `usage`  , CAST(DATE_FORMAT(`lastUpdate`,'%m-%d')  as CHAR(50)) as `day` FROM `beacon_daily_counter` group by day order by day desc limit 30"
        );

        connection.query(
            "SELECT CAST(COUNT(*) as CHAR(50)) as `usage`  , CAST(DATE_FORMAT(`lastUpdate`,'%m-%d')  as CHAR(50)) as `day` FROM beacon_daily_counter,hdn_company,users where beacon_daily_counter.applicationID = hdn_company.applicationID AND hdn_company.id = users.company_id AND users.id = " +
            userid +
            " group by  DATE_FORMAT(`lastUpdate`,'%Y-%m-%d') order by  DATE_FORMAT(CONVERT_TZ(lastUpdate,'+00:00','" +
            timezoneoffset +
            "'),'%Y-%m-%d') desc limit 30",
            function(err, rows) {
                // if (!err) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
                // }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            res.json({
                code: 100,
                status: "Error in connection database",
            });
            return;
        });
    });
}

function handle_report_beacon_most_active(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            //connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        console.log(
            "select CAST(SUM(`usage`  / 3600) as CHAR(50)) as `usage` , CONCAT ( uuid , '.',CAST(major as CHAR(50))  , '.',CAST(minor as CHAR(50))) as uuid  FROM `beacon_daily_counter`  where `usage` > 0 group by uuid,major,minor order by `usage` desc limit 30"
        );
        connection.query(
            "select beacons_list.tags, beacons_list.name,beacons_list.location, CAST(SUM(`usage`  / 3600) as CHAR(50)) as `usage` , CONCAT ( beacons_list.uuid , '.',CAST(beacons_list.major as CHAR(50))  , '.',CAST(beacons_list.minor as CHAR(50))) as uuid, CONCAT (name,' - ',beacons_list.location) as namelocation FROM `beacons_list`,beacon_daily_counter,hdn_company,users where beacons_list.applicationID = hdn_company.applicationID AND hdn_company.id = users.company_id AND users.id = " +
            userid +
            "  and (beacons_list.uuid =  beacon_daily_counter.uuid) AND (beacons_list.major =  beacon_daily_counter.major) AND (beacons_list.minor =  beacon_daily_counter.minor) and (tags  NOT LIKE 'WELCOME%') group by tags order by `usage` desc limit 31",
            function(err, rows) {
                // if (!err) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
                // }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            res.json({
                code: 100,
                status: "Error in connection database",
            });
            return;
        });
    });
}

function handle_report_beacon_lat_lng(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            //connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        console.log("select * from beacons_list");

        connection.query(
            "select type,mapicon,name,date_format(date_last_seen, '%Y-%m-%d %H:00') as lastUpdate,beacons_list.location,lat,lng,beacons_list.active,date_last_seen,DATEDIFF(date_last_seen,NOW()) as datedif from beacons_list,hdn_company,users where beacons_list.applicationID = hdn_company.applicationID AND hdn_company.id = users.company_id AND users.id = " +
            userid +
            " and lat <> 0 order by date_last_seen desc",
            function(err, rows) {
                if (!err) {
                    var geojsonstart = '{ "type": "FeatureCollection", "features": [';

                    var geojsonend = "  ]}";

                    var geojsonmid = "";

                    for (var i = 0; i < rows.length; i++) {
                        var row = rows[i];

                        var activeStatus = "#000000";

                        if (parseInt(row.active) == 1) {
                            if (parseInt(row.datedif) > -1) {
                                // Active
                                activeStatus = "#f867af";
                            } else if (parseInt(row.datedif) > -3) {
                                // Warning
                                activeStatus = "#00ff80";
                            } else {
                                // Inactive
                                activeStatus = "#f86773";
                            }
                        }

                        geojsonmid =
                            geojsonmid +
                            '{ "type": "Feature", "geometry": { "type": "Point","coordinates": [' +
                            row.lng +
                            "," +
                            row.lat +
                            '] },"properties": { "fill-opacity": 0.5,"fill": "#555555", "stroke-width": 2,"stroke-opacity": 1.0,"stroke": "#555555", "marker-color": "' +
                            activeStatus +
                            '","marker-size": "small","title": "' +
                            row.name +
                            "," +
                            row.location +
                            '","location": "' +
                            row.location +
                            '","date_last_seen": "' +
                            row.lastUpdate +
                            '","company": "' +
                            row.name +
                            '","icon": { "iconUrl": "' +
                            row.mapicon +
                            '", "iconSize": [50, 50], "iconAnchor": [25, 25],"popupAnchor": [0, -25], "className": "dot" }  } }';

                        if (i < rows.length - 1) geojsonmid = geojsonmid + ",";
                    }

                    res.send(geojsonstart + geojsonmid + geojsonend);
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            res.json({
                code: 100,
                status: "Error in connection database",
            });
            return;
        });
    });
}

function handle_report_users_checkin(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        console.log(
            "select count(*) as checkin, CAST(DATE_FORMAT(CONVERT_TZ(lastUpdate,'+00:00','+00:00'),'%m-%d')  as CHAR(50)) as `day`  FROM beacon_daily_counter_user  ,hdn_company,users where  year=YEAR(NOW()) and beacon_daily_counter_user.applicationID = hdn_company.applicationID AND hdn_company.id = users.company_id AND users.id = " +
            userid +
            " group by day order by day desc limit 30"
        );

        connection.query(
            "select count(*) as checkin, CAST(DATE_FORMAT(CONVERT_TZ(lastUpdate,'+00:00','+00:00'),'%m-%d')  as CHAR(50)) as `day`  FROM beacon_daily_counter_user  ,hdn_company,users where  year=YEAR(NOW()) and beacon_daily_counter_user.applicationID = hdn_company.applicationID AND hdn_company.id = users.company_id AND users.id = " +
            userid +
            " group by day order by day desc limit 30",
            function(err, rows) {
                // if (!err) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
                // }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

// SELECT SUM(IF(gender = 0, 1, 0)) AS unknown, SUM(IF(gender = 1, 1, 0)) AS male, SUM(IF(gender = 2, 1, 0)) AS female FROM hdn_company,users WHERE  hdn_company.id = users.company_id AND hdn_company.id_user = 781

function handle_report_gender_users(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        // NEED TO GET THE TIMEZONE OFFSET FROM THE USER
        //console.log("SELECT date_format(lastUpdate, '%Y-%m-%d %H:00') as thehour, CAST(COUNT(*) as CHAR(50)) as `usage` FROM beacon_daily_counter_user WHERE day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')) GROUP BY thehour");
        console.log(
            "SELECT 0 AS unknown, SUM(IF(gender = 1, 1, 0)) AS male, SUM(IF(gender = 2, 1, 0)) AS female FROM hdn_company,users WHERE  hdn_company.id = users.company_id AND hdn_company.id_user = " +
            userid
        );

        connection.query(
            "SELECT 0 unknown, SUM(IF(gender = 1, 1, 0)) AS male, SUM(IF(gender = 2, 1, 0)) AS female FROM hdn_company,users WHERE  hdn_company.id = users.company_id AND hdn_company.id_user = " +
            userid,
            function(err, rows) {
                // if (!err) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
                // }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_report_active_users(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        // NEED TO GET THE TIMEZONE OFFSET FROM THE USER
        //console.log("SELECT date_format(lastUpdate, '%Y-%m-%d %H:00') as thehour, CAST(COUNT(*) as CHAR(50)) as `usage` FROM beacon_daily_counter_user WHERE day = DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')) GROUP BY thehour");
        console.log(
            "SELECT date_format(lastUpdate, '%Y-%m-%d %H:00') as thehour, CAST(COUNT(*) as CHAR(50)) as `usage` FROM beacon_daily_counter_user  GROUP BY thehour limit 120"
        );

        connection.query(
            "SELECT date_format(CONVERT_TZ(lastUpdate,'+00:00','" +
            timezoneoffset +
            "'), '%Y-%m-%d %H:00') as thehour, CAST(COUNT(*) as CHAR(50)) as `usage` FROM beacon_daily_counter_user,hdn_company,users  where beacon_daily_counter_user.applicationID = hdn_company.applicationID AND hdn_company.id = users.company_id AND users.id = " +
            userid +
            " GROUP BY thehour order by thehour limit 120",
            function(err, rows) {
                // if (!err) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
                // }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_report_device_model(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        console.log(
            "select CAST(COUNT(`model`) as CHAR(50)) as `total`, model from beacon_user_device,hdn_company where beacon_user_device.applicationID = hdn_company.applicationID AND hdn_company.id_user = " +
            userid +
            " group by `model`"
        );

        connection.query(
            "select CAST(COUNT(`model`) as CHAR(50)) as `total`, model from beacon_user_device,hdn_company,users where beacon_user_device.applicationID = hdn_company.applicationID AND hdn_company.id = users.company_id AND users.id = " +
            userid +
            " group by `model`",
            function(err, rows) {
                // if (!err) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
                // }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_report_device_language(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        console.log(
            "select CAST(COUNT(`language`) as CHAR(50)) as `total`, language from beacon_user_device,hdn_company where beacon_user_device.applicationID = hdn_company.applicationID AND hdn_company.id_user = " +
            userid +
            " group by `language`"
        );

        connection.query(
            "select CAST(COUNT(`language`) as CHAR(50)) as `total`, language from beacon_user_device,hdn_company,users where beacon_user_device.applicationID = hdn_company.applicationID AND hdn_company.id = users.company_id AND users.id = " +
            userid +
            " group by `language`",
            function(err, rows) {
                // if (!err) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
                // }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_report_device_apps(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        console.log(
            "select CAST(COUNT(`bundleIdentifier`) as CHAR(50)) as `total`, bundleIdentifier from beacon_user_device group by `bundleIdentifier`"
        );

        connection.query(
            "select  CAST(COUNT(d.bundleIdentifier)  as CHAR(50)) as `total`,t.bundleIdentifier, CAST(t.appVersion  as CHAR(50))  as appVersion from  beacon_user_device d join ( select MAX(appVersion) as appVersion,`bundleIdentifier` from beacon_user_device,hdn_company ,users where beacon_user_device.applicationID = hdn_company.applicationID AND hdn_company.id = users.company_id AND users.id = " +
            userid +
            " group by `bundleIdentifier` ) t on t.appVersion = d.appVersion and t.bundleIdentifier = d.bundleIdentifier group by t.bundleIdentifier",
            function(err, rows) {
                // if (!err) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
                // }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_report_device_active(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        console.log(
            "select a.DeviceidCount, b.TotalDeviceCount from (select COUNT(*) as DeviceidCount from beacon_daily_counter  WHERE  timeStamp BETWEEN CONCAT(CURDATE(), ' ', '00:00:00') AND CONCAT(CURDATE(), ' ', '23:59:59') ) as a join (select count(*) as TotalDeviceCount from beacons_list) as b"
        );

        connection.query(
            "select a.DeviceidCount, b.TotalDeviceCount from (select COUNT(*) as DeviceidCount from beacon_daily_counter,hdn_company,users where beacon_daily_counter.applicationID = hdn_company.applicationID AND hdn_company.id = users.company_id AND users.id = " +
            userid +
            "  and  timeStamp BETWEEN CONCAT(CURDATE(), ' ', '00:00:00') AND CONCAT(CURDATE(), ' ', '23:59:59') ) as a join (select count(*) as TotalDeviceCount from beacons_list where id_user = " +
            userid +
            "  and active = 1) as b",
            function(err, rows) {
                //connection.query("select a.DeviceidCount, b.TotalDeviceCount from (select count(*) as DeviceidCount from beacons_list where id_user = "+ userid +"  AND active = 1) as a join (select count(*) as TotalDeviceCount from beacons_list where id_user = "+ userid +" ) as b", function(err, rows) {

                var x = "";

                //for (var i = 0; i < rows.length; i++) {
                var row = rows[0];
                x =
                    '{"data1": [' +
                    row.DeviceidCount +
                    '],"data2": [' +
                    row.TotalDeviceCount +
                    "]}";
                //}

                // if (!err) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.send(x);
                //res.json(rows);
                // }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_report_monthly_transactions(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        console.log(
            "select MONTH(lastUpdate) as `month`, count(*) as `usage` from beacon_daily_counter_user,hdn_company where beacon_daily_counter_user.applicationID = hdn_company.applicationID AND hdn_company.id_user =  " +
            userid +
            " group by MONTH(lastUpdate) ORDER BY MONTH DESC"
        );

        connection.query(
            "select MONTH(lastUpdate) as `month`, count(*) as `usage` from beacon_daily_counter_user,hdn_company,users where  year= YEAR(NOW()) and beacon_daily_counter_user.applicationID = hdn_company.applicationID AND hdn_company.id = users.company_id AND users.id = " +
            userid +
            " group by MONTH(lastUpdate) ORDER BY MONTH DESC",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_report_monthly_transactions(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        console.log(
            "select MONTH(lastUpdate) as `month`, count(*) as `usage` from beacon_daily_counter_user,hdn_company where  year= YEAR(NOW()) and beacon_daily_counter_user.applicationID = hdn_company.applicationID AND hdn_company.id_user =  " +
            userid +
            " group by MONTH(lastUpdate) ORDER BY MONTH DESC"
        );

        connection.query(
            "select MONTH(lastUpdate) as `month`, count(*) as `usage` from beacon_daily_counter_user,hdn_company,users where  year= YEAR(NOW()) and beacon_daily_counter_user.applicationID = hdn_company.applicationID AND hdn_company.id = users.company_id AND users.id = " +
            userid +
            " group by MONTH(lastUpdate) ORDER BY MONTH DESC",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_report_monthly_total_users(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        console.log(
            " select a.month,count(*) as count from (SELECT MONTH(lastUpdate) as month,user_id AS users FROM beacon_daily_counter_user AS bdcu, hdn_company AS bl WHERE bdcu.applicationID = bl.applicationID AND bdcu.applicationID = bl.applicationID AND bl.id_user = " +
            userid +
            " group by bdcu.applicationID,bdcu.user_id, MONTH(bdcu.lastUpdate) ) as a group by a.month order by a.month desc"
        );

        connection.query(
            " select a.month,count(*) as count from (SELECT MONTH(lastUpdate) as month,user_id AS users FROM beacon_daily_counter_user AS bdcu, hdn_company AS bl,users WHERE bdcu.applicationID = bl.applicationID AND bdcu.applicationID = bl.applicationID AND bl.id = users.company_id AND users.id = " +
            userid +
            " group by bdcu.applicationID,bdcu.user_id, MONTH(bdcu.lastUpdate) ) as a group by a.month order by a.month desc",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_report_average_daily_visits(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        console.log(
            "SELECT CAST(day_of_week as CHAR(50)) as day_of_week, CAST(AVG(visits) as CHAR(50)) as visits FROM (SELECT DAYNAME(lastUpdate) as day_of_week, DAYOFWEEK(lastUpdate) as day_num,TO_DAYS(lastUpdate) as date,COUNT(id) as visits FROM beacon_daily_counter_user GROUP BY date) temp GROUP BY day_of_week ORDER BY day_num"
        );

        connection.query(
            "SELECT CAST(day_of_week as CHAR(50)) as day_of_week, CAST(AVG(visits) as CHAR(50)) as visits FROM (SELECT DAYNAME(lastUpdate) as day_of_week, DAYOFWEEK(lastUpdate) as day_num,TO_DAYS(lastUpdate) as date,COUNT(id) as visits FROM beacon_daily_counter_user GROUP BY date) temp GROUP BY day_of_week ORDER BY day_num",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

// router.get('/hdn_classes/:userid', function(req, res) {
//     handle_hdn_classes(req, res);
// });
// router.get('/hdn_locations/:userid', function(req, res) {
//     handle_hdn_locations(req, res);
// });
// router.get('/hdn_memberships/:userid', function(req, res) {
//     handle_hdn_memberships(req, res);
// });
// router.get('/hdn_pools/:userid', function(req, res) {
//     handle_hdn_pools(req, res);
// });
// router.get('/hdn_routines/:userid', function(req, res) {
//     handle_hdn_routines(req, res);
// });

function handle_hdn_routines(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var appid = req.params.appid;

        console.log(
            "select * from hdn_company,hdn_routines where hdn_company.applicationID and hdn_company.id_user = hdn_routines.id_user and hdn_company.applicationID = '" +
            appid +
            "'"
        );

        connection.query(
            "select * from hdn_company,hdn_routines where hdn_company.applicationID and hdn_company.id_user = hdn_routines.id_user and hdn_company.applicationID = '" +
            appid +
            "'",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_promotions(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var appid = req.params.appid;

        console.log(
            "select * from hdn_company,hdn_promotions where hdn_company.i.id = hdn_promotions.company_id and hdn_company.applicationID = '" +
            appid +
            "'"
        );

        connection.query(
            "select * from hdn_company,hdn_promotions where hdn_company.id = hdn_promotions.company_id and hdn_company.applicationID = '" +
            appid +
            "'",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_food(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var appid = req.params.appid;
        var locationid = req.params.locationid;

        console.log(
            "select * from hdn_company,hdn_foodmenu where hdn_foodmenu.deleted_at IS NULL hdn_company.id = hdn_foodmenu.company_id  and hdn_company.applicationID = '" +
            appid +
            "'"
        );

        connection.query(
            "select * from hdn_company,hdn_foodmenu where  hdn_foodmenu.deleted_at IS NULL and hdn_company.id = hdn_foodmenu.company_id and hdn_company.applicationID = '" +
            appid +
            "'",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_pools(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var appid = req.params.appid;
        var locationid = req.params.locationid;

        console.log(
            "select * from hdn_company,hdn_pool where  hdn_company.id = hdn_pool.company_id and hdn_pool.location_id =" +
            locationid +
            " and hdn_company.applicationID = '" +
            appid +
            "'"
        );

        connection.query(
            "select * from hdn_company,hdn_pool where  hdn_company.id = hdn_pool.company_id and hdn_pool.location_id =" +
            locationid +
            " and hdn_company.applicationID = '" +
            appid +
            "'",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_memberships(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var appid = req.params.appid;

        console.log(
            "select * from hdn_company,hdn_membership where hdn_company.id = hdn_membership.company_id and hdn_company.applicationID = '" +
            appid +
            "'"
        );

        connection.query(
            "select * from hdn_company,hdn_membership where  hdn_company.id = hdn_membership.company_id and hdn_company.applicationID = '" +
            appid +
            "' limit 100",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_all_locations_v3(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var appid = req.params.appid;

        //console.log(
        //  "select hours,name,hdn_locations.company_id,lat,lng,hdn_locations.id,`applicationID`,`subapplicationID`,`active`, hdn_locations.id_user,`company`,hdn_company.location,`parent`,hdn_locations.city,hdn_locations.address,hdn_locations.state ,hdn_locations.zip,hdn_locations.postal, hdn_locations.phone,hdn_locations.timezone,`perk_client_id`,hdn_api_providers_credentials.source_id,hdn_api_providers_credentials.app_key from hdn_company,hdn_locations left join hdn_api_providers_credentials on  hdn_api_providers_credentials.location = hdn_locations.id where   hdn_company.id = hdn_locations.company_id "
        //);

        connection.query(
            "select hours,name,hdn_locations.company_id,lat,lng,hdn_locations.id,`applicationID`,`subapplicationID`,`active`, hdn_locations.id_user,`company`,hdn_company.location,`parent`,hdn_locations.city,hdn_locations.address,hdn_locations.state ,hdn_locations.zip,hdn_locations.postal, hdn_locations.phone,hdn_locations.timezone,`perk_client_id`,hdn_api_providers_credentials.source_id,hdn_api_providers_credentials.app_key from hdn_company,hdn_locations left join hdn_api_providers_credentials on  hdn_api_providers_credentials.location = hdn_locations.id where   hdn_company.id = hdn_locations.company_id ",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_v2_locations(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var appid = req.params.appid;

        // console.log("select `default`,hours,name,hdn_locations.company_id,lat,lng,hdn_locations.id,`applicationID`,`subapplicationID`,`active`, hdn_locations.id_user,`company`,hdn_company.location,`parent`,hdn_locations.city,hdn_locations.address,hdn_locations.state ,hdn_locations.zip,hdn_locations.postal, hdn_locations.phone,hdn_locations.timezone,`perk_client_id` from hdn_company left join hdn_locations  on hdn_locations.company_id = hdn_company.id where hdn_company.applicationID = '" + appid + "' ORDER BY hdn_locations.default desc", function(err, rows) {

        connection.query(
            "select `default`,hours,hdn_locations.name,hdn_locations.company_id,lat,lng,hdn_locations.id,`applicationID`,`subapplicationID`,`active`,      hdn_locations.id_user,`company`,hdn_company.location,`parent`,hdn_locations.city,hdn_locations.address,hdn_locations.state ,hdn_locations.zip,hdn_locations.postal, hdn_locations.phone,hdn_locations.timezone,`perk_client_id` from hdn_company,hdn_locations where hdn_locations.company_id = hdn_company.id and enterprise_id IN ( select a.enterprise_id from hdn_company a where a.applicationID = '" +
            appid +
            "')",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_locations(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var appid = req.params.appid;
        // connection.query("select hours,name,hdn_locations.company_id,lat,lng,hdn_locations.id,`applicationID`,`subapplicationID`,`active`, hdn_locations.id_user,`company`,hdn_company.location,`parent`,hdn_locations.city,hdn_locations.address,hdn_locations.state ,hdn_locations.zip,hdn_locations.postal, hdn_locations.phone,hdn_locations.timezone,`perk_client_id`,hdn_api_providers_credentials.source_id,hdn_api_providers_credentials.app_key from hdn_company,hdn_locations,hdn_api_providers_credentials where hdn_api_providers_credentials.location = hdn_locations.id and hdn_company.id = hdn_locations.company_id and hdn_company.applicationID = '" + appid + "'  and hdn_api_providers_credentials.deleted_at is NULL ORDER BY hdn_locations.default desc", function(err, rows) {

        console.log(
            "select * from hdn_company,hdn_locations where  hdn_company.id = hdn_locations.company_id and hdn_company.applicationID = '" +
            appid +
            "' ORDER BY hdn_locations.default desc"
        );

        connection.query(
            "select * from hdn_company,hdn_locations where hdn_company.id = hdn_locations.company_id and hdn_company.applicationID = '" +
            appid +
            "' ORDER BY hdn_locations.default desc",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_v3_classes(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var locationid = req.params.locationid;
        var appid = req.params.appid;

        console.log(
            "select hdn_company.*,hdn_classes.*,hdn_api_providers_credentials.source_id, CONCAT(fname, ' ', lname) as trainer from hdn_company,hdn_classes,hdn_api_providers_credentials,users where  hdn_api_providers_credentials.location = hdn_classes.location_id and  hdn_company.id = hdn_classes.company_id and  hdn_classes.location_id = " +
            locationid +
            " and hdn_company.applicationID = '" +
            appid +
            "'  and users.id = hdn_classes.employee_id order by day, numbertime"
        );

        connection.query(
            "select hdn_company.*,hdn_classes.*,hdn_api_providers_credentials.source_id, CONCAT(fname, ' ', lname) as trainer from hdn_company,hdn_classes,hdn_api_providers_credentials,users where  hdn_api_providers_credentials.location = hdn_classes.location_id and  hdn_company.id = hdn_classes.company_id and  hdn_classes.location_id = " +
            locationid +
            " and hdn_company.applicationID = '" +
            appid +
            "'  and users.id = hdn_classes.employee_id order by day, numbertime",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_v1_classes(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var locationid = req.params.locationid;
        var appid = req.params.appid;

        console.log(
            "select hdn_classes.* from hdn_company join hdn_classes on hdn_company.id = hdn_classes.company_id where  hdn_company.applicationID = '" +
            appid +
            "' order by day, numbertime"
        );

        connection.query(
            "select hdn_classes.* from hdn_company join hdn_classes on hdn_company.id = hdn_classes.company_id where  hdn_company.applicationID = '" +
            appid +
            "' order by day, numbertime",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_v2_classes(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var locationid = req.params.locationid;
        var appid = req.params.appid;

        // console.log("select hdn_company.*,hdn_classes.*,hdn_api_providers_credentials.source_id from hdn_company,hdn_classes,hdn_api_providers_credentials where  hdn_api_providers_credentials.location = hdn_classes.location_id and  hdn_company.id = hdn_classes.company_id and  hdn_classes.location_id = " + locationid + " and hdn_company.applicationID = '" + appid + "' and event_Date >= DATE(NOW()  - INTERVAL 1 DAY) order by day, numbertime");

        console.log(
            "select hdn_company.*,hdn_classes.*,hdn_api_providers_credentials.source_id,device_apple_tv.registration from hdn_company left join hdn_classes on hdn_company.id = hdn_classes.company_id left join  device_apple_tv on device_apple_tv.id = hdn_classes.device_id left join hdn_api_providers_credentials on hdn_api_providers_credentials.location = hdn_classes.location_id where hdn_classes.location_id = " +
            locationid +
            " and hdn_company.applicationID = '" +
            appid +
            "' and event_Date >= DATE(NOW()  - INTERVAL 1 DAY) order by event_date"
        );
        connection.query(
            "select hdn_company.*,hdn_classes.*,hdn_api_providers_credentials.source_id,device_apple_tv.registration from hdn_company left join hdn_classes on hdn_company.id = hdn_classes.company_id left join device_apple_tv on device_apple_tv.id = hdn_classes.device_id left join hdn_api_providers_credentials on hdn_api_providers_credentials.location = hdn_classes.location_id where hdn_classes.location_id = " +
            locationid +
            " and hdn_company.applicationID = '" +
            appid +
            "' and event_Date >= DATE(NOW()  - INTERVAL 1 DAY) order by event_date",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_classes(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var locationid = req.params.locationid;
        var appid = req.params.appid;

        console.log(
            "select * from hdn_company,hdn_classes where  hdn_company.id = hdn_classes.company_id and  hdn_classes.location_id =" +
            locationid +
            " and hdn_company.applicationID = '" +
            appid +
            "' order by day, numbertime"
        );

        connection.query(
            "select * from hdn_company,hdn_classes where hdn_company.id = hdn_classes.company_id and  hdn_classes.location_id =" +
            locationid +
            " order by day, numbertime",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_videos(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var appid = req.params.appid;

        console.log(
            "select * from hdn_company,hdn_video where  hdn_company.id  = hdn_video.company_id and hdn_company.applicationID = '" +
            appid +
            "'"
        );

        connection.query(
            "select * from hdn_company,hdn_video where  hdn_company.id = hdn_video.company_id and hdn_company.applicationID = '" +
            appid +
            "' order by `group`",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_exrcices_status(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var status = req.body.status;
        var exerciseid = req.body.exerciseid;
        var sset = req.body.set;

        if (exerciseid) {
            if (sset == 0) {
                console.log(
                    "update hdn_workouts_detail set  completedstate = " +
                    status +
                    " where id = " +
                    exerciseid
                );
                connection.query(
                    "update hdn_workouts_detail set  completedstate = " +
                    status +
                    " where id = " +
                    exerciseid,
                    function(err, rows) {
                        res.header("Access-Control-Allow-Origin", "*");
                        res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                        res.header("Access-Control-Allow-Headers", "Content-Type");
                        res.header(
                            "Access-Control-Allow-Headers",
                            "Content-Type, Authorization, Content-Length, X-Requested-With"
                        );

                        res.json(rows);
                    }
                );
            } else {
                console.log(
                    "update hdn_routines_sets_relations set  completedstate = " +
                    status +
                    " where id = " +
                    exerciseid
                );
                connection.query(
                    "update hdn_routines_sets_relations set  completedstate = " +
                    status +
                    " where id = " +
                    exerciseid,
                    function(err, rows) {
                        res.header("Access-Control-Allow-Origin", "*");
                        res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                        res.header("Access-Control-Allow-Headers", "Content-Type");
                        res.header(
                            "Access-Control-Allow-Headers",
                            "Content-Type, Authorization, Content-Length, X-Requested-With"
                        );

                        res.json(rows);
                    }
                );
            }
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_exrcices(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var memberid = req.params.memberid;

        // "SELECT workout.id,workout.member_id, workout.event, workout.routine_id, workout.notime, routine.name, routine.desc FROM hdn_workouts workout LEFT JOIN hdn_routines routine ON routine.id = workout.routine_id AND routine.id_user = workout.trainer_id WHERE workout.member_id = '1174091' AND routine.id IS NOT NULL AND workout.set = '0' UNION select hdn_workouts.id,hdn_workouts.member_id, hdn_workouts.event,hdn_routines_sets_relations.routine_id,hdn_workouts.notime,hdn_routines.name,hdn_routines.desc from hdn_routines_sets_relations, hdn_routines,hdn_workouts where hdn_routines_sets_relations.routine_id = hdn_routines.id AND hdn_routines_sets_relations.set_id = hdn_workouts.routine_id and hdn_workouts.member_id = '1174091' ORDER BY event DESC"
        console.log(
            "SELECT workout.id ,workout.member_id, workout.event,workout.set, workout.id as exercise_id, workout.notime,workout.completedstate, routine.name, routine.reps,routine.sets,routine.sec, routine.desc,hdn_routines.url FROM hdn_workouts workout LEFT JOIN hdn_routines routine ON routine.id = workout.routine_id  WHERE workout.member_id = " +
            memberid +
            " AND routine.id IS NOT NULL AND workout.set = '0' and (MONTH(event) = MONTH(CURRENT_DATE) AND  (DAY(event) + 1) >= DAY(CURRENT_DATE)) UNION select hdn_workouts.id,hdn_workouts.member_id, hdn_workouts.event,hdn_workouts.set,hdn_routines_sets_relations.id as routine_id,hdn_workouts.notime,hdn_routines_sets_relations.completedstate,hdn_routines.name, hdn_routines.reps,hdn_routines.sets,hdn_routines.sec,hdn_routines.desc from hdn_routines_sets_relations, hdn_routines,hdn_workouts where hdn_routines_sets_relations.routine_id = hdn_routines.id AND hdn_routines_sets_relations.set_id = hdn_workouts.routine_id and hdn_workouts.member_id = " +
            memberid +
            " and (MONTH(event) = MONTH(CURRENT_DATE) AND  (DAY(event) + 1) >= DAY(CURRENT_DATE))  ORDER BY event DESC"
        );

        // connection.query("SELECT workout.id,workout.member_id, workout.event, workout.routine_id,0 as exercise_id, workout.notime,workout.completedstate, routine.name, routine.reps,routine.sets, routine.desc FROM hdn_workouts workout LEFT JOIN hdn_routines routine ON routine.id = workout.routine_id  WHERE workout.member_id = '" + memberid + "' AND routine.id IS NOT NULL AND workout.set = '0' and (MONTH(event) = MONTH(CURRENT_DATE) AND  (DAY(event) + 1) >= DAY(CURRENT_DATE)) UNION select hdn_workouts.id,hdn_workouts.member_id, hdn_workouts.event,0,hdn_routines_sets_relations.routine_id,hdn_workouts.notime,hdn_workouts.completedstate,hdn_routines.name, hdn_routines.reps,hdn_routines.sets,hdn_routines.desc from hdn_routines_sets_relations, hdn_routines,hdn_workouts where hdn_routines_sets_relations.routine_id = hdn_routines.id AND hdn_routines_sets_relations.set_id = hdn_workouts.routine_id and hdn_workouts.member_id = '" + memberid + "' and (MONTH(event) = MONTH(CURRENT_DATE) AND  (DAY(event) + 1) >= DAY(CURRENT_DATE))  ORDER BY event DESC", function(err, rows) {
        // connection.query("SELECT workout.id ,workout.member_id, workout.event,workout.set, workout.id as exercise_id, workout.notime,workout.completedstate, routine.name, routine.reps,routine.sets,routine.sec, routine.desc,url FROM hdn_workouts workout LEFT JOIN hdn_routines routine ON routine.id = workout.routine_id  WHERE workout.member_id = " + memberid + " AND routine.id IS NOT NULL AND workout.set = '0' and (MONTH(event) = MONTH(CURRENT_DATE) AND  (DAY(event) + 1) >= DAY(CURRENT_DATE)) UNION select hdn_workouts.id,hdn_workouts.member_id, hdn_workouts.event,hdn_workouts.set,hdn_routines_sets_relations.id as routine_id,hdn_workouts.notime,hdn_routines_sets_relations.completedstate,hdn_routines.name, hdn_routines.reps,hdn_routines.sets,hdn_routines.sec,hdn_routines.desc,hdn_routines.url from hdn_routines_sets_relations, hdn_routines,hdn_workouts where hdn_routines_sets_relations.routine_id = hdn_routines.id AND hdn_routines_sets_relations.set_id = hdn_workouts.routine_id and hdn_workouts.member_id = " + memberid + " and (MONTH(event) = MONTH(CURRENT_DATE) AND  (DAY(event) + 1) >= DAY(CURRENT_DATE))  ORDER BY event DESC", function(err, rows) {

        connection.query(
            "SELECT workout.id ,workout.member_id, workout.event,workout.set, workout.id as exercise_id, workout.notime,workout.completedstate, routine.name, routine.reps,routine.sets,routine.sec, routine.desc,url FROM hdn_workouts_detail workout LEFT JOIN hdn_routines routine ON routine.id = workout.routine_id  WHERE workout.member_id = " +
            memberid +
            " AND routine.id IS NOT NULL AND workout.set = '0' and (MONTH(event) = MONTH(CURRENT_DATE) AND  (DAY(event) + 1) >= DAY(CURRENT_DATE)) ",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_messages(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var memberid = req.params.memberid;

        console.log(
            "SELECT dialog.id, dialog.subject, dialog.member_id, message.message, message.trainer_id, message.created_at, member.fname, member.lname, ( SELECT COUNT(unseen_messages.id) FROM hdn_messages unseen_messages WHERE unseen_messages.dialog_id = dialog.id AND unseen_messages.member_id != '0' AND unseen_messages.seen = '0' ) AS unseen FROM hdn_dialogs dialog LEFT JOIN hdn_messages message ON message.dialog_id = dialog.id AND message.created_at = ( SELECT MAX(m.created_at) FROM hdn_messages m WHERE m.dialog_id = dialog.id ) LEFT JOIN users member ON member.id = dialog.trainer_id WHERE dialog.member_id = '" +
            memberid +
            "' AND member.deleted_at IS NULL ORDER BY message.created_at DESC"
        );

        connection.query(
            "SELECT dialog.id, dialog.subject, dialog.member_id, message.message, message.trainer_id, message.created_at, member.fname, member.lname, ( SELECT COUNT(unseen_messages.id) FROM hdn_messages unseen_messages WHERE unseen_messages.dialog_id = dialog.id AND unseen_messages.member_id != '0' AND unseen_messages.seen = '0' ) AS unseen FROM hdn_dialogs dialog LEFT JOIN hdn_messages message ON message.dialog_id = dialog.id AND message.created_at = ( SELECT MAX(m.created_at) FROM hdn_messages m WHERE m.dialog_id = dialog.id ) LEFT JOIN users member ON member.id = dialog.trainer_id WHERE dialog.member_id = '" +
            memberid +
            "' AND member.deleted_at IS NULL ORDER BY message.created_at DESC",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_phonebook(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var appid = req.params.appid;

        console.log(
            "select * from hdn_company,hdn_phone where hdn_company.applicationID and hdn_company.id_user = hdn_phone.id_user and hdn_company.applicationID = '" +
            appid +
            "'"
        );

        connection.query(
            "select * from hdn_company,hdn_phone where hdn_company.applicationID and hdn_company.id_user = hdn_phone.id_user and hdn_company.applicationID = '" +
            appid +
            "'",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_new_message(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var trainer_id = req.body.trainer_id;
        var member_id = req.body.member_id;
        var subject = req.body.subject;
        var message = req.body.message;

        console.log(
            "============================================================================================================================================"
        );

        console.log(
            "insert into hdn_dialogs (trainer_id,member_id,subject) values (" +
            trainer_id +
            "," +
            member_id +
            ",'" +
            subject +
            "')"
        );
        connection.query(
            "insert into hdn_dialogs (trainer_id,member_id,subject) values (" +
            trainer_id +
            "," +
            member_id +
            ",'" +
            subject +
            "')",
            function(err, rows) {
                console.log(
                    "insert into hdn_messages (dialog_id,trainer_id,member_id,message) values (" +
                    rows.insertId +
                    "," +
                    trainer_id +
                    "," +
                    member_id +
                    ",'" +
                    message +
                    "')"
                );
                connection.query(
                    "insert into hdn_messages (dialog_id,trainer_id,member_id,message) values (" +
                    rows.insertId +
                    "," +
                    trainer_id +
                    "," +
                    member_id +
                    ",'" +
                    message +
                    "')",
                    function(err, rows) {
                        res.json(rows);
                    }
                );
            }
        );

        console.log(
            "============================================================================================================================================"
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_update_message(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var message = req.body.message;
        var messageid = req.body.messageid;

        if (messageid) {
            console.log(
                "update hdn_messages set  message = '" +
                message +
                "' where dialog_id = " +
                messageid
            );

            connection.query(
                "update hdn_messages set  message = '" +
                message +
                "' where dialog_id = " +
                messageid,
                function(err, rows) {
                    res.json(rows);
                }
            );
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_heart_class_stats(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        connection.query(
            "select * from hdn_report_hrclass where user_id = " +
            userid +
            " order by event_date",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_heart_total_club_stats(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var locationid = req.params.locationid;

        var sql =
            "select COALESCE(ROUND(sum(calories),0),0) as calories from hdn_report_hrclass where  location_id = " +
            locationid;

        console.log(sql);
        console.log("[" + locationid + "]");

        connection.query(sql, function(err, rows) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
            res.header("Access-Control-Allow-Headers", "Content-Type");
            res.header(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization, Content-Length, X-Requested-With"
            );

            res.json(rows);
        });

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_heart_topzone_class_stats_v2(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var locationid = req.params.locationid;
        var classid = req.params.classid;

        var sql =
            "SELECT fname,lname,age,gender,user_id,name, classid,event_date, ROUND(points,0) as count, 0 as classes FROM hdn_report_hrclass INNER JOIN (SELECT MAX(`classid`) as TopDate FROM hdn_report_hrclass where  company_id = 333 and location_id = " +
            locationid +
            " and classid = " +
            classid +
            ") AS EachItem ON EachItem.TopDate = hdn_report_hrclass.classid order by count desc  limit 28";

        //var sql = "SELECT fname,lname,age,gender,user_id,name, ROUND(points,0) as count, COUNT(*) as classes FROM hdn_report_hrclass where DATE(event_date) = DATE(NOW()) and company_id = 333 and location_id = " + locationid + "  GROUP BY user_id,classId order by count desc  limit 28";

        connection.query(sql, function(err, rows) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
            res.header("Access-Control-Allow-Headers", "Content-Type");
            res.header(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization, Content-Length, X-Requested-With"
            );

            res.json(rows);
        });

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_heart_topzone_class_stats(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var locationid = req.params.locationid;
        var sql =
            "SELECT fname,lname,age,gender,user_id,name, classid,event_date, ROUND(points,0) as count, 0 as classes FROM hdn_report_hrclass INNER JOIN (SELECT MAX(`classid`) as TopDate FROM hdn_report_hrclass where  company_id = 333 and location_id = " +
            locationid +
            " ) AS EachItem ON EachItem.TopDate = hdn_report_hrclass.classid order by count desc  limit 28";

        //var sql = "SELECT fname,lname,age,gender,user_id,name, ROUND(points,0) as count, COUNT(*) as classes FROM hdn_report_hrclass where DATE(event_date) = DATE(NOW()) and company_id = 333 and location_id = " + locationid + "  GROUP BY user_id,classId order by count desc  limit 28";

        connection.query(sql, function(err, rows) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
            res.header("Access-Control-Allow-Headers", "Content-Type");
            res.header(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization, Content-Length, X-Requested-With"
            );

            res.json(rows);
        });

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_heart_topzone_club_stats(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var locationid = req.params.locationid;

        var sql =
            "select fname,lname,age,gender,user_id,name, ROUND(sum(points),0) as count, COUNT(*) as classes from hdn_report_hrclass where location_id = " +
            locationid +
            " group by user_id order by count desc limit 28";

        //var sql = "select fname,lname,age,gender,userid,name, count(*) as count from device_heart_monitor,users,hdn_locations where intensity > 2 and users.company_id = 333 and hdn_locations.id = users.source_id and userid = users.id and maxheart IS NOT NULL  and  hdn_locations.id = " + locationid + " group by userid order by count desc limit 28";

        console.log(sql);
        console.log("[" + locationid + "]");

        connection.query(sql, function(err, rows) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
            res.header("Access-Control-Allow-Headers", "Content-Type");
            res.header(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization, Content-Length, X-Requested-With"
            );

            res.json(rows);
        });

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_heart_total_company_stats(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var locationid = req.params.locationid;

        var sql =
            "select ROUND(sum(calories),0) as calories from hdn_report_hrclass where  company_id = " +
            locationid;

        console.log(sql);
        console.log("[" + locationid + "]");

        connection.query(sql, function(err, rows) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
            res.header("Access-Control-Allow-Headers", "Content-Type");
            res.header(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization, Content-Length, X-Requested-With"
            );

            res.json(rows);
        });

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_heart_topzone_company_stats(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var locationid = req.params.locationid;

        var sql =
            "select fname,lname,age,gender,user_id,name, ROUND(sum(points),0) as count, COUNT(*) as classes from hdn_report_hrclass where company_id = 333 group by user_id order by count desc limit 28";
        //var sql = "select fname,lname,age,gender,userid,name, count(*) as count from device_heart_monitor,users,hdn_locations where users.company_id = " + locationid + " and intensity > 2 and users.company_id = 333 and hdn_locations.id = users.source_id and userid = users.id and maxheart IS NOT NULL group by userid order by count desc limit 28";

        console.log(sql);
        console.log("[" + locationid + "]");

        connection.query(sql, function(err, rows) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
            res.header("Access-Control-Allow-Headers", "Content-Type");
            res.header(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization, Content-Length, X-Requested-With"
            );

            res.json(rows);
        });

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_heart_topzone_stats(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var locationid = req.params.locationid;

        var sql =
            "select fname,lname,age,gender,userid,name, count(*) as count from device_heart_monitor,users,hdn_locations where intensity > 2 and users.company_id = 333 and hdn_locations.id = users.source_id and userid = users.id and maxheart IS NOT NULL group by userid order by count desc limit 20";

        // if ((locationid) && (locationid > 0))  {
        // sql = "select fname,lname,age,gender,userid,name, count(*) as count from device_heart_monitor,users,hdn_locations where intensity > 2 and users.company_id = 333 and hdn_locations.id = users.source_id and userid = users.id and maxheart IS NOT NULL  and  hdn_locations.id = " + locationid + " group by userid order by count desc limit 20";
        // }

        console.log(sql);
        console.log("[" + locationid + "]");

        connection.query(sql, function(err, rows) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
            res.header("Access-Control-Allow-Headers", "Content-Type");
            res.header(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization, Content-Length, X-Requested-With"
            );

            res.json(rows);
        });

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_heart_zone_stats(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        connection.query(
            "select intensity,count(*) as intentisty_0  from  device_heart_monitor where hr_heartrate > 0 and userid = " +
            userid +
            "  and DATE(date) > DATE(NOW()  - INTERVAL 1 DAY) and intensity = 0 union select intensity,count(*) as intentisty_1  from  device_heart_monitor where hr_heartrate > 0 and userid = " +
            userid +
            "  and DATE(date) >= DATE(NOW()  - INTERVAL 1 DAY)  and intensity = 1 union select intensity,count(*) as intentisty_2  from  device_heart_monitor where hr_heartrate > 0 and userid = " +
            userid +
            "  and DATE(date) >= DATE(NOW()  - INTERVAL 1 DAY)  and intensity = 2 union select intensity,count(*) as intentisty_3  from  device_heart_monitor where hr_heartrate > 0 and userid = " +
            userid +
            "  and DATE(date) >= DATE(NOW()  - INTERVAL 1 DAY)  and intensity = 3 union select intensity,count(*) as intentisty_4  from  device_heart_monitor where hr_heartrate > 0 and userid = " +
            userid +
            "  and DATE(date) >= DATE(NOW()  - INTERVAL 1 DAY)  and intensity = 4",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_heart_stats(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        // /and DATE(date) > DATE(NOW()  - INTERVAL 1 DAY)

        connection.query(
            "select fname,lname,age,targetWeight,if(gender = 1,'Male','Female') as gender,nike_user as beltid,device_heart_monitor.id,userid,calories,FLOOR(hr_heartrate) as hr_heartrate,FLOOR(avgheart) as avgheart,FLOOR(maxheart) as maxheart,FLOOR(minheart) as minheart,intensity,date,DATE_FORMAT(date, '%H%i%s') as num from device_heart_monitor,users where hr_heartrate > 0 and device_heart_monitor.userid = " +
            userid +
            " and users.id = device_heart_monitor.userid   and DATE(date) = DATE(NOW())  ORDER BY id DESC LIMIT 500",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_appgen_menu(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var memberid = req.params.memberid;

        connection.query(
            "select * from  hdn_application_menu_relations where company_id = '" +
            memberid +
            "' order by position",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_close_appgen(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var memberid = req.params.memberid;

        connection.query(
            "update hdn_appbuild set status = 1 where company_id = '" +
            memberid +
            "'",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_store_appgen(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var companyid = req.params.companyid;

        console.log(
            "SELECT * from  hdn_application_previews where company_id = " + companyid
        );

        connection.query(
            "SELECT * from  hdn_application_previews where company_id = " + companyid,
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_next_appgen(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var memberid = req.params.memberid;

        // console.log("SELECT * from hdn_company,hdn_application_view,hdn_appbuild where hdn_company.id =  hdn_application_view.company_id and hdn_company.id =  hdn_appbuild.company_id and status = 0 limit 1");
        // connection.query("SELECT * from hdn_company,hdn_application_view,hdn_appbuild where hdn_company.id =  hdn_application_view.company_id and hdn_company.id =  hdn_appbuild.company_id and status = 0 limit 1", function(err, rows) {

        console.log(
            "SELECT * from hdn_company,hdn_application_view,hdn_appbuild,hdn_api_providers_credentials where hdn_company.id = hdn_api_providers_credentials.company_id AND  hdn_company.id =  hdn_application_view.company_id and hdn_company.id =  hdn_appbuild.company_id and status = 0 limit 1"
        );

        connection.query(
            "SELECT * from hdn_company,hdn_application_view,hdn_appbuild,hdn_api_providers_credentials where hdn_company.id = hdn_api_providers_credentials.company_id AND  hdn_company.id =  hdn_application_view.company_id and hdn_company.id =  hdn_appbuild.company_id and status = 0 limit 1",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_appgen(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var memberid = req.params.memberid;

        console.log(
            "SELECT *,hdn_api_providers_credentials.source_id as club_id,hdn_api_providers_credentials.app_key as apipw,hdn_api_providers_credentials.provider  from hdn_api_providers_credentials,hdn_company,hdn_application_view,hdn_appbuild where hdn_company.id =  hdn_application_view.company_id and hdn_company.id =  hdn_appbuild.company_id and hdn_api_providers_credentials.company_id = hdn_appbuild.company_id and  hdn_api_providers_credentials.deleted_at is NULL and hdn_company.id = " +
            memberid +
            " limit 1"
        );

        connection.query(
            "SELECT *,hdn_api_providers_credentials.source_id as club_id,hdn_api_providers_credentials.app_key as apipw,hdn_api_providers_credentials.provider  from hdn_api_providers_credentials,hdn_company,hdn_application_view,hdn_appbuild where hdn_company.id =  hdn_application_view.company_id and hdn_company.id =  hdn_appbuild.company_id and hdn_api_providers_credentials.company_id = hdn_appbuild.company_id and hdn_api_providers_credentials.deleted_at is NULL and  hdn_company.id = " +
            memberid +
            " limit 1",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_temperature(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var serial = req.body.serial;
        var temparature = req.body.temparature;
        var humidity = req.body.humidity;

        console.log(
            "insert into hdn_temp (serial,temparature,humidity) values ('" +
            serial +
            "' , '" +
            temparature +
            "' , '" +
            humidity +
            "')"
        );
        connection.query(
            "insert into hdn_temp (serial,temparature,humidity) values ('" +
            serial +
            "' , '" +
            temparature +
            "' , '" +
            humidity +
            "')",
            function(err, rows) {
                console.log(
                    "update hdn_pool set humidity = '" +
                    humidity +
                    "' ,temp = '" +
                    temparature +
                    "' where serial = '" +
                    serial +
                    "'"
                );
                connection.query(
                    "update hdn_pool set humidity = '" +
                    humidity +
                    "' ,temp = '" +
                    temparature +
                    "' where serial = '" +
                    serial +
                    "'",
                    function(err, rows) {
                        res.json(rows);
                    }
                );
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_day_temperature(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var appid = req.params.appid;

        console.log(
            "select hdn_temp.time,hdn_temp.serial,hdn_temp.temparature as temp,hdn_temp.humidity,hdn_temp.id,hdn_pool.id_user,hdn_pool.name,hdn_pool.company_id from hdn_temp,hdn_pool,hdn_company where hdn_temp.time >= now() - INTERVAL 1 DAY and hdn_temp.serial = hdn_pool.serial  and hdn_company.id = hdn_pool.company_id  andhdn_company.applicationID = '" +
            appid +
            "'  group by DAY(hdn_temp.time),HOUR(hdn_temp.time) ,hdn_temp.serial order by time desc , hdn_temp.serial"
        );

        connection.query(
            "select hdn_temp.time,hdn_temp.serial,hdn_temp.temparature as temp,hdn_temp.temparature as temparature,hdn_temp.humidity,hdn_temp.id,hdn_pool.id_user,hdn_pool.name,hdn_pool.company_id from hdn_temp,hdn_pool,hdn_company where hdn_temp.time >= now() - INTERVAL 1 DAY and hdn_temp.serial = hdn_pool.serial  and hdn_company.id = hdn_pool.company_id  and hdn_company.applicationID = '" +
            appid +
            "'  group by DAY(hdn_temp.time),HOUR(hdn_temp.time) ,hdn_temp.serial order by time desc , hdn_temp.serial",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

// GOOGLE HOME

function handle_google_home(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        console.log(req);
    });
}

function handle_tracker(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var tempid = req.params.tempid;
        var userid = req.params.userid;

        console.log(
            "update hdn_events set event_name = 'OPENED' where user_id = " +
            userid +
            " and type = 'email' and status = 0 and param = " +
            tempid
        );
        connection.query(
            "update hdn_events set event_name = 'OPENED' where user_id = " +
            userid +
            " and type = 'email' and status = 0 and param = " +
            tempid,
            function(err, rows) {
                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_provider_credentials(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var companyid = req.params.companyid;

        console.log(
            "select * from partnerr_credentials where company_id = " + companyid
        );
        connection.query(
            "select * from partnerr_credentials where company_id = " + companyid,
            function(err, rows) {
                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_provider_myzone_user_data(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var guid = req.params.guid;
        var day = req.params.day;
        var company_id = req.params.company_id;

        console.log(
            "select * from hdn_provider_myzone_facilities_users,hdn_provider_myzone_member_key_data where hdn_provider_myzone_facilities_users.company_id = " +
            company_id +
            " and hdn_provider_myzone_facilities_users.guid =  hdn_provider_myzone_member_key_data.guid and DAYOFYEAR(start) = " +
            day +
            " and hdn_provider_myzone_facilities_users.belt = " +
            guid +
            "  order by lastUpdate"
        );
        connection.query(
            "select * from hdn_provider_myzone_facilities_users,hdn_provider_myzone_member_key_data where hdn_provider_myzone_facilities_users.company_id = " +
            company_id +
            " and hdn_provider_myzone_facilities_users.guid =  hdn_provider_myzone_member_key_data.guid and DAYOFYEAR(start) = " +
            day +
            " and hdn_provider_myzone_facilities_users.belt = " +
            guid +
            "  order by lastUpdate",
            function(err, rows) {
                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_provider_myzone_user(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var guid = req.params.guid;
        var day = req.params.day;
        var company_id = req.params.company_id;

        console.log(
            "select * from hdn_provider_myzone_facilities_users where company_id = " +
            company_id +
            " and belt = '" +
            guid
        );
        connection.query(
            "select * from hdn_provider_myzone_facilities_users where company_id = " +
            company_id +
            " and belt = " +
            guid,
            function(err, rows) {
                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_provider_myzone_biometrics(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var guid = req.params.guid;
        var day = req.params.day;
        var company_id = req.params.company_id;

        console.log(
            "select * from hdn_provider_myzone_facilities_users,hdn_provider_myzone_biometrics where hdn_provider_myzone_facilities_users.company_id = " +
            company_id +
            " and hdn_provider_myzone_facilities_users.guid =  hdn_provider_myzone_biometrics.guid  and hdn_provider_myzone_facilities_users.belt = " +
            guid
        );
        connection.query(
            "select * from hdn_provider_myzone_facilities_users,hdn_provider_myzone_biometrics where hdn_provider_myzone_facilities_users.company_id = " +
            company_id +
            " and hdn_provider_myzone_facilities_users.guid =  hdn_provider_myzone_biometrics.guid  and hdn_provider_myzone_facilities_users.belt = " +
            guid,
            function(err, rows) {
                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_get_heartrate(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var user_id = req.params.userid;
        var day = req.params.day;

        console.log(
            "SELECT date,DAYOFYEAR(date) as day,HOUR(date) hour,MINUTE(date) as minute, hr_heartrate hr, (SELECT MAX(hr_heartrate) from device_heart_monitor where userid = " +
            user_id +
            ") as maxHR,id AS timekey FROM device_heart_monitor where DAYOFYEAR(date) = " +
            day +
            " and userid = " +
            user_id +
            "  GROUP BY timekey order by time"
        );
        connection.query(
            "SELECT date,DAYOFYEAR(date) as day,HOUR(date) hour,MINUTE(date) as minute, hr_heartrate hr, (SELECT MAX(hr_heartrate) from device_heart_monitor where userid = " +
            user_id +
            ") as maxHR,id AS timekey FROM device_heart_monitor where DAYOFYEAR(date) = " +
            day +
            " and userid = " +
            user_id +
            "  GROUP BY timekey order by time",
            function(err, rows) {
                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_provider_myzone_heart(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var guid = req.params.guid;
        var day = req.params.day;
        var company_id = req.params.company_id;

        console.log(
            "SELECT time,DAYOFYEAR(time) as day,HOUR(time) hour,MINUTE(time) as minute, AVG(hr) hr,maxHR,ROUND(UNIX_TIMESTAMP(time)/(5 * 60)) AS timekey FROM hdn_provider_myzone_facilities_users,hdn_provider_myzone_hr_data where hdn_provider_myzone_facilities_users.company_id = " +
            company_id +
            " and DAYOFYEAR(time) = " +
            day +
            " and  hdn_provider_myzone_facilities_users.guid =  hdn_provider_myzone_hr_data.guid  and hdn_provider_myzone_facilities_users.belt = " +
            guid +
            " GROUP BY timekey order by time"
        );
        connection.query(
            "SELECT time,DAYOFYEAR(time) as day,HOUR(time) hour,MINUTE(time) as minute, AVG(hr) hr,maxHR,ROUND(UNIX_TIMESTAMP(time)/(5 * 60)) AS timekey FROM hdn_provider_myzone_facilities_users,hdn_provider_myzone_hr_data where hdn_provider_myzone_facilities_users.company_id = " +
            company_id +
            " and DAYOFYEAR(time) = " +
            day +
            " and  hdn_provider_myzone_facilities_users.guid =  hdn_provider_myzone_hr_data.guid  and hdn_provider_myzone_facilities_users.belt = " +
            guid +
            " GROUP BY timekey order by time",
            function(err, rows) {
                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_delete_spin_class(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var classid = req.body.classid;
        var userid = req.body.userid;

        console.log(
            "delete from hdn_spin_reserve where class_id = " +
            classid +
            " and user_id = " +
            userid
        );
        connection.query(
            "delete from hdn_spin_reserve where class_id = " +
            classid +
            " and user_id = " +
            userid,
            function(err, rows) {
                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_get_spin_class(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var classid = req.params.classid;

        console.log("select * from hdn_spin_reserve where class_id = " + classid);
        connection.query(
            "select * from hdn_spin_reserve where class_id = " + classid,
            function(err, rows) {
                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_post_spin_class(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var classid = req.body.classid;
        var userid = req.body.userid;
        var bikeid = req.body.bikeid;
        var companyid = req.body.companyid;

        var eventType = "RESERVE_CLASS";

        console.log(
            "select * from hdn_spin_reserve where class_id = " +
            classid +
            " and user_id = " +
            userid
        );
        connection.query(
            "select * from hdn_spin_reserve where class_id = " +
            classid +
            " and user_id = " +
            userid,
            function(err, rows) {
                if (rows.length == 0) {
                    pushMessage(userid, "Your class is reservered");
                    update_reward_points(userid, 5);
                    console.log(
                        "insert into hdn_spin_reserve (class_id,user_id,bike_id,lastUpdate) VALUES (" +
                        classid +
                        "," +
                        userid +
                        "," +
                        bikeid +
                        ",CONVERT_TZ(NOW(),'+00:00','+00:00'))"
                    );

                    connection.query(
                        "insert into hdn_spin_reserve (class_id,user_id,bike_id,lastUpdate) VALUES (" +
                        classid +
                        "," +
                        userid +
                        "," +
                        bikeid +
                        ",CONVERT_TZ(NOW(),'+00:00','+00:00'))",
                        function(err, rows) {
                            console.log(
                                "insert into hdn_events (company_id,user_id,day,lastUpdate,event_name,event,state,type) values ('" +
                                companyid +
                                "','" +
                                userid +
                                "'" +
                                ",DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')),CONVERT_TZ(NOW(),'+00:00','+00:00'),'" +
                                eventType +
                                "'" +
                                ",0,1,'class')"
                            );
                            connection.query(
                                "insert into hdn_events (company_id,user_id,day,lastUpdate,event_name,event,state,type) values ('" +
                                companyid +
                                "','" +
                                userid +
                                "'" +
                                ",DAYOFYEAR(CONVERT_TZ(DATE_FORMAT(NOW(),'%Y-%m-%d'),'+00:00','+00:00')),CONVERT_TZ(NOW(),'+00:00','+00:00'),'" +
                                eventType +
                                "'" +
                                ",0,1,'class')",
                                function(err, rows) {}
                            );

                            res.json(rows);
                            return;
                        }
                    );
                } else {
                    console.log(
                        "update hdn_spin_reserve set bike_id = " +
                        bikeid +
                        " where user_id = " +
                        userid +
                        " and class_id = " +
                        classid
                    );

                    connection.query(
                        "update hdn_spin_reserve set bike_id = " +
                        bikeid +
                        " where user_id = " +
                        userid +
                        " and class_id = " +
                        classid,
                        function(err, rows) {
                            res.json(rows);
                            return;
                        }
                    );
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_myschedule_v3(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        console.log(
            "select hdn_classes.*,hdn_myschedule.booking_id,users.source_id as store_id,CONCAT(users.fname,' ',users.lname) as instructor from hdn_classes join hdn_myschedule on hdn_myschedule.class_id = hdn_classes.id left join users on hdn_classes.employee_id = users.id left join hdn_locations on hdn_classes.location_id = hdn_locations.id left join users as b on hdn_myschedule.user_id = b.id where MONTH(end_date) = MONTH(CONVERT_TZ(NOW(),'UTC',hdn_locations.timezone)) and hdn_myschedule.user_id = " +
            userid
        );

        connection.query(
            "select hdn_classes.*,hdn_myschedule.booking_id,users.source_id as store_id,CONCAT(users.fname,' ',users.lname) as instructor from hdn_classes join hdn_myschedule on hdn_myschedule.class_id = hdn_classes.id left join users on hdn_classes.employee_id = users.id left join hdn_locations on hdn_classes.location_id = hdn_locations.id left join users as b on hdn_myschedule.user_id = b.id where MONTH(end_date) = MONTH(CONVERT_TZ(NOW(),'UTC',hdn_locations.timezone)) and hdn_myschedule.user_id = " +
            userid,
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_myschedule_v2(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        console.log(
            "select hdn_classes.*,hdn_myschedule.booking_id,hdn_api_providers_credentials.source_id as store_id from hdn_myschedule,hdn_classes,hdn_api_providers_credentials where hdn_myschedule.user_id = " +
            userid +
            " and hdn_classes.id = hdn_myschedule.class_id and MONTH(hdn_myschedule.day) >= MONTH(NOW()) and YEAR(hdn_myschedule.day) = YEAR(NOW())  and hdn_api_providers_credentials.location = hdn_classes.location_id"
        );
        connection.query(
            "select hdn_classes.*,hdn_myschedule.booking_id,hdn_api_providers_credentials.source_id as store_id from hdn_myschedule,hdn_classes,hdn_api_providers_credentials where hdn_myschedule.user_id = " +
            userid +
            " and hdn_classes.id = hdn_myschedule.class_id and MONTH(hdn_myschedule.day) >= MONTH(NOW()) and YEAR(hdn_myschedule.day) = YEAR(NOW())  and hdn_api_providers_credentials.location = hdn_classes.location_id",
            function(err, rows) {
                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_myschedule(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        console.log(
            "select hdn_classes.*,hdn_myschedule.day as event_date from hdn_myschedule,hdn_classes where hdn_myschedule.user_id = " +
            userid +
            " and hdn_classes.id = hdn_myschedule.class_id and MONTH(hdn_myschedule.day) >= MONTH(NOW()) and YEAR(hdn_myschedule.day) = YEAR(NOW())"
        );
        connection.query(
            "select hdn_classes.*,hdn_myschedule.day as event_date from hdn_myschedule,hdn_classes where hdn_myschedule.user_id = " +
            userid +
            " and hdn_classes.id = hdn_myschedule.class_id and MONTH(hdn_myschedule.day) >= MONTH(NOW()) and YEAR(hdn_myschedule.day) = YEAR(NOW())",
            function(err, rows) {
                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_remove_myschedule(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var classid = req.params.classid;
        var userid = req.params.userid;

        console.log(
            "delete from hdn_myschedule where class_id = " +
            classid +
            " and user_id = " +
            userid
        );
        connection.query(
            "delete from hdn_myschedule where class_id = " +
            classid +
            " and user_id = " +
            userid,
            function(err, rows) {
                connection.query(
                    "delete from hdn_spin_reserve where class_id = " +
                    classid +
                    " and user_id = " +
                    userid,
                    function(err, rows) {
                        connection.query(
                            " update hdn_classes set current_attendees = current_attendees - 1 where id = " +
                            classid,
                            function(err, rows) {
                                connection.query(
                                    "delete from hdn_class_cancel where class_id = " +
                                    classid +
                                    " and user_id = " +
                                    userid,
                                    function(err, rows) {}
                                );

                                pushMessage(userid, "Your reservation has been cancelled");

                                connection.query(
                                    "insert into hdn_class_cancel (class_id,user_id,lastUpdate) VALUES (" +
                                    classid +
                                    "," +
                                    userid +
                                    ",CONVERT_TZ(NOW(),'+00:00','+00:00'))",
                                    function(err, rows) {}
                                );
                            }
                        );
                    }
                );

                update_reward_points(userid, -5);

                // REMOVE code to reward for a class
                //connection.query("insert into hdn_myschedule (class_id,user_id,booking_id,lastUpdate,day) VALUES (" + classid + "," + userid +  ",CONVERT_TZ(NOW(),'+00:00','+00:00'),'" + date + "')", function(err, rows) { });

                res.json(rows);
                return;
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_class_reservations(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var classid = req.params.classid;

        /*
                console.log("select fname,lname,hdn_myschedule.id,users.id,hdn_myschedule.class_id,day,nike_user,bike_id from hdn_myschedule,users,hdn_spin_reserve where hdn_myschedule.user_id = users.id and  hdn_spin_reserve.class_id = hdn_myschedule.class_id and  hdn_spin_reserve.user_id = hdn_myschedule.user_id and hdn_myschedule.class_id = " + classid );
               */
        console.log(
            "select users.fname,users.lname,users.targetweight as weight,hdn_myschedule.id,users.id as user_id,hdn_myschedule.class_id,hdn_myschedule.day,TRIM(LEADING '0' FROM nike_user) as nike_user,bike_id from hdn_classes,hdn_myschedule,hdn_spin_reserve,users where  hdn_classes.id =  hdn_myschedule.class_id and hdn_spin_reserve.class_id =  hdn_classes.id and users.id =  hdn_spin_reserve.user_id and  hdn_myschedule.class_id = " +
            classid +
            " group by users.id"
        );
        connection.query(
            "select fname,lname,users.targetweight as weight,users.age,users.gender,hdn_myschedule.id,users.id,hdn_myschedule.class_id,day,TRIM(LEADING '0' FROM nike_user) as nike_user,bike_id from hdn_myschedule,users,hdn_spin_reserve where hdn_myschedule.user_id = users.id and  hdn_spin_reserve.class_id = hdn_myschedule.class_id and  hdn_spin_reserve.user_id = hdn_myschedule.user_id and hdn_myschedule.class_id = " +
            classid +
            " group by users.id",
            function(err, rows) {
                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_save_myschedule(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var classid = req.params.classid;
        var userid = req.params.userid;
        var date = req.params.date;

        console.log(
            "select * from hdn_myschedule where class_id = " +
            classid +
            " and user_id = " +
            userid +
            " and day = '" +
            date +
            "'"
        );
        connection.query(
            "select * from hdn_myschedule where class_id = " +
            classid +
            " and user_id = " +
            userid +
            " and day = '" +
            date +
            "'",
            function(err, rows) {
                if (rows.length == 0) {
                    console.log(
                        "insert into hdn_myschedule (class_id,user_id,booking_id,lastUpdate,day) VALUES (" +
                        classid +
                        "," +
                        userid +
                        ",CONVERT_TZ(NOW(),'+00:00','+00:00'),'" +
                        date +
                        "')"
                    );

                    connection.query(
                        "insert into hdn_myschedule (class_id,user_id,booking_id,lastUpdate,day) VALUES (" +
                        classid +
                        "," +
                        userid +
                        ",CONVERT_TZ(NOW(),'+00:00','+00:00'),'" +
                        date +
                        "')",
                        function(err, rows) {
                            update_reward_points(userid, 5);
                            pushMessage(userid, "Your reservation has been scheduled");

                            // ADD code to reward for a class
                            //connection.query("insert into hdn_myschedule (class_id,user_id,booking_id,lastUpdate,day) VALUES (" + classid + "," + userid +  ",CONVERT_TZ(NOW(),'+00:00','+00:00'),'" + date + "')", function(err, rows) { });

                            res.json(rows);
                            return;
                        }
                    );
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_save_myschedule_v2(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var classid = req.params.classid;
        var userid = req.params.userid;
        var date = req.params.date;
        var booking_id = req.params.booking_id;

        console.log(
            "select * from hdn_myschedule where class_id = " +
            classid +
            " and user_id = " +
            userid +
            " and day = '" +
            date +
            "'"
        );
        connection.query(
            "select * from hdn_myschedule where class_id = " +
            classid +
            " and user_id = " +
            userid +
            " and day = '" +
            date +
            "'",
            function(err, rows) {
                if (rows.length == 0) {
                    console.log(
                        "insert into hdn_myschedule (class_id,user_id,booking_id,lastUpdate,day) VALUES (" +
                        classid +
                        "," +
                        userid +
                        "," +
                        booking_id +
                        ",CONVERT_TZ(NOW(),'+00:00','+00:00'),'" +
                        date +
                        "')"
                    );

                    connection.query(
                        "insert into hdn_myschedule (class_id,user_id,booking_id,lastUpdate,day) VALUES (" +
                        classid +
                        "," +
                        userid +
                        "," +
                        booking_id +
                        ",CONVERT_TZ(NOW(),'+00:00','+00:00'),'" +
                        date +
                        "')",
                        function(err, rows) {
                            // Automaticall book a bag
                            console.log(
                                "SELECT  bike_id  + 1 as start FROM    hdn_spin_reserve mo WHERE   NOT EXISTS (SELECT  NULL FROM    hdn_spin_reserve mi WHERE   mi.bike_id  = mo.bike_id  + 1 and class_id = " +
                                classid +
                                ") and class_id = " +
                                classid +
                                " ORDER BY id LIMIT 1"
                            );
                            connection.query(
                                "SELECT  bike_id  + 1 as start FROM    hdn_spin_reserve mo WHERE   NOT EXISTS (SELECT  NULL FROM    hdn_spin_reserve mi WHERE   mi.bike_id  = mo.bike_id  + 1 and class_id = " +
                                classid +
                                ") and class_id = " +
                                classid +
                                " ORDER BY id LIMIT 1",
                                function(err, bookrows) {
                                    // I have the next spot
                                    var bikeid = 1;

                                    if (bookrows.length == 1) {
                                        var row = bookrows[0];
                                        bikeid = row.start;
                                    }

                                    connection.query(
                                        " update hdn_classes set current_attendees = current_attendees + 1 where id = " +
                                        classid,
                                        function(err, rows) {
                                            pushMessage(
                                                userid,
                                                "Your reservation has been scheduled"
                                            );
                                        }
                                    );

                                    if (bikeid <= 30) {
                                        console.log(
                                            "insert into hdn_spin_reserve (class_id,user_id,bike_id,lastUpdate) VALUES (" +
                                            classid +
                                            "," +
                                            userid +
                                            "," +
                                            bikeid +
                                            ",CONVERT_TZ(NOW(),'+00:00','+00:00'))"
                                        );
                                        connection.query(
                                            "insert into hdn_spin_reserve (class_id,user_id,bike_id,lastUpdate) VALUES (" +
                                            classid +
                                            "," +
                                            userid +
                                            "," +
                                            bikeid +
                                            ",CONVERT_TZ(NOW(),'+00:00','+00:00'))",
                                            function(err, rows) {}
                                        );

                                        connection.query(
                                            "delete from hdn_class_cancel where class_id = " +
                                            classid +
                                            " and user_id = " +
                                            userid,
                                            function(err, rows) {}
                                        );
                                    }
                                }
                            );

                            // ADD code to reward for a class
                            update_reward_points(userid, 5);
                            // pushMessage(userid,"Your reservation has been scheduled");

                            res.json(rows);
                            return;
                        }
                    );
                } else {
                    res.json(rows[0]);
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_city_promotions(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var company_id = req.params.company_id;

        console.log(
            "select * from hdn_store_promotions where company_id = " + company_id
        );
        connection.query(
            "select * from hdn_store_promotions where company_id = " + company_id,
            function(err, rows) {
                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_get_family(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var memnum = req.params.memnum;
        var companyid = req.params.company_id;

        console.log(
            "select users.fname,users.lname,users.scancode from users where  users.memnum = " +
            memnum +
            " and users.company_id = " +
            companyid +
            " group by users.scancode"
        );
        connection.query(
            "select users.fname,users.lname,users.scancode from users where  users.memnum = " +
            memnum +
            " and users.company_id = " +
            companyid +
            " group by users.scancode",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_get_friends(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;
        var companyid = req.params.company_id;

        console.log(
            "select users.fname,users.lname,users.id,users.avatar from hdn_friends,users where hdn_friends.id_friend_user = users.id and hdn_friends.id_user = " +
            userid +
            " and hdn_friends.company_id = " +
            companyid
        );
        connection.query(
            "select users.fname,users.lname,users.id,users.avatar from hdn_friends,users where hdn_friends.id_friend_user = users.id and hdn_friends.id_user = " +
            userid +
            " and hdn_friends.company_id = " +
            companyid,
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_set_friends(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;
        var friend_userid = req.params.friend_userid;
        var companyid = req.params.company_id;

        console.log(
            "select * from users where users.scancode = " +
            friend_userid +
            " and company_id = " +
            companyid
        );
        connection.query(
            "select * from users where users.scancode = " +
            friend_userid +
            " and company_id = " +
            companyid,
            function(err, rows) {
                if (rows.length > 0) {
                    var row = rows[0];
                    friend_userid = row.id;

                    console.log(
                        "insert into hdn_friends (id_friend_user,id_user,company_id,lastUpdate) VALUES (" +
                        friend_userid +
                        "," +
                        userid +
                        "," +
                        companyid +
                        ",CONVERT_TZ(NOW(),'+00:00','+00:00'))"
                    );
                    connection.query(
                        "insert into hdn_friends (id_friend_user,id_user,company_id,lastUpdate) VALUES (" +
                        friend_userid +
                        "," +
                        userid +
                        "," +
                        companyid +
                        ",CONVERT_TZ(NOW(),'+00:00','+00:00'))",
                        function(err, rows) {
                            update_reward_points(userid, 5);
                            pushMessage(userid, "Your freind is connected");

                            res.header("Access-Control-Allow-Origin", "*");
                            res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                            res.header("Access-Control-Allow-Headers", "Content-Type");
                            res.header(
                                "Access-Control-Allow-Headers",
                                "Content-Type, Authorization, Content-Length, X-Requested-With"
                            );

                            res.json(rows);
                            return;
                        }
                    );
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_get_pc_stats(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        console.log(
            "select name,sum(calorie) as calories, sum(distance) as distance,sum(duration) as duration from precor_relationship,precor_activity,lifefitness_equipment where precor_activity.equipmentid = lifefitness_equipment.id and MONTH(date) = MONTH(NOW()) and precor_relationship.exerciserAccountId = precor_activity.user_id and precor_relationship.user_id = " +
            userid +
            " group by lifefitness_equipment.id "
        );
        connection.query(
            "select name,sum(calorie) as calories, sum(distance) as distance,sum(duration) as duration from precor_relationship,precor_activity,lifefitness_equipment where precor_activity.equipmentid = lifefitness_equipment.id and MONTH(date) = MONTH(NOW()) and precor_relationship.exerciserAccountId = precor_activity.user_id and precor_relationship.user_id = " +
            userid +
            " group by lifefitness_equipment.id ",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_get_pc_month(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        console.log(
            "select precor_activity.id,name,calorie, distance,duration from precor_relationship,precor_activity,lifefitness_equipment where precor_activity.equipmentid = lifefitness_equipment.id and MONTH(date) = MONTH(NOW()) and precor_relationship.exerciserAccountId = precor_activity.user_id and precor_relationship.user_id = " +
            userid
        );
        connection.query(
            "select precor_activity.id,name,calorie, distance,duration from precor_relationship,precor_activity,lifefitness_equipment where precor_activity.equipmentid = lifefitness_equipment.id and MONTH(date) = MONTH(NOW()) and precor_relationship.exerciserAccountId = precor_activity.user_id and precor_relationship.user_id = " +
            userid,
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_get_lf_month(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        console.log(
            "select lifefitness_activity.id,name,calorie, distance,duration from lifefitness_activity,lifefitness_equipment where lifefitness_activity.equipmentid = lifefitness_equipment.id and MONTH(date) = MONTH(NOW()) and user_id = " +
            userid
        );
        connection.query(
            "select lifefitness_activity.id,name,calorie, distance,duration from lifefitness_activity,lifefitness_equipment where lifefitness_activity.equipmentid = lifefitness_equipment.id and MONTH(date) = MONTH(NOW()) and user_id = " +
            userid,
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_get_video(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var companyid = req.params.companyid;

        console.log(
            "select hdn_fod_videos.id, hdn_fod_videos.fod_id, hdn_fod_videos.name, hdn_fod_videos.duration, hdn_fod_videos.calories, hdn_fod_videos.description, hdn_fod_videos.poster, hdn_fod_videos.thumbnail, hdn_fod_categories.id AS category_id, hdn_fod_categories.fod_id AS category_fod_id, hdn_fod_categories.code AS category_code, hdn_fod_categories.name AS category_name,  hdn_fod_videos_activates.active from hdn_fod_videos LEFT JOIN hdn_fod_categories_relations ON hdn_fod_categories_relations.video_id =  hdn_fod_videos.id LEFT JOIN hdn_fod_categories ON hdn_fod_categories.id = hdn_fod_categories_relations.category_id LEFT JOIN hdn_fod_videos_activates ON hdn_fod_videos_activates.video_id = hdn_fod_videos.id WHERE active = 1 and company_id = " +
            companyid
        );
        connection.query(
            "select hdn_fod_videos.id, hdn_fod_videos.fod_id, hdn_fod_videos.name, hdn_fod_videos.duration, hdn_fod_videos.calories, hdn_fod_videos.description, hdn_fod_videos.poster, hdn_fod_videos.thumbnail, hdn_fod_categories.id AS category_id, hdn_fod_categories.fod_id AS category_fod_id, hdn_fod_categories.code AS category_code, hdn_fod_categories.name AS category_name,  hdn_fod_videos_activates.active from hdn_fod_videos LEFT JOIN hdn_fod_categories_relations ON hdn_fod_categories_relations.video_id =  hdn_fod_videos.id LEFT JOIN hdn_fod_categories ON hdn_fod_categories.id = hdn_fod_categories_relations.category_id LEFT JOIN hdn_fod_videos_activates ON hdn_fod_videos_activates.video_id = hdn_fod_videos.id WHERE active = 1 and company_id = " +
            companyid,
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_get_lf_stats(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        console.log(
            "select name,sum(calorie) as calories, sum(distance) as distance,sum(duration) as duration from lifefitness_activity,lifefitness_equipment where lifefitness_activity.equipmentid = lifefitness_equipment.id and MONTH(date) = MONTH(NOW()) and user_id = " +
            userid +
            " group by lifefitness_equipment.id "
        );
        connection.query(
            "select name,sum(calorie) as calories, sum(distance) as distance,sum(duration) as duration from lifefitness_activity,lifefitness_equipment where lifefitness_activity.equipmentid = lifefitness_equipment.id and MONTH(date) = MONTH(NOW()) and user_id = " +
            userid +
            " group by lifefitness_equipment.id ",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function dayOfYear(date) {
    var start = new Date(date.getFullYear(), 0, 0);
    var diff = date - start;
    var oneDay = 1000 * 60 * 60 * 24;
    var day = Math.floor(diff / oneDay) + 1;

    return day;
}

function handle_hdn_get_timeline(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var today = new Date();
        var days = 31;
        var doy = dayOfYear(today) - 1;
        var step_sql = "";
        var userid = req.params.userid;

        for (var iday = 0; iday < days; iday++) {
            step_sql =
                step_sql +
                " UNION ALL select '1k_steps' as type,   CONCAT(DATE_FORMAT(DATE_ADD(NOW(), INTERVAL - " +
                iday +
                " DAY),'%m-%d'),' • Steps completed') as description,DATE_ADD(NOW(), INTERVAL - " +
                iday +
                " DAY) as lastUpdate,CONCAT('') as meta,`" +
                doy +
                "` as points from  hdn_checkin_steps_year where user_id = " +
                userid +
                " and  `" +
                doy +
                "` > 0";
            // +  " UNION ALL select '3k_steps' as type,   CONCAT('3k steps completed') as description,DATE_ADD(NOW(), INTERVAL - " + doy + " DAY),CONCAT('') as meta,`" + doy + "` as points from  hdn_checkin_steps_year where user_id = " + userid + " and  `" + doy + "` > 3000 and `" + doy + "` < 5000 and MONTH(DATE_ADD(NOW(), INTERVAL - " + doy + " DAY)) = MONTH(NOW())  and YEAR(DATE_ADD(NOW(), INTERVAL - " + doy + " DAY)) = YEAR(NOW())"
            // + " UNION ALL select '5k_steps' as type,   CONCAT('5k steps completed') as description,DATE_ADD(NOW(), INTERVAL - " + doy + " DAY),CONCAT('') as meta,`" + doy + "` as points from  hdn_checkin_steps_year where user_id = " + userid + " and  `" + doy + "` > 5000 and `" + doy + "` < 10000 and MONTH(DATE_ADD(NOW(), INTERVAL - " + doy + " DAY)) = MONTH(NOW())  and YEAR(DATE_ADD(NOW(), INTERVAL - " + doy + " DAY)) = YEAR(NOW())"
            // + " UNION ALL select '10k_steps' as type,   CONCAT('10k steps completed') as description,DATE_ADD(NOW(), INTERVAL - " + doy + " DAY),CONCAT('') as meta,`" + doy + "` as points from  hdn_checkin_steps_year where user_id = " + userid + " and  `" + doy + "` > 10000 and MONTH(lastUpdate) = MONTH(NOW())  and YEAR(lastUpdate) = YEAR(NOW())";

            console.log(step_sql);
            doy = doy - 1;
        }

        var now = new Date();
        var start = new Date(now.getFullYear(), 0, 0);
        var diff =
            now -
            start +
            (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
        var oneDay = 1000 * 60 * 60 * 24;
        var day = Math.floor(diff / oneDay);

        console.log(
            "select type,description,lastUpdate,meta,points from ( select 'checkin' as type,  CONCAT(DATE_FORMAT(checkin,'%m-%d'),' • Visit to ',company) as description,checkin as lastUpdate,CONCAT('') as meta, 10 as points from hdn_report_checkin where  MONTH(checkin) >= MONTH(NOW()) and YEAR(checkin) = YEAR(NOW())  and user_id =  " +
            userid +
            " group by description,DAY(checkin) " +
            " UNION ALL select 'class_visit' as type, CONCAT(DATE_FORMAT(lastUpdate,'%m-%d'),' • ',classname,' in ' ,classroom,' @ ' ,classtime)  as description,lastUpdate,CONCAT('') as meta,5 as points from beacon_daily_room_counter where user_id = " +
            userid +
            " and MONTH(lastUpdate) >= MONTH(NOW()) and  YEAR(lastUpdate) = YEAR(NOW()) " +
            " UNION ALL select challenge as type,   CONCAT(DATE_FORMAT(date,'%m-%d'),' • Checkin challenge ', days, ' consecutive days') as description,date as lastUpdate,CONCAT('') as meta,20 as points from  hdn_challenges where user_id = " +
            userid +
            " and  challenge = 'hdn_checkin_year' and MONTH(date) >= MONTH(NOW()) and  YEAR(date) = YEAR(NOW())  " +
            " UNION ALL select challenge as type,   CONCAT(DATE_FORMAT(date,'%m-%d'),' • Step challenge ', days, ' consecutive days') as description,date as lastUpdate,CONCAT('') as meta,20 as points from  hdn_challenges where user_id = " +
            userid +
            " and  challenge = 'hdn_checkin_steps_year' and MONTH(date) >= MONTH(NOW()) and  YEAR(date) = YEAR(NOW())  " +
            " UNION ALL select 'class_achievement' as type,   CONCAT(days, ' consecutive class visits') as description,date as lastUpdate,CONCAT('') as meta,20 as points from  hdn_challenges where user_id = " +
            userid +
            " and  challenge = 'hdn_checkin_class_year' and MONTH(date) >= MONTH(NOW()) and  YEAR(date) = YEAR(NOW())  " +
            " UNION ALL select 'feeling' as type,  CONCAT(DATE_FORMAT(lastUpdate,'%m-%d'),' • Feelings completed') as description,lastUpdate,CONCAT('') as meta, 5 as points from beacon_daily_counter_user where  MONTH(lastUpdate) >= MONTH(NOW()) and YEAR(lastUpdate) = YEAR(NOW()) and feeling > 0 and user_id =  " +
            userid +
            " group by DAY(lastUpdate) " +
            " UNION ALL select 'my_schedule' as type, CONCAT(DATE_FORMAT(lastUpdate,'%m-%d'),' • ', class , ' class on ',dayname, ' at ', time,' with ',instructor) as description, hdn_myschedule.day as lastUpdate,CONCAT('') as meta, 5 as points from  hdn_myschedule, hdn_classes where  hdn_classes.id =  hdn_myschedule.class_id and hdn_myschedule.user_id = " +
            userid +
            " UNION ALL select 'peloton_fitness' as type, CONCAT(DATE_FORMAT(date,'%m-%d'),' • ',class, ' ', calorie, ' cal') as description, date as lastUpdate,CONCAT(peloton_activity.equipmentId,',',class,',',calorie,',',distance,',',duration,',',watts) as meta,ROUND(calorie * .10,0) as points from peloton_activity,lifefitness_equipment where peloton_activity.equipmentid = lifefitness_equipment.id and MONTH(date) = MONTH(NOW())  and YEAR(date) = YEAR(NOW()) and user_id = " +
            userid +
            " UNION ALL select 'matrix_fitness' as type, CONCAT(DATE_FORMAT(date,'%m-%d'),' • ', if ((matrix_activity.equipmentId = 21 or  matrix_activity.equipmentId = 23) ,ROUND(distance ,0),ROUND(distance * 0.000621371,2)) , if ((matrix_activity.equipmentId = 21 or  matrix_activity.equipmentId = 23),' steps on ',' miles on '), name,' ',  ROUND(calorie / 4184,2) , ' cal') as description, date as lastUpdate,CONCAT(matrix_activity.equipmentId,',',name,',',calorie,',',distance,',',speed) as meta,ROUND(distance * 0.000621371,2) * 10 as points from matrix_activity,lifefitness_equipment where matrix_activity.equipmentId = lifefitness_equipment.id and MONTH(date) = MONTH(NOW())  and YEAR(date) = YEAR(NOW()) and user_id =  " +
            userid +
            " UNION ALL select 'precor_fitness' as type, CONCAT(DATE_FORMAT(date,'%m-%d'),' • ', ROUND(distance,2), ' miles on ', name,' ',  calorie, ' cal') as description, date as lastUpdate,CONCAT(precor_activity.equipmentId,',',name,',',calorie,',',distance,',',duration) as meta,ROUND(distance * 10,0) as points from precor_relationship,precor_activity,lifefitness_equipment where precor_relationship.exerciserAccountId  = precor_activity.user_id AND precor_activity.equipmentid = lifefitness_equipment.id and MONTH(date) = MONTH(NOW())  and YEAR(date) = YEAR(NOW()) and precor_relationship.user_id = " +
            userid +
            " UNION ALL select 'fod_fitness' as type, CONCAT(DATE_FORMAT(startdate,'%m-%d'),' • ',class) as description, startdate as lastUpdate,CONCAT(class) as meta,5 as points from hdn_fod_activity where  MONTH(startdate) = MONTH(NOW())  and YEAR(startdate) = YEAR(NOW()) and user_id =  " +
            userid +
            step_sql +
            " UNION ALL select 'life_fitness' as type, CONCAT(DATE_FORMAT(date,'%m-%d'),' • ',ROUND(distance,2), ' miles on ', name,' ',  calorie, ' cal') as description, date as lastUpdate,CONCAT('') as meta,ROUND(distance * 10,0) as points from lifefitness_activity,lifefitness_equipment where lifefitness_activity.equipmentid = lifefitness_equipment.id and MONTH(date) = MONTH(NOW())  and YEAR(date) = YEAR(NOW()) and user_id = " +
            userid +
            " order by lastUpdate desc "
        );

        connection.query(
            "select type,description,lastUpdate,meta,points from ( select 'checkin' as type,  CONCAT(DATE_FORMAT(checkin,'%m-%d'),' • Visit to ',company) as description,checkin as lastUpdate,CONCAT('') as meta, 10 as points from hdn_report_checkin where MONTH(checkin) >= MONTH(NOW()) and YEAR(checkin) = YEAR(NOW())  and user_id =  " +
            userid +
            " group by description,DAY(checkin) " +
            " UNION ALL select 'class_visit' as type, CONCAT(DATE_FORMAT(lastUpdate,'%m-%d'),' • ',classname,' in ' ,classroom,' @ ' ,classtime)  as description,lastUpdate,CONCAT('') as meta,5 as points from beacon_daily_room_counter where user_id = " +
            userid +
            " and MONTH(lastUpdate) >= MONTH(NOW()) and  YEAR(lastUpdate) = YEAR(NOW()) " +
            " UNION ALL select challenge as type,   CONCAT(DATE_FORMAT(date,'%m-%d'),' • Checkin challenge ', days, ' consecutive days') as description,date as lastUpdate,CONCAT('') as meta,20 as points from  hdn_challenges where user_id = " +
            userid +
            " and  challenge = 'hdn_checkin_year' and MONTH(date) >= MONTH(NOW()) and  YEAR(date) = YEAR(NOW())  " +
            " UNION ALL select challenge as type,   CONCAT(DATE_FORMAT(date,'%m-%d'),' • Step challenge ', days, ' consecutive days') as description,date as lastUpdate,CONCAT('') as meta,20 as points from  hdn_challenges where user_id = " +
            userid +
            " and  challenge = 'hdn_checkin_steps_year' and MONTH(date) >= MONTH(NOW()) and  YEAR(date) = YEAR(NOW())  " +
            " UNION ALL select 'class_achievement' as type,   CONCAT(days, ' consecutive class visits') as description,date as lastUpdate,CONCAT('') as meta,20 as points from  hdn_challenges where user_id = " +
            userid +
            " and  challenge = 'hdn_checkin_class_year' and MONTH(date) >= MONTH(NOW()) and  YEAR(date) = YEAR(NOW())  " +
            " UNION ALL select 'feeling' as type,  CONCAT(DATE_FORMAT(lastUpdate,'%m-%d'),' • Feelings completed') as description,lastUpdate,CONCAT('') as meta, 5 as points from beacon_daily_counter_user where  MONTH(lastUpdate) >= MONTH(NOW()) and YEAR(lastUpdate) = YEAR(NOW()) and feeling > 0  and user_id =  " +
            userid +
            " group by DAY(lastUpdate) " +
            " UNION ALL select 'my_schedule' as type, CONCAT(DATE_FORMAT(lastUpdate,'%m-%d'),' • ', class , ' class on ',dayname, ' at ', time,' with ',instructor) as description, hdn_myschedule.day as lastUpdate,CONCAT('') as meta, 5 as points from  hdn_myschedule, hdn_classes where  hdn_classes.id =  hdn_myschedule.class_id and hdn_myschedule.user_id = " +
            userid +
            " UNION ALL select 'peloton_fitness' as type, CONCAT(DATE_FORMAT(date,'%m-%d'),' • ',class, ' • ', calorie, ' cal') as description, date as lastUpdate,CONCAT(peloton_activity.equipmentId,',',class,',',calorie,',',distance,',',duration,',',watts) as meta,ROUND(calorie * .10,0) as points from peloton_activity,lifefitness_equipment where peloton_activity.equipmentid = lifefitness_equipment.id and MONTH(date) = MONTH(NOW())  and YEAR(date) = YEAR(NOW()) and user_id = " +
            userid +
            " UNION ALL select 'matrix_fitness' as type, CONCAT(DATE_FORMAT(date,'%m-%d'),' • ', if ((matrix_activity.equipmentId = 21 or  matrix_activity.equipmentId = 23) ,ROUND(distance ,0),ROUND(distance * 0.000621371,2)) , if ((matrix_activity.equipmentId = 21 or  matrix_activity.equipmentId = 23),' steps on ',' miles on '), name,' • ',  ROUND(calorie / 4184,2) , ' cal') as description, date as lastUpdate,CONCAT(matrix_activity.equipmentId,',',name,',',calorie,',',distance,',',speed) as meta,ROUND(distance * 0.000621371,2) * 10 as points from matrix_activity,lifefitness_equipment where matrix_activity.equipmentId = lifefitness_equipment.id and MONTH(date) = MONTH(NOW())  and YEAR(date) = YEAR(NOW()) and user_id =  " +
            userid +
            " UNION ALL select 'precor_fitness' as type, CONCAT(DATE_FORMAT(date,'%m-%d'),' • ', ROUND(distance,2), ' miles on ', name,' • ',  calorie, ' cal') as description, date as lastUpdate,CONCAT(precor_activity.equipmentId,',',name,',',calorie,',',distance,',',duration) as meta,ROUND(distance * 10,0) as points from precor_relationship,precor_activity,lifefitness_equipment where precor_relationship.exerciserAccountId  = precor_activity.user_id AND precor_activity.equipmentid = lifefitness_equipment.id and MONTH(date) = MONTH(NOW())  and YEAR(date) = YEAR(NOW()) and precor_relationship.user_id = " +
            userid +
            " UNION ALL select 'fod_fitness' as type, CONCAT(DATE_FORMAT(startdate,'%m-%d'),' • ',class) as description, startdate as lastUpdate,CONCAT(class) as meta,5 as points from hdn_fod_activity where  MONTH(startdate) = MONTH(NOW())  and YEAR(startdate) = YEAR(NOW()) and user_id =  " +
            userid +
            step_sql +
            " UNION ALL select 'life_fitness' as type, CONCAT(DATE_FORMAT(date,'%m-%d'),' • ',ROUND(distance,2), ' miles on ', name,' • ',  calorie, ' cal') as description, date as lastUpdate,CONCAT('') as meta,ROUND(distance * 10,0) as points from lifefitness_activity,lifefitness_equipment where lifefitness_activity.equipmentid = lifefitness_equipment.id and MONTH(date) = MONTH(NOW())  and YEAR(date) = YEAR(NOW()) and user_id = " +
            userid +
            " ) as a order by lastUpdate desc ",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_get_jwt(req, res) {
    var cert = fs.readFileSync("jwtRS256.key"); // get private key

    var userid = req.params.userid;
    var name = req.params.name;

    var token = jwt.sign({
            iss: "GymFarm",
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 60 * 160,
            aud: "preva.com",
            displayName: name,
            sub: userid,
        },
        cert, {
            algorithm: "RS256",
            keyid: "GymFarm"
        }
    );

    // slack.webhook({
    //          channel: "#precorconsole",
    //          username: "precorconsole",
    //          text: "Requested JWT2 service: " + token,
    //        }, function(err, response) {
    //          console.log(response);
    //        });

    //        console.log(token);

    res.json({
        "jwt": token
    });
}

function handle_hdn_get_jwt_cert(req, res) {
    var cert = fs.readFileSync("public.json");

    // slack.webhook({
    //          channel: "#precorconsole",
    //          username: "precorconsole",
    //           text: "Requested JWK service: " + JSON.parse(cert),
    //        }, function(err, response) {
    //          console.log(response);
    //        });

    res.setHeader("Content-type", "application/json");

    // res.setHeader('Content-disposition', 'attachment; filename=certificate.crt');

    res.send(JSON.parse(cert));
}

function handle_hdn_heart_rate(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;
        var day = req.params.day;

        console.log(
            "select `" +
            day +
            "` as heartrate from hdn_checkin_heart_year where applicationID <> '(null)' and user_id = " +
            userid +
            " and YEAR(lastUpdate) = YEAR(NOW())"
        );
        connection.query(
            "select `" +
            day +
            "` as heartrate from hdn_checkin_heart_year where applicationID <> '(null)' and user_id = " +
            userid +
            " and YEAR(lastUpdate) = YEAR(NOW())",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function pushMessage(user_id, message) {
    console.log("pushMessage");

    var options = {
        method: "POST",
        hostname: "healthdata.network",
        port: 443,
        path: "/api/notification/send",
        headers: {
            "content-type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW",
            Accept: "application/json",
            "Cache-Control": "no-cache",
            "Postman-Token": "0a116086-a25a-44d7-8aae-ad5172f0cb0b",
        },
    };

    var req = http.request(options, function(res) {
        var chunks = [];

        res.on("data", function(chunk) {
            console.log("pushMessage");

            chunks.push(chunk);
        });

        res.on("error", function(e) {
            console.error(e);
        });

        res.on("end", function() {
            var body = Buffer.concat(chunks);
            console.log(body.toString());
        });
    });

    req.write(
        '------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name="member_id"\r\n\r\n' +
        user_id +
        '\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name="title"\r\n\r\nA message from your gym\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name="message"\r\n\r\n' +
        message +
        "\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--"
    );

    req.end();
}

// { exerciserAccountId: 8459,
//   name: 'William',
//   account_identifier: 'GymFarm:::08:04:C0:23:22:AA:48:80' }

function handle_hdn_workout_precor(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        console.log(req.body);

        var data = req.body;

        var exerciserAccountId = data.exerciserAccountId;
        var feCategory = data.feCategory;
        var timestamp = data.timestamp;

        var memberid = data.GymFarm;

        var metrics = data.metrics;

        var member_id = 0;

        if (feCategory === "TRED") {
            feCategory = 1;
        } else if (feCategory === "EFX") {
            feCategory = 19;
        } else if (feCategory === "BIKE") {
            feCategory = 2;
        }

        if (metrics) {
            timestamp = timestamp.replace("Z", "");
            var duration = metrics.totals.duration.value;
            var distance = metrics.totals.distance.value;
            var energy = metrics.totals.energy.value;

            console.log(
                "insert into precor_activity (user_id,date,calorie,distance,duration,equipmentId) VALUES (" +
                exerciserAccountId +
                ",'" +
                timestamp +
                "'," +
                energy +
                "," +
                distance +
                "," +
                duration +
                ",'" +
                feCategory +
                "')"
            );

            // Insert workout data
            connection.query(
                "insert into precor_activity (user_id,date,calorie,distance,duration,equipmentId) VALUES (" +
                exerciserAccountId +
                ",'" +
                timestamp +
                "'," +
                energy +
                "," +
                distance +
                "," +
                duration +
                ",'" +
                feCategory +
                "')",
                function(err, rows) {
                    console.log(
                        "select * from precor_relationship where exerciserAccountId = " +
                        exerciserAccountId
                    );

                    connection.query(
                        "select * from precor_relationship where exerciserAccountId = " +
                        exerciserAccountId,
                        function(err, rows) {
                            if (rows.length > 0) {
                                var row = rows[0];

                                update_reward_points(exerciserAccountId, 10);
                                pushMessage(
                                    row.user_id,
                                    "Your Precor workout data is added to your timeline."
                                );
                            }
                        }
                    );
                }
            );
        } else {
            var name = data.name;
            var userid = data.account_identifier.replace("GymFarm:::", "");
            // Insert base record

            console.log(
                "SELECT id,lname FROM users WHERE fname = '" +
                name +
                "' and ( memnum = '" +
                userid +
                "' OR  face_uid = '" +
                userid +
                "' ) AND deleted_at IS NULL limit 1"
            );
            connection.query(
                "SELECT id,lname FROM users WHERE fname = '" +
                name +
                "' and ( memnum = '" +
                userid +
                "' OR  face_uid = '" +
                userid +
                "' ) AND deleted_at IS NULL limit 1",
                function(err, rows) {
                    if (rows.length > 0) {
                        var row = rows[0];

                        console.log(
                            "insert into precor_relationship (exerciserAccountId,user_id) VALUES (" +
                            exerciserAccountId +
                            "," +
                            row.id +
                            ")"
                        );

                        // Insert workout data
                        connection.query(
                            "insert into precor_relationship (exerciserAccountId,user_id) VALUES (" +
                            exerciserAccountId +
                            "," +
                            row.id +
                            ")",
                            function(err, rows) {}
                        );

                        update_reward_points(userid, 10);
                        pushMessage(
                            row.user_id,
                            "Welcome to Precor workout data will be added to your timeline."
                        );
                    }
                }
            );
        }

        res.send(req.body);

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_workout_boxing(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        console.log(req.body);

        var companyid = req.body.companyID;
        var data = req.body.valueData;
        var locationid = req.body.locationID;

        res.json({
            locationID: req.body.locationID,
            companyID: req.body.companyID,
            valueData: req.body.valueData,
        });

        //     var feCategory = 0;

        //     var machineType = req.body.machineType;

        //     if (machineType === 'treadmill') {
        //             feCategory = 1;
        //     }
        //     else if (machineType === 'elliptical') {
        //             feCategory  = 19;
        //     }
        //     else if (machineType === 'stepper') {
        //             feCategory = 21;
        //     }
        //     else if (machineType === 'ascent_trainer') {
        //             feCategory = 22;
        //     }
        //     else if (machineType === 'climbmill') {
        //             feCategory = 23;
        //     }
        //     else if (machineType === 'hybrid_bike') {
        //             feCategory = 20;
        //     }
        //     else if (machineType === 'upright_bike') {
        //             feCategory = 26;
        //     }
        //     else if (machineType === 'recumbent_bike') {
        //             feCategory = 3;
        //     }
        //      else if (machineType === 'rower') {
        //             feCategory = 25;
        //     }
        //     else if (machineType === 'bike') {
        //             feCategory = 24;
        //     }

        //  // console.log("SELECT id,lname FROM users WHERE fname = '"  + name + "' and ( memnum = '" + userid + "' OR  face_uid = '" + userid + "' ) AND deleted_at IS NULL limit 1" );

        //     connection.query("SELECT id,lname FROM users WHERE  ( memnum = '" + userid + "' OR  face_uid = '" + userid + "' ) AND deleted_at IS NULL limit 1" , function(err, rows) {

        //     if (rows.length > 0) {
        //           var row = rows[0];

        //           userid = row.id;

        //                 console.log("replace matrix_activity set equipmentId = " + feCategory + ", workoutID = '" + req.body.workoutID + "' , user_id = " + userid + ", date = '" + req.body.startTime + "' , calorie = " + req.body.energy  + ",distance = " + req.body.distance + " , heart = " + req.body.heartrate + " , speed = " + req.body.speed );

        //                 connection.query("replace matrix_activity set equipmentId = " + feCategory + ", workoutID = '" + req.body.workoutID + "' , user_id = " + userid + ", date = '" + req.body.startTime + "' , calorie = " + req.body.energy  + ",distance = " + req.body.distance + " , heart = " + req.body.heartrate + " , speed = " + req.body.speed  , function(err, rows) {

        //                  res.header('Access-Control-Allow-Origin', '*');
        //                     res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        //                     res.header('Access-Control-Allow-Headers', 'Content-Type');
        //                     res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

        //                     pushMessage(userid,"Your Matrix workout data is added to your timeline.");

        //                         if (rows.affectedRows > 0) {
        //                                 res.json({
        //                                     "workoutID" : req.body.workoutID
        //                             });
        //                         } else
        //                                  res.json('{}');
        //                         });

        //             }
        //         });

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_workout_matrix(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        console.log(req.body);
        var userid = req.body.memberID;

        var feCategory = 0;

        var machineType = req.body.machineType;

        if (machineType === "treadmill") {
            feCategory = 1;
        } else if (machineType === "elliptical") {
            feCategory = 19;
        } else if (machineType === "stepper") {
            feCategory = 21;
        } else if (machineType === "ascent_trainer") {
            feCategory = 22;
        } else if (machineType === "climbmill") {
            feCategory = 23;
        } else if (machineType === "hybrid_bike") {
            feCategory = 20;
        } else if (machineType === "upright_bike") {
            feCategory = 26;
        } else if (machineType === "recumbent_bike") {
            feCategory = 3;
        } else if (machineType === "rower") {
            feCategory = 25;
        } else if (machineType === "bike") {
            feCategory = 24;
        }

        // console.log("SELECT id,lname FROM users WHERE fname = '"  + name + "' and ( memnum = '" + userid + "' OR  face_uid = '" + userid + "' ) AND deleted_at IS NULL limit 1" );

        connection.query(
            "SELECT id,lname FROM users WHERE  ( memnum = '" +
            userid +
            "' OR  face_uid = '" +
            userid +
            "' ) AND deleted_at IS NULL limit 1",
            function(err, rows) {
                if (rows.length > 0) {
                    var row = rows[0];

                    userid = row.id;

                    console.log(
                        "replace matrix_activity set equipmentId = " +
                        feCategory +
                        ", workoutID = '" +
                        req.body.workoutID +
                        "' , user_id = " +
                        userid +
                        ", date = '" +
                        req.body.startTime +
                        "' , calorie = " +
                        req.body.energy +
                        ",distance = " +
                        req.body.distance +
                        " , heart = " +
                        req.body.heartrate +
                        " , speed = " +
                        req.body.speed
                    );

                    connection.query(
                        "replace matrix_activity set equipmentId = " +
                        feCategory +
                        ", workoutID = '" +
                        req.body.workoutID +
                        "' , user_id = " +
                        userid +
                        ", date = '" +
                        req.body.startTime +
                        "' , calorie = " +
                        req.body.energy +
                        ",distance = " +
                        req.body.distance +
                        " , heart = " +
                        req.body.heartrate +
                        " , speed = " +
                        req.body.speed,
                        function(err, rows) {
                            res.header("Access-Control-Allow-Origin", "*");
                            res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                            res.header("Access-Control-Allow-Headers", "Content-Type");
                            res.header(
                                "Access-Control-Allow-Headers",
                                "Content-Type, Authorization, Content-Length, X-Requested-With"
                            );

                            pushMessage(
                                userid,
                                "Your Matrix workout data is added to your timeline."
                            );

                            update_reward_points(userid, 10);

                            if (rows.affectedRows > 0) {
                                res.json({
                                    workoutID: req.body.workoutID,
                                });
                            } else res.json("{}");
                        }
                    );
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_bodifitapi_time(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        console.log(req);

        res.json({
            status: 1,
            errorCode: 0,
            bodys: {
                units: 1,
                timeMillis: new Date().getTime().toString(16)
            },
        });

        // res.json({
        //     "bodys": {
        //         "units": 1,
        //         "timeMillis": (new Date().getTime()).toString(16);
        //     },
        //     "status": 1
        // });

        // res.json({
        //         "status": 1,
        //         "weightTime": (new Date().getTime())
        //     });

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_bodifitapi(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        console.log(req);

        res.json({
            weightTime: "599652aa",
            status: 1
        });

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_workout_detail_matrix(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var workoutid = req.params.workoutid;

        console.log(
            "select workoutID,date,calorie,distance,duration,unit,timeStamp,heart,speed,machineType from matrix_activity,lifefitness_equipment where  lifefitness_equipment.id =  matrix_activity.equipmentId and workoutID = '" +
            workoutid +
            "'  limit 1"
        );
        connection.query(
            "select workoutID,date,calorie,distance,duration,unit,timeStamp,heart,speed,machineType from matrix_activity,lifefitness_equipment where  lifefitness_equipment.id =  matrix_activity.equipmentId and workoutID = '" +
            workoutid +
            "'  limit 1",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                if (rows.length > 0) {
                    var row = rows[0];
                    res.json(row);
                } else res.json("{}");
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_autheticate_matrix(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.memnum;

        console.log(
            "select fname,lname,CONCAT(fname, ' ', lname) as name,email,DATE_FORMAT(birthday,'%Y-%m-%d') as birthday, NULL as height, NULL as weight ,IF(sex = 2, 'F', 'M') as gender,'imperial' as unit, memnum as userid FROM users WHERE memnum = '" +
            userid +
            "' OR face_uid = '" +
            userid +
            "' AND deleted_at IS NULL  limit 1"
        );
        connection.query(
            "select fname,lname,CONCAT(fname, ' ', lname) as name,email,DATE_FORMAT(birthday,'%Y-%m-%d') as birthday, NULL as height, NULL as weight ,IF(sex = 2, 'F', 'M') as gender,'imperial' as unit, memnum as userid FROM users WHERE memnum = '" +
            userid +
            "' OR face_uid = '" +
            userid +
            "' AND deleted_at IS NULL  limit 1",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                if (rows.length > 0) {
                    var row = rows[0];
                    res.json(row);
                } else res.json("{}");
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_autheticate_tokenize_user(req, res) {
    const secret = "gymfarm";

    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.memnum;
        var company_id = req.params.company_id;

        console.log(
            "SELECT id,fname FROM users WHERE memnum = '" +
            userid +
            "' AND deleted_at IS NULL"
        );
        connection.query(
            "SELECT id,fname FROM users WHERE memnum = '" +
            userid +
            "' AND deleted_at IS NULL",
            function(err, rows) {
                if (rows.length > 0) {
                    var row = rows[0];

                    const token = crypto
                        .createHmac("sha256", secret)
                        .update(row.id + "" + userid + "" + row.fname)
                        .digest("hex");

                    console.log(token);

                    res.json({
                        token: token,
                    });
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_autheticate_precor(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.memnum;
        var company_id = req.params.company_id;
        var rfid_id = req.params.rfid;

        console.log(userid);
        console.log(company_id);
        console.log(rfid_id);

        if (rfid_id) {
            console.log(rfid_id);

            // Update
            console.log(
                "update users set face_uid = '" +
                rfid_id +
                "' where memnum = '" +
                userid +
                "'"
            );
            connection.query(
                "update users set face_uid = '" +
                rfid_id +
                "' where memnum = '" +
                userid +
                "'",
                function(err, rows) {
                    console.log(
                        "SELECT id,fname FROM users WHERE face_uid = '" +
                        rfid_id +
                        "' AND deleted_at IS NULL"
                    );
                    connection.query(
                        "SELECT id,fname FROM users WHERE face_uid = '" +
                        rfid_id +
                        "' AND deleted_at IS NULL",
                        function(err, rows) {
                            res.header("Access-Control-Allow-Origin", "*");
                            res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                            res.header("Access-Control-Allow-Headers", "Content-Type");
                            res.header(
                                "Access-Control-Allow-Headers",
                                "Content-Type, Authorization, Content-Length, X-Requested-With"
                            );

                            if (rows.length > 0) {
                                //  now get the certificate
                                var cert = fs.readFileSync("jwtRS256.key"); // get private key

                                var row = rows[0];

                                var name = row.fname;

                                var token = jwt.sign({
                                        iss: "GymFarm",
                                        iat: Math.floor(Date.now() / 1000),
                                        exp: Math.floor(Date.now() / 1000) + 60 * 160,
                                        aud: "preva.com",
                                        displayName: name,
                                        sub: userid,
                                    },
                                    cert, {
                                        algorithm: "RS256",
                                        keyid: "GymFarm"
                                    }
                                );

                                console.log(token);

                                res.json({
                                    success: true,
                                    message: token,
                                });
                            } else {
                                res.json({
                                    success: false,
                                    message: token,
                                });
                            }
                        }
                    );
                }
            );
        } else {
            console.log(
                "SELECT id,fname FROM users WHERE memnum = '" +
                userid +
                "'  OR face_uid = '" +
                userid +
                "' AND deleted_at IS NULL"
            );
            connection.query(
                "SELECT id,fname FROM users WHERE memnum = '" +
                userid +
                "'  OR face_uid = '" +
                userid +
                "' AND deleted_at IS NULL",
                function(err, rows) {
                    res.header("Access-Control-Allow-Origin", "*");
                    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                    res.header("Access-Control-Allow-Headers", "Content-Type");
                    res.header(
                        "Access-Control-Allow-Headers",
                        "Content-Type, Authorization, Content-Length, X-Requested-With"
                    );

                    if (rows.length > 0) {
                        //  now get the certificate
                        var cert = fs.readFileSync("jwtRS256.key"); // get private key

                        var row = rows[0];

                        var name = row.fname;

                        var token = jwt.sign({
                                iss: "GymFarm",
                                iat: Math.floor(Date.now() / 1000),
                                exp: Math.floor(Date.now() / 1000) + 60 * 160,
                                aud: "preva.com",
                                displayName: name,
                                sub: userid,
                            },
                            cert, {
                                algorithm: "RS256",
                                keyid: "GymFarm"
                            }
                        );

                        console.log(token);

                        res.json({
                            success: true,
                            message: token,
                        });
                    } else {
                        res.json({
                            success: false,
                            message: token,
                        });
                    }
                }
            );
        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_get_reward_points(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        console.log("select  reward_points from users  where id = " + userid);
        connection.query(
            "select  reward_points from users  where id = " + userid,
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function update_reward_points(userid, points, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        console.log(
            "update users set reward_points = (reward_points + " +
            points +
            ") where id = " +
            userid
        );
        connection.query(
            "update users set reward_points = (reward_points + " +
            points +
            ") where id = " +
            userid,
            function(err, rows) {
                if (points > 0) {
                    pushMessage(userid, "You have been awarded " + points + " points");
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_reward_points(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;
        var points = req.params.points;

        pushMessage(
            userid,
            "Your video is completed and you were awarded " + points + " points"
        );

        console.log(
            "update users set reward_points = (reward_points + " +
            points +
            ") where id = " +
            userid
        );
        connection.query(
            "update users set reward_points = (reward_points + " +
            points +
            ") where id = " +
            userid,
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_set_complete_video(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;
        var videoid = req.params.videoid;
        var date = req.params.date;
        var points = req.params.points;

        pushMessage(
            userid,
            "Your video is completed and you were awarded " + points + " points"
        );

        console.log(
            "replace hdn_fod_complete set user_id = " +
            userid +
            " , video_id = " +
            videoid +
            ", lastUpdate = NOW(),points = " +
            points
        );
        connection.query(
            "replace hdn_fod_complete set user_id = " +
            userid +
            " , video_id = " +
            videoid +
            ", lastUpdate = NOW(),points = " +
            points,
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

// OAUTH2 CODE

function processRequest(sql, callback) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        console.log(sql);
        connection.query(sql, function(err, rows, fields) {
            if (err != null) {
                console.log(err);
                return null;
            } else {
                result = rows;
            }

            callback(result);
        });

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_oauth_token(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        console.log(req);

        // Verify missing parameters
        if (
            req.body.grant_type === undefined ||
            req.body.client_id === undefined ||
            req.body.client_secret === undefined ||
            req.body.code === undefined
        ) {
            return res.status(400).send(
                JSON.stringify({
                    error: "invalid_request",
                    error_description: "Required parameters are missing in the request.",
                })
            );
        }

        // Validate the credentials
        var grant_type = req.body.grant_type;
        var client_id = req.body.client_id;
        var client_secret = req.body.client_secret;
        var code = req.body.code;
        var redirect_uri = req.body.redirect_uri;

        // Validate the reciefed client_id paramaters before showing auth screen
        processRequest(
            "select * from ch_oauth_client where client_id = '" +
            client_id +
            "' and secret = '" +
            client_secret +
            "' limit 1",
            function(oauth_client_rows) {
                if (oauth_client_rows == null || oauth_client_rows.length == 0) {
                    return res.status(400).send(
                        JSON.stringify({
                            error: "access_denied",
                            error_description: "Invalid client id and secret",
                        })
                    );
                }

                if (grant_type == "authorization_code") {
                    processRequest(
                        "select * from ch_oauth_authorization where authorization_code = '" +
                        code +
                        "' limit 1",
                        function(oauth_client_rows) {
                            if (oauth_client_rows == null || oauth_client_rows.length == 0) {
                                return res.status(400).send(
                                    JSON.stringify({
                                        error: "access_denied",
                                        error_description: "Invalid authorization code",
                                    })
                                );
                            }

                            var token = crypto.randomBytes(64).toString("hex");
                            var refresh_token = crypto.randomBytes(64).toString("hex");

                            // update the autorization code
                            processRequest(
                                "update ch_oauth_authorization set authorization_code = '" +
                                token +
                                "' where id = " +
                                oauth_client_rows[0].id,
                                function(rows) {
                                    return res.status(200).send(
                                        JSON.stringify({
                                            access_token: token,
                                            token_type: "bearer",
                                            refresh_token: refresh_token,
                                            expires_in: 4294967296,
                                        })
                                    );
                                }
                            );
                        }
                    );
                } else {
                    return res.status(400).send(
                        JSON.stringify({
                            error: "access_denied",
                            error_description: "Invalid grant type",
                        })
                    );
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function computeSHA256(key, values) {
    let signature = key;

    console.log(values);

    for (let key in values) {
        let value = values[key];
        if (!value) {
            value = key;
        }
        console.log(value);
        signature = crypto.createHmac('sha256', signature).update(value).digest('hex');
    }

    return signature;
}


function handle_hdn_oauth_optum_register(req, res) {
    console.log("handle_hdn_oauth_optum_register");

    // Verify missing parameters
    if (
        req.body.client_id === undefined ||
        req.body.firstname === undefined ||
        req.body.lastname === undefined ||
        req.body.email === undefined ||
        req.body.password === undefined ||
        req.body.account_id === undefined
    ) {

        endpoint = serverBase + "auth/register?response_type=code&client_id=" + client_id + "&error=invalid_request&error_description=Required parameters are missing in the request.";
        res.writeHead(301, {
            Location: endpoint,
        });
        res.end();
    }

    // // Validate the credentials
    var client_id = req.body.client_id;
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var email = req.body.email;
    var password = req.body.password;
    var account_id = req.body.account_id;
    var promocode = "0";
    var code = req.body.account_id;

    var params = "&firstname=" + req.body.firstname + "&lastname=" + lastname + "&email=" + req.body.email + "&account_id=" + req.body.account_id;


    if (client_id == 'humana-echelon-go365') {
        console.log(client_id);

        var alias = firstname.toLowerCase() + "." + lastname.toLowerCase();
        var token = md5(email);
        var source = 3;
        var program_id = 23;

        var a = "insert into public.user (fname,lname,email,password,alias,token,source,eligibility_status,program_id) values ('" + firstname.replace(/["']/g, "") + "','" + lastname.replace(/["']/g, "") + "','" + email + "','" + password + "','" + alias + "','" + token + "'," + source + ",'Eligible'," + program_id + ") ON CONFLICT (email,role_id) DO UPDATE SET program_id=EXCLUDED.program_id RETURNING id;";

        console.log(a);

        ppool.query(a, function(err, client_rows) {

            if (err) {
                endpoint = serverBase + "/auth/register?response_type=code&client_id=" + client_id + "&error=invalid_request&error_description=Email has already been taken." + params;
                res.writeHead(301, {
                    Location: endpoint,
                });
                res.end();
            }


            if (client_rows.rows.length > 0) {
                var user_id = client_rows.rows[0].id;
               
                var a = "insert into member_program (status,user_id,program_id,membership) values (1," + user_id + "," + program_id + ",'" + code + "') ON CONFLICT DO NOTHING;";

                console.log(a);

                ppool.query(a, function(err, client_rows) {
                    if (err) console.log(err);
                });

                var b = "insert into member_activity_program (status,user_id,program_id,membership) values (1," + user_id + ",7,'" + code + "') ON CONFLICT DO NOTHING;";
                 console.log(b);
                ppool.query(b, function(err, client_rows) {
                    if (err) console.log(err);
                });

            }

            var endpoint = 'https://echelonpartner.com/affiliate/concierge';
            console.log(endpoint);
            res.writeHead(301, {
                Location: endpoint,
            });
            res.end();
        });

    } 

    else if (client_id == 'humana-technogym-go365') {
        console.log(client_id);

        var alias = firstname.toLowerCase() + "." + lastname.toLowerCase();
        var token = md5(email);
        var source = 15;
        var program_id = 23;

        var a = "insert into public.user (fname,lname,email,password,alias,token,source,eligibility_status,program_id) values ('" + firstname.replace(/["']/g, "") + "','" + lastname.replace(/["']/g, "") + "','" + email + "','" + password + "','" + alias + "','" + token + "'," + source + ",'Eligible'," + program_id + ") ON CONFLICT (email,role_id) DO UPDATE SET program_id=EXCLUDED.program_id RETURNING id;";

        console.log(a);

        ppool.query(a, function(err, client_rows) {

            if (err) {
                endpoint = serverBase + "/auth/register?response_type=code&client_id=" + client_id + "&error=invalid_request&error_description=Email has already been taken." + params;
                res.writeHead(301, {
                    Location: endpoint,
                });
                res.end();
            }


            if (client_rows.rows.length > 0) {
                var user_id = client_rows.rows[0].id;
               
                var a = "insert into member_program (status,user_id,program_id,membership) values (1," + user_id + "," + program_id + ",'" + code + "') ON CONFLICT DO NOTHING;";

                console.log(a);

                ppool.query(a, function(err, client_rows) {
                    if (err) console.log(err);
                });


                 var b = "insert into member_activity_program (status,user_id,program_id,membership) values (1," + user_id + ",24,'" + code + "') ON CONFLICT DO NOTHING;";
                 console.log(b);
                ppool.query(b, function(err, client_rows) {
                    if (err) console.log(err);
                });
            }

            var endpoint = 'https://veritap.conciergehealth.co/concierge/connect/account/mywellness?connectTo=' + user_id;
            console.log(endpoint);
            res.writeHead(301, {
                Location: endpoint,
            });
            res.end();
        });

    } else {

        // Prod
        var options = {
            'method': 'GET',
            'url': 'https://ogee.werally.com/rest/pass-edge/v1/members/code/' + code,
            'headers': {
                'X-OnePass-API-Key': 'HhTWL4vaCb1sftDvQkPJqAtc51pkH2rP',
                'X-OnePass-ClientKey': 'Partner-concierge_health',
                'Content-Type': 'application/json'
            }
        };

        //Dev
        // var options = {
        //     'method': 'GET',
        //     'url': 'https://ogee.int.werally.in/rest/pass-edge/v1/members/code/' + code,
        //     'headers': {
        //         'X-OnePass-API-Key': 'qAf36sfXEv7YzXmaWGmEe6s54wtmfe0k',
        //         'X-OnePass-ClientKey': 'Partner-concierge_health',
        //         'Content-Type': 'application/json'
        //     }
        // };

        request(options, function(error, response) {


            // console.log(response);

            if (error) {
                console.log(error);
                endpoint = serverBase + "/auth/register?response_type=code&client_id=" + client_id + "&error=invalid_request&error_description=Error processing." + params;
                res.writeHead(301, {
                    Location: endpoint,
                });
                res.end();
            }

            var data = JSON.parse(response.body);

            var insuranceData = data;
            console.log(data)



            var a = "insert into log (data) values ('" + response.body + "')";
            console.log(a);
            ppool.query(a, function(err, client_rows) {});


            if (data.memberStatus == "active") {

                console.log("select * from oauth_client where client_id = '" + client_id + "'");

                ppool.query("select * from oauth_client where client_id = '" + client_id + "'",

                    function(err, apirows) {

                        if (apirows.length == 0) {
                            if (error) {
                                endpoint = serverBase + "/auth/register?response_type=code&client_id=" + client_id + "&error=invalid_request&error_description=Invalid client ID." + params;
                                res.writeHead(301, {
                                    Location: endpoint,
                                });
                                res.end();
                            }

                        } else {
                            var endpoint = '';
                            console.log(client_id);

                            var alias = firstname.toLowerCase() + "." + lastname.toLowerCase();
                            var token = md5(email);
                            var source = 0;

                            if (client_id == 'optum-lessmills-onepassmedi' || client_id == 'optum-lessmills-onepasscorp' || client_id == 'optum-lessmills-renewactive') {
                                source = 7;
                            } else if (client_id == 'optum-openfit-renewactive' || client_id == 'optum-openfit-onepasscorp' || client_id == 'optum-openfit-onepassmedi') {
                                source = 8;
                            } else if (client_id == 'optum-dailyburn-renewactive' || client_id == 'optum-dailyburn-onepasscorp' || 'optum-dailyburn-onepassmedi') {
                                source = 22;
                            }


                            var program_id = 34;

                            if (code.substring(0, 1) == "B")
                                program_id = 35;

                            var a = "insert into public.user (fname,lname,email,password,alias,token,source,eligibility_status,program_id) values ('" + firstname.replace(/["']/g, "") + "','" + lastname.replace(/["']/g, "") + "','" + email + "','" + password + "','" + alias + "','" + token + "'," + source + ",'Eligible'," + program_id + ") ON CONFLICT (email,role_id) DO UPDATE SET program_id=EXCLUDED.program_id RETURNING id;";

                            console.log(a);

                            ppool.query(a, function(err, client_rows) {

                                if (err) {
                                    endpoint = serverBase + "/auth/register?response_type=code&client_id=" + client_id + "&error=invalid_request&error_description=Email has already been taken." + params;
                                    res.writeHead(301, {
                                        Location: endpoint,
                                    });
                                    res.end();
                                }


                                if (client_rows.rows.length > 0) {
                                    var user_id = client_rows.rows[0].id;
                                    var program_id = 34;

                                    if (code.substring(0, 1) == "B")
                                        program_id = 35;

                                    var a = "insert into member_program (status,user_id,program_id,membership) values (1," + user_id + "," + program_id + ",'" + code + "') ON CONFLICT DO NOTHING;";

                                    console.log(a);

                                    ppool.query(a, function(err, client_rows) {
                                        if (err) console.log(err);
                                    });


                                    var activity_source = 0;

                                    if (client_id == 'optum-lessmills-onepassmedi' || client_id == 'optum-lessmills-onepasscorp' || client_id == 'optum-lessmills-renewactive') {
                                       activity_source = 7;
                                    } else if (client_id == 'optum-openfit-renewactive' || client_id == 'optum-openfit-onepasscorp' || client_id == 'optum-openfit-onepassmedi') {
                                        activity_source = 8;
                                    } else if (client_id == 'optum-dailyburn-renewactive' || client_id == 'optum-dailyburn-onepasscorp' || 'optum-dailyburn-onepassmedi') {
                                        activity_source = 22;
                                    }

                                     var b = "insert into member_activity_program (status,user_id,program_id,membership) values (1," + user_id + "," +  activity_source +",'" + code + "') ON CONFLICT DO NOTHING;";
                                     console.log(b);
                                    ppool.query(b, function(err, client_rows) {
                                        if (err) console.log(err);
                                    });

                                }

                            });



                            if (client_id == 'optum-lessmills-onepassmedi' || client_id == 'optum-lessmills-onepasscorp' || client_id == 'optum-lessmills-renewactive') {

                                let date = new Date();
                                var guid = uuid.v1();
                                // let email = email;
                                var productid = "";
                                var externalid = "";
                                var accessId = "optum";
                                var expirydays = "30";
                                var secretKey = "644fec0c-024c-47e8-83ca-c0c54c84a1a2";
                                var timestamp = date.getTime().toString();


                                const values = {
                                    host: 'web.lesmillsondemand.com', // required
                                    path: '/reseller-signup', // required
                                    email: email,
                                    accessid: accessId, // required
                                    productid: productid, // optional  
                                    externalid: externalid, // optional
                                    timestamp: timestamp, // required (should be unix timestamp)
                                    expirydays: expirydays, // required
                                    guid: guid // required
                                }


                                genSignature = computeSHA256(secretKey, values);
                                var endpoint = 'https://web.lesmillsondemand.com/reseller-signup?email=' + email + '&productid=' + productid + '&externalid=' + externalid + '&accessid=' + accessId + '&timestamp=' + timestamp + '&expirydays=' + expirydays + '&guid=' + guid + '&signature=' + genSignature;
                                res.writeHead(301, {
                                    Location: endpoint,
                                });
                                res.end();

                            } else if (client_id == 'optum-openfit-renewactive' || client_id == 'optum-openfit-onepasscorp' || client_id == 'optum-openfit-onepassmedi') {

                                var key = "";

                                if (client_id == 'optum-openfit-renewactive')
                                    key = "1gjhq4whtf9ybb60d4go";
                                else if (client_id == 'optum-openfit-onepasscorp')
                                    key = "1cqj7jsghirr7n9anqoq";
                                else if (client_id == 'optum-openfit-onepassmedi')
                                    key = "gtr0zkhbc8tuxw60e747";

                                var options = {
                                    'method': 'GET',
                                    'url': 'https://api.openfit.com/rest/partner/create_code?api_key=' + key,
                                    'headers': {
                                        'User-Agent': 'Mozilla/5.0',
                                    },

                                };


                                request(options, function(error, response) {
                                    console.log("BBBBBB");
                                    if (error) {
                                        endpoint = serverBase + "/auth/register?response_type=code&client_id=" + client_id + "&error=invalid_request&error_description=Error processing." + params;
                                        res.writeHead(301, {
                                            Location: endpoint,
                                        });
                                        res.end();
                                    }

                                    var data = JSON.parse(response.body);

                                    if (data.promocode) {
                                        // Add the user to the database
                                        promocode = data.promocode;

                                        var a = "update public.user set promocode = '" + data.promocode + "' where email = '" + email + "'";
                                        console.log(a);
                                        ppool.query(a, function(err, client_rows) {});


                                        endpoint = '';

                                        if (client_id == 'optum-openfit-onepassmedi')
                                            endpoint = 'https://www.openfit.com/plans/optum?product=onepass&sector=government&partner_code=xxxxxx';
                                        else if (client_id == 'optum-openfit-onepasscorp')
                                            endpoint = 'https://www.openfit.com/plans/optum?product=onepass&sector=commercial&partner_code=xxxxxx';
                                        else if (client_id == 'optum-openfit-renewactive')
                                            endpoint = 'https://www.openfit.com/plans/optum?product=renewactive&sector=government&partner_code=xxxxxx';

                                        // Replace endpoint xxxxxx wit 
                                        endpoint = endpoint.replace("xxxxxx", data.promocode);
                                        console.log(endpoint);
                                        // Valid Openfit code
                                        res.writeHead(301, {
                                            Location: endpoint,
                                        });
                                        res.end();

                                    } else {
                                        endpoint = serverBase + "/auth/register?response_type=code&client_id=" + client_id + "&error=invalid_request&error_description=Invalid openfit ID." + params;
                                        res.writeHead(301, {
                                            Location: endpoint,
                                        });
                                        res.end();

                                    }
                                });

                            } else if (client_id == 'optum-dailyburn-renewactive' || client_id == 'optum-dailyburn-onepasscorp' || 'optum-dailyburn-onepassmedi') {

                                // Dev
                                // var keyFile = "./optum2-uat-sa-key.json";
                                // Prod
                                var keyFile = "./optum2-prod-sa-key.json";
                                var aud = "https://partner.b2b.dailyburnapis.com/";

                                const keys = require(keyFile);
                                const iat = Math.floor(new Date().getTime() / 1000);
                                var token = jwt.sign({
                                    "iss": keys.client_email,
                                    "aud": aud,
                                    "iat": iat,
                                    "exp": iat + 3600,
                                    "sub": keys.client_email,
                                }, keys.private_key, {
                                    algorithm: 'RS256',
                                    keyid: keys.private_key_id
                                });

                                //DEV - https://partner-uat.b2b.dailyburnapis.com/
                                var options = {
                                    'method': 'POST',
                                    'url': 'https://partner.b2b.dailyburnapis.com/v1/organizations/' + client_id + '/users:addOrganizationUser',
                                    'headers': {
                                        'Content-Type': 'application/json',
                                        'Authorization': 'Bearer ' + token
                                    },
                                    body: JSON.stringify({
                                        "user": {
                                            "email": email,
                                            "password": password,
                                            "given_name": firstname,
                                            "family_name": lastname
                                        }
                                    })

                                };
                                request(options, function(error, response) {
                                    if (error) {

                                        endpoint = serverBase + "/auth/register?response_type=code&client_id=" + client_id + "&error=invalid_request&error_description=Invalid Daily Burn ID." + params;
                                        res.writeHead(301, {
                                            Location: endpoint,
                                        });
                                        res.end();

                                        // return  res.json({
                                        //         code: 400,
                                        //         status: "Invalid Daily Burn ID.",
                                        //     });
                                    }

                                    // console.log(response.body);
                                    var data = JSON.parse(response.body);
                                    // console.log(data);

                                    if (data.redirectUri) {
                                        console.log(data.redirectUri);
                                        endpoint = data.redirectUri;
                                        res.writeHead(301, {
                                            Location: endpoint,
                                        });
                                        res.end();
                                    } else {
                                        console.log(response.body);

                                        endpoint = serverBase + "/auth/register?response_type=code&client_id=" + client_id + "&error=invalid_request&error_description=" + data.message + params;
                                        res.writeHead(301, {
                                            Location: endpoint,
                                        });
                                        res.end();


                                        // return  res.json({
                                        //        code: 400,
                                        //        status: data.message,
                                        //    });
                                    }


                                });
                            } else {
                                return res.json({
                                    code: 400,
                                    status: "System Error.",
                                });
                            }
                        }
                    }
                );

            } else {
                console.log('NOT ACTIVE !!!!!');
                var error = '';
                if (data.serviceSector == 'Medicare/Medicaid') {
                    error = renewError;
                } else {
                    error = onePassError;
                }
                endpoint = serverBase + "/auth/register?response_type=code&client_id=" + client_id + "&error=invalid_request&error_description=" + error + params;

                console.log(endpoint);
                res.writeHead(301, {
                    Location: endpoint,
                });
                res.end();
            }


        });
    }

}

function handle_hdn_oauth_register(req, res) {
    console.log("handle_hdn_oauth_register");
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        // Verify missing parameters
        if (
            req.body.response_type === undefined ||
            req.body.client_id === undefined ||
            req.body.redirect_uri === undefined ||
            req.body.firstname === undefined ||
            req.body.lastname === undefined ||
            req.body.email === undefined ||
            req.body.field === undefined ||
            req.body.company_id === undefined
        ) {
            return res.status(400).send(
                JSON.stringify({
                    error: "invalid_request",
                    error_description: "Required parameters are missing in the request.",
                })
            );
        }

        // Validate the credentials
        var response_type = req.body.response_type;
        var client_id = req.body.client_id;
        var redirect_uri = req.body.redirect_uri;

        var firstname = req.body.firstname;
        var lastname = req.body.lastname;
        var email = req.body.email;

        var account_id = req.body.account_id;
        var field = req.body.field;
        var company_id = req.body.company_id;

        if (req.body.account_id === undefined) {
            account_id = "0";
        }

        // Validate the reciefed client_id paramaters before showing auth screen
        processRequest(
            "select * from ch_oauth_client where client_id = '" +
            client_id +
            "' limit 1",
            function(oauth_client_rows) {
                if (oauth_client_rows == null || oauth_client_rows.length == 0) {
                    return res.status(400).send(
                        JSON.stringify({
                            error: "access_denied",
                            error_description: "Invalid client ID.",
                        })
                    );
                }

                processRequest(
                    "select * from ch_users where email = AES_DECRYPT('" +
                    email +
                    "', SHA2('" +
                    eic +
                    "',512)) limit 1",
                    function(client_rows) {
                        var token = crypto.randomBytes(64).toString("hex");

                        if (client_rows == null || client_rows.length == 0) {
                            processRequest(
                                "insert into ch_users (company_id,role,memnum,scancode,source_id,fname,lname,email," +
                                field +
                                ",password,salt) VALUES (" +
                                company_id +
                                ",3,'00000','00000',1113,AES_ENCRYPT('" +
                                firstname +
                                "',SHA2('" +
                                eic +
                                "',512)),AES_ENCRYPT('" +
                                lastname +
                                "',SHA2('" +
                                eic +
                                "',512)),AES_ENCRYPT('" +
                                email +
                                "',SHA2('" +
                                eic +
                                "',512)),'" +
                                account_id +
                                "','','')",
                                function(rows) {
                                    console.log(rows);

                                    processRequest(
                                        "select * from ch_users where id = '" + rows.insertId + "'",
                                        function(users_rows) {
                                            //save the authorization token
                                            processRequest(
                                                "replace into ch_oauth_authorization (user_id,client_id,authorization_code) VALUES (" +
                                                users_rows[0].id +
                                                ",'" +
                                                client_id +
                                                "','" +
                                                token +
                                                "')",
                                                function(rows) {
                                                    res.writeHead(301, {
                                                        Location: redirect_uri + "/?code=" + token,
                                                    });
                                                    res.end();
                                                }
                                            );
                                        }
                                    );
                                }
                            );
                        } else {
                            processRequest(
                                "update ch_users set " +
                                field +
                                " = '" +
                                account_id +
                                "' where id = " +
                                client_rows[0].id,
                                function(rows) {
                                    console.log(rows);

                                    //save the authorization token
                                    processRequest(
                                        "replace into ch_oauth_authorization (user_id,client_id,authorization_code) VALUES (" +
                                        client_rows[0].id +
                                        ",'" +
                                        client_id +
                                        "','" +
                                        token +
                                        "')",
                                        function(rows) {
                                            res.writeHead(301, {
                                                Location: redirect_uri + "/?code=" + token,
                                            });
                                            res.end();
                                        }
                                    );
                                }
                            );
                        }
                    }
                );
            }
        );
        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_oauth_signin(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        // Verify missing parameters
        if (
            req.body.response_type === undefined ||
            req.body.client_id === undefined ||
            req.body.redirect_uri === undefined ||
            req.body.username === undefined ||
            req.body.password === undefined ||
            req.body.field === undefined
        ) {
            return res.status(400).send(
                JSON.stringify({
                    error: "invalid_request",
                    error_description: "Required parameters are missing in the request.",
                })
            );
        }

        // Validate the credentials
        var response_type = req.body.response_type;
        var client_id = req.body.client_id;
        var redirect_uri = req.body.redirect_uri;
        var username = req.body.username;
        var password = req.body.password;
        var field = req.body.field;

        // Validate the reciefed client_id paramaters before showing auth screen
        processRequest(
            "select * from ch_oauth_client where client_id = '" +
            client_id +
            "' limit 1",
            function(oauth_client_rows) {
                if (oauth_client_rows == null || oauth_client_rows.length == 0) {
                    return res.status(400).send(
                        JSON.stringify({
                            error: "access_denied",
                            error_description: "Invalid client ID.",
                        })
                    );
                }

                processRequest(
                    "select * from ch_users where memnum = '" + username + "'",
                    function(users_rows) {
                        if (users_rows == null || users_rows.length == 0) {
                            return res.status(400).send(
                                JSON.stringify({
                                    error: "access_denied",
                                    error_description: "Invalid client ID.",
                                })
                            );
                        }

                        processRequest(
                            "update ch_users set " +
                            field +
                            " = '" +
                            password +
                            "' where id = " +
                            users_rows[0].id,
                            function(rows) {
                                console.log(req.body);

                                var token = crypto.randomBytes(64).toString("hex");

                                //save the authorization token
                                processRequest(
                                    "replace into ch_oauth_authorization (user_id,client_id,authorization_code) VALUES (" +
                                    users_rows[0].id +
                                    ",'" +
                                    client_id +
                                    "','" +
                                    token +
                                    "')",
                                    function(rows) {
                                        res.writeHead(301, {
                                            Location: redirect_uri + "/?code=" + token,
                                        });
                                        res.end();
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_oauth_auth(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        // Verify missing parameters
        if (
            req.query.response_type === undefined ||
            req.query.client_id === undefined ||
            req.query.redirect_uri === undefined
        ) {
            return res.status(400).send(
                JSON.stringify({
                    error: "invalid_request",
                    error_description: "Required parameters are missing in the request",
                })
            );
        }

        // Collect the respones
        var response_type = req.query.response_type;
        var client_id = req.query.client_id;
        var redirect_uri = req.query.redirect_uri;
        console.log(req.query);

        if (response_type == "code") {
            // Validate the reciefed client_id paramaters before showing auth screen
            processRequest(
                "select * from oauth_client where client_id = '" +
                client_id +
                "' limit 1",
                function(rows) {
                    if (res == null) {
                        return res.status(400).send(
                            JSON.stringify({
                                error: "access_denied",
                                error_description: "Invalid client id",
                            })
                        );
                    }

                    if (rows.length == 0) {
                        return res.status(400).send(
                            JSON.stringify({
                                error: "access_denied",
                                error_description: "Invalid client id",
                            })
                        );
                    }

                    var client_name = rows[0].name;
                    var end_point = rows[0].endpoint;
                    var newend =
                        end_point +
                        "?response_type=code&client_id=" +
                        req.query.client_id +
                        "&redirect_uri=" +
                        req.query.redirect_uri +
                        "&client_name=" +
                        client_name;

                    console.log(rows[0]);
                    console.log(newend);

                    res.writeHead(301, {
                        Location: newend
                    });
                    res.end();

                    //Display a authorization screen!
                    // const html = pug.renderFile(path.join(__dirname, 'auth.pug'), {
                    //   response_type: 'code',
                    //   client_id: req.query.client_id,
                    //   redirect_uri: req.query.redirect_uri,
                    //   client_name: client_name
                    // });
                    // res.status(200).send(html);
                }
            );
        } else {
            return res.status(400).send(
                JSON.stringify({
                    error: "invalid_request",
                    error_description: "Invalid code type",
                })
            );
        }

        //

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_member_activity(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var date = req.query.date;

        var token = req.headers.authorization;

        console.log(req);
        console.log(token.replace("Bearer ", ""));

        processRequest(
            "select peloton_activity.* from users,oauth_authorization,peloton_activity  where authorization_code = '" +
            token.replace("Bearer ", "") +
            "' and oauth_authorization.user_id = users.id and peloton_activity.user_id = users.id and MONTH(peloton_activity.date) = MONTH('" +
            date +
            "')",
            function(rows) {
                res.json({
                    profile: rows,
                });
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

// select beacons_list.name,beacons_list.location,beacon_daily_counter.timeStamp,users.fname,users.lname

// from beacons_list,beacon_daily_counter,users

// where beacons_list.applicationID = '123-123-123-13123-12313-12312-119' and (beacon_daily_counter.uuid =  beacons_list.uuid and beacon_daily_counter.major =  beacons_list.major and beacon_daily_counter.minor =  beacons_list.minor) and users.id =  beacon_daily_counter.user_id

// and DAY(beacon_daily_counter.timeStamp) = DAY(CURDATE())
// order by beacon_daily_counter.timeStamp desc

// USER SPECIFIC ANALYTICS
// router.post('/user_counter', function(req, res) {
//     handle_update_user_counter(req, res);
// });

function handle_hdn_orgin_register(req, res) {
    if (err) {
        res.json({
            code: 100,
            status: err,
        });

        return;
    }

    res.json({
        code: 200,
    });
}

function handle_hdn_field_rupdate(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var field = req.body.field;
        var fieldvalue = req.body.fieldvalue;
        var userid = req.body.userid;

        console.log(
            "update users set `" +
            field +
            "` = " +
            fieldvalue +
            " where id = " +
            userid
        );
        connection.query(
            "update users set " +
            field +
            " = " +
            fieldvalue +
            " where id = " +
            userid,
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_apple_register2(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var deviceid = req.body.deviceid;
        var display = req.body.display;
        var clubid = req.body.clubid;
        var devicename = req.body.devicename;

        var dutonly = 0;

        if (display == 3) {
            display = 1;
            dutonly = 1;
            display = 1;
        }

        var mode = 0;

        connection.query(
            "select company_id from hdn_locations where id = " + clubid,
            function(err, rows) {
                if (rows.length > 0) {
                    var row = rows[0];

                    console.log(
                        "replace into device_apple_tv (registration,location,display,dutonly,mode,comment,company_id) values ('" +
                        deviceid +
                        "'," +
                        clubid +
                        "," +
                        display +
                        "," +
                        dutonly +
                        "," +
                        mode +
                        ",'" +
                        devicename +
                        "," +
                        row.company_id +
                        "')"
                    );
                    connection.query(
                        "replace into device_apple_tv (registration,location,display,dutonly,mode,comment) values ('" +
                        deviceid +
                        "'," +
                        clubid +
                        "," +
                        display +
                        "," +
                        dutonly +
                        "," +
                        mode +
                        ",'" +
                        devicename +
                        "')",
                        function(err, rows) {
                            res.header("Access-Control-Allow-Origin", "*");
                            res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                            res.header("Access-Control-Allow-Headers", "Content-Type");
                            res.header(
                                "Access-Control-Allow-Headers",
                                "Content-Type, Authorization, Content-Length, X-Requested-With"
                            );

                            res.json(rows);
                        }
                    );
                } else {
                    // No data found
                    res.json({});
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_apple_register(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var deviceid = req.body.deviceid;

        console.log(
            "insert into device_apple_tv (registration) values ('" + deviceid + "')"
        );
        connection.query(
            "insert into device_apple_tv (registration) values ('" + deviceid + "')",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json(rows);
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_apple_verify(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var clubid = req.params.clubid;

        console.log(
            "select hdn_company.applicationID,hdn_locations.* from hdn_locations, hdn_company where hdn_company.id = hdn_locations.company_id and source_id = " +
            clubid
        );
        connection.query(
            "select hdn_company.applicationID,hdn_locations.* from hdn_locations, hdn_company where hdn_company.id = hdn_locations.company_id and source_id = " +
            clubid,
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                if (rows.length > 0) {
                    var row = rows[0];
                    res.json(row);
                } else {
                    res.json({});
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_apple2(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var deviceid = req.query.deviceid;

        // console.log(
        //     "select device_apple_tv.device_url,hdn_locations.id, mode,display,hdn_locations.name,hdn_locations.city,hdn_locations.company_id,registration,applicationID,company,dutonly,meta from hdn_locations,device_apple_tv,device_meta_apple_tv,hdn_company  where device_meta_apple_tv.deviceid = '" +
        //     deviceid +
        //     "' and hdn_company.id = hdn_locations.company_id and hdn_locations.id =  device_apple_tv.location and device_apple_tv.registration = '" +
        //     deviceid +
        //     "'"
        // );
        connection.query(
            "select device_apple_tv.device_url,hdn_locations.id, mode,display,hdn_locations.name,hdn_locations.city,hdn_locations.company_id,registration,applicationID,company,dutonly,meta from hdn_locations,device_apple_tv,device_meta_apple_tv,hdn_company  where device_meta_apple_tv.deviceid = '" +
            deviceid +
            "' and hdn_company.id = hdn_locations.company_id and hdn_locations.id =  device_apple_tv.location and device_apple_tv.registration = '" +
            deviceid +
            "'",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                if (rows.length > 0) {
                    var row = rows[0];
                    res.json(row);
                } else {
                    res.json({});
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_apple(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var deviceid = req.query.deviceid;

        // console.log(
        //     "select device_apple_tv.device_url,hdn_locations.id, mode,display,hdn_locations.name,hdn_locations.city,hdn_locations.company_id,registration,applicationID,company,dutonly,meta from hdn_locations,device_apple_tv,hdn_company  where  hdn_company.id = hdn_locations.company_id and hdn_locations.id =  device_apple_tv.location and device_apple_tv.registration = '" +
        //     deviceid +
        //     "'"
        // );
        connection.query(
            "select device_apple_tv.device_url,hdn_locations.id, mode,display,hdn_locations.name,hdn_locations.city,hdn_locations.company_id,registration,applicationID,company,dutonly,meta from hdn_locations,device_apple_tv,hdn_company  where  hdn_company.id = hdn_locations.company_id and hdn_locations.id =  device_apple_tv.location and device_apple_tv.registration = '" +
            deviceid +
            "'",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                if (rows.length > 0) {
                    var row = rows[0];
                    res.json(row);
                } else {
                    res.json({});
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_update_class_stats(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        // If the last row is a class then lets go
        //SELECT count(*) FROM device_heart_monitor,hdn_classes WHERE transaction = hdn_classes.id and device_heart_monitor.id=(SELECT MAX(device_heart_monitor.id) FROM device_heart_monitor);

        var classid = req.params.classid;

        console.log(
            "select distinct(userid) from device_heart_monitor where transaction = " +
            classid
        );
        connection.query(
            "select distinct(userid) from device_heart_monitor where transaction = " +
            classid,
            function(err, rows) {
                for (var row of rows) {
                    update_reward_points(row.userid, 5);
                    pushMessage(
                        row.userid,
                        "Great workout!, you earned 5 points for completing your workout"
                    );
                }
            }
        );

        console.log(
            "insert ignore into hdn_report_hrclass (fname,lname,gender,age,name,class,event_date,minheart,avgheart,maxheart,weight,user_id,time,duration,classid,company_id,location_id) SELECT fname,lname,gender,age,name,class,event_date,minheart,avgheart,maxheart, weight,userid, time,TIMEDIFF(dt_end, MIN(dt_start)) duration,classid,company_id,location_id FROM ( SELECT users.fname,users.lname,users.gender,users.age,hdn_locations.name,hdn_classes.class,event_date,t1.transaction , MIN(t1.hr_heartrate) minheart,AVG(t1.hr_heartrate) avgheart,MAX(t1.hr_heartrate) maxheart,users.targetweight as weight,MIN(t1.date) dt_start, MAX(t2.date) dt_end, hdn_classes.id as classid,t1.userid,hdn_classes.time,users.company_id,hdn_locations.id as location_id FROM device_heart_monitor t1, device_heart_monitor t2, hdn_classes, users, hdn_locations WHERE  hdn_classes.id =  " +
            classid +
            " and t1.transaction = t2.transaction AND hdn_classes.id = t1.transaction AND users.id = t1.userid AND hdn_locations.id = users.source_id  AND hdn_locations.company_id = users.company_id  group by userid, Date(t1.date)) dummy group by userid,transaction order by event_date"
        );

        connection.query(
            "insert ignore into hdn_report_hrclass (fname,lname,gender,age,name,class,event_date,minheart,avgheart,maxheart,weight,user_id,time,duration,classid,company_id,location_id) SELECT fname,lname,gender,age,name,class,event_date,minheart,avgheart,maxheart, weight,userid, time,TIMEDIFF(dt_end, MIN(dt_start)) duration,classid,company_id,location_id FROM ( SELECT users.fname,users.lname,users.gender,users.age,hdn_locations.name,hdn_classes.class,event_date,t1.transaction , MIN(t1.hr_heartrate) minheart,AVG(t1.hr_heartrate) avgheart,MAX(t1.hr_heartrate) maxheart,users.targetweight as weight,MIN(t1.date) dt_start, MAX(t2.date) dt_end, hdn_classes.id as classid,t1.userid,hdn_classes.time,users.company_id,hdn_locations.id as location_id FROM device_heart_monitor t1, device_heart_monitor t2, hdn_classes, users, hdn_locations WHERE  hdn_classes.id =  " +
            classid +
            " and t1.transaction = t2.transaction AND hdn_classes.id = t1.transaction AND users.id = t1.userid AND hdn_locations.id = users.source_id  AND hdn_locations.company_id = users.company_id  group by userid, Date(t1.date)) dummy group by userid,transaction order by event_date",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                res.json({});
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_getHRVideo(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var exerciseid = req.params.exerciseid;

        //
        console.log("select * from hdn_video where id = " + exerciseid);
        connection.query(
            "select * from hdn_video where id = " + exerciseid,
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                if (rows.length > 0) {
                    // var row = rows[0];
                    res.json(rows);
                } else {
                    res.json({});
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_getHRExercise(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var exerciseid = req.params.exerciseid;

        var dict = new Object();

        connection.query(
            "select is_divider,exercises_groups.priority,if (duration,duration,0) as duration,0 as time,0 as round,title from exercises_groups,exercises where exercises_groups.list_id = " +
            exerciseid +
            " and  exercises.id =  exercises_groups.exercise_id and  exercises_groups.group_type = 'warmup'",
            function(err, rows) {
                dict["warmup"] = rows;

                //exercisedata.push({ key: "warmup",   value: rows });

                connection.query(
                    "select is_divider,exercises_groups.priority,if (duration,duration,0) as duration,0 as time,0 as round,title from exercises_groups,exercises where exercises_groups.list_id = " +
                    exerciseid +
                    " and  exercises.id =  exercises_groups.exercise_id and  exercises_groups.group_type = 'workup'",
                    function(err, rows) {
                        dict["workout"] = rows;
                        //exercisedata.push({ key: "workout",   value: rows });

                        connection.query(
                            "select is_divider,exercises_groups.priority,if (duration,duration,0) as duration,0 as time,0 as round,title from exercises_groups,exercises where exercises_groups.list_id = " +
                            exerciseid +
                            " and  exercises.id =  exercises_groups.exercise_id and  exercises_groups.group_type = 'cooldown' ",
                            function(err, rows) {
                                //exercisedata.push({ key: "cooldown",   value: rows });
                                dict["cooldown"] = rows;

                                res.header("Access-Control-Allow-Origin", "*");
                                res.header(
                                    "Access-Control-Allow-Methods",
                                    "GET,PUT,POST,DELETE"
                                );
                                res.header("Access-Control-Allow-Headers", "Content-Type");
                                res.header(
                                    "Access-Control-Allow-Headers",
                                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                                );

                                res.json(dict);
                            }
                        );
                    }
                );
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_club_getHR(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var clubid = req.params.clubid;

        console.log(
            "select users.id,fname,lname,age,targetweight,deviceNumber,heartRate,name from users join hdn_realtime_heart on  hdn_realtime_heart.deviceNumber = users.nike_user join hdn_locations on  hdn_locations.id = users.source_id where  hdn_realtime_heart.timeStamp >= (NOW() -  Interval 20 second ) and hdn_locations.source_id = " +
            clubid
        );
        connection.query(
            "select users.id,fname,lname,age,targetweight,deviceNumber,heartRate,name from users join hdn_realtime_heart on  hdn_realtime_heart.deviceNumber = users.nike_user join hdn_locations on  hdn_locations.id = users.source_id where  hdn_realtime_heart.timeStamp >= (NOW() -  Interval 20 second ) and hdn_locations.source_id = " +
            clubid,
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                if (rows.length > 0) {
                    // var row = rows[0];
                    res.json(rows);
                } else {
                    res.json({});
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_getHR(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var deviceid = req.query.deviceid;

        console.log(
            "select users.id,fname,lname,age,targetweight,deviceNumber,heartRate,name from users join hdn_realtime_heart on  hdn_realtime_heart.deviceNumber = users.nike_user join hdn_locations on  hdn_locations.id = users.source_id where  hdn_realtime_heart.timeStamp >= (NOW() -  Interval 20 second )"
        );
        connection.query(
            "select users.id,fname,lname,age,targetweight,deviceNumber,heartRate,name from users join hdn_realtime_heart on  hdn_realtime_heart.deviceNumber = users.nike_user join hdn_locations on  hdn_locations.id = users.source_id where  hdn_realtime_heart.timeStamp >= (NOW() -  Interval 20 second )",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                if (rows.length > 0) {
                    // var row = rows[0];
                    res.json(rows);
                } else {
                    res.json({});
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_transactions_dues(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        console.log(
            "select CONCAT(fname,' ',lname) as name,gymfarm_id,hdn_memberships.name as membership,DATE_FORMAT(hdn_members_memberships.expiration_date,'%m/%d') as exp,DATEDIFF(hdn_members_memberships.expiration_date,NOW()) as due_date from users,hdn_members_memberships,hdn_memberships where hdn_members_memberships.status = 1 and hdn_members_memberships.user_id = users.id and hdn_memberships.id = hdn_members_memberships.memberships_id and users.id = " +
            userid
        );
        connection.query(
            "select CONCAT(fname,' ',lname) as name,gymfarm_id,hdn_memberships.name as membership,DATE_FORMAT(hdn_members_memberships.expiration_date,'%m/%d') as exp,DATEDIFF(hdn_members_memberships.expiration_date,NOW()) as due_date from users,hdn_members_memberships,hdn_memberships where hdn_members_memberships.status = 1 and hdn_members_memberships.user_id = users.id and hdn_memberships.id = hdn_members_memberships.memberships_id and users.id = " +
            userid,
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                //if (rows.length > 0) {
                res.json(rows);
                //} else {
                // res.json({});
                //}
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_transactions(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        console.log(
            "select * from hdn_members_payments where user_id = " +
            userid +
            " order by id desc"
        );
        connection.query(
            "select * from hdn_members_payments where user_id = " +
            userid +
            " order by id desc",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                if (rows.length > 0) {
                    // var row = rows[0];
                    res.json(rows);
                } else {
                    res.json({});
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_rc900(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var deviceNumbers = req.params.deviceNumbers;

        console.log(
            "select deviceNumber,heartRate,punch,power,strength from hdn_realtime_heart where deviceNumber IN (" +
            deviceNumbers +
            ") and timeStamp >= (NOW() -  Interval 30 second )"
        );
        connection.query(
            "select deviceNumber,heartRate,punch,power,strength from hdn_realtime_heart where deviceNumber IN (" +
            deviceNumbers +
            ") and timeStamp >= (NOW() -  Interval 30 second )",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                if (rows.length > 0) {
                    var devices = "";

                    for (var device of rows) {
                        devices =
                            devices +
                            '{"heartRate":"' +
                            device.heartRate +
                            '","punch":"' +
                            device.punch +
                            '","power":"' +
                            ((device.power * 0.0001) / 0.0456).toFixed(1) +
                            '","strength":"' +
                            (device.strength * 0.014223343334285).toFixed(1) +
                            '","deviceNumber":"' +
                            device.deviceNumber +
                            '"},';
                    }

                    devices = devices.substring(0, devices.length - 1);

                    res.write(
                        '{"bodys":{"bikeArrays":[],"heartRateArrays":[' +
                        devices +
                        ']},"status":1}'
                    );
                    res.end();
                } else {
                    res.write(
                        '{"bodys":{"bikeArrays":[],"heartRateArrays":[]},"status":1}'
                    );
                    res.end();
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_get_employees(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;

        console.log("select * from users where role = 3 and company_id = 346");
        connection.query(
            "select * from users where role= 3 and company_id = 346",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                if (rows.length > 0) {
                    // var row = rows[0];
                    res.json(rows);
                } else {
                    res.json({});
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_session_class(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.params.userid;
        var classid = req.params.classid;

        console.log(
            "select hdn_sessions_user.id as session_id,hdn_sessions_user.description,hdn_sessions_user.available,hdn_sessions_user.purchased,hdn_sessions_user.used,hdn_sessions_user.user_id from hdn_classes join hdn_sessions_packs on hdn_sessions_packs.id =  hdn_classes.session_id  join hdn_sessions on hdn_sessions.sessions_pack_id = hdn_sessions_packs.id join hdn_sessions_user on hdn_sessions_user.session_id =  hdn_sessions.id where hdn_sessions_user.available > 0 and hdn_sessions_user.user_id = " +
            userid +
            " and hdn_classes.id = " +
            classid +
            " limit 1"
        );
        connection.query(
            "select hdn_sessions_user.id as session_id,hdn_sessions_user.description,hdn_sessions_user.available,hdn_sessions_user.purchased,hdn_sessions_user.used,hdn_sessions_user.user_id from hdn_classes join hdn_sessions_packs on hdn_sessions_packs.id =  hdn_classes.session_id  join hdn_sessions on hdn_sessions.sessions_pack_id = hdn_sessions_packs.id join hdn_sessions_user on hdn_sessions_user.session_id =  hdn_sessions.id where hdn_sessions_user.available > 0 and hdn_sessions_user.user_id = " +
            userid +
            " and hdn_classes.id = " +
            classid +
            " limit 1",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                if (rows.length > 0) {
                    res.json(rows);
                } else {
                    res.json([]);
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_session(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var companyid = req.params.companyid;

        console.log("select * from hdn_sessions where company_id = " + companyid);
        connection.query(
            "select * from hdn_sessions where company_id = " + companyid,
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                if (rows.length > 0) {
                    res.json(rows);
                } else {
                    res.json({});
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_session_cancel(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.body.userid;
        var sessionid = req.body.sessionid;

        console.log(
            "update hdn_sessions_user set available = (available + 1),used = (used - 1) where id = " +
            sessionid +
            " and user_id = " +
            userid
        );
        connection.query(
            "update hdn_sessions_user set available = (available + 1),used = (used - 1) where id  = " +
            sessionid +
            " and user_id = " +
            userid,
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                if (rows.affectedRows > 0) {
                    res.json({
                        affectedRows: 1,
                        status: 0,
                    });
                } else {
                    res.json({
                        status: -1,
                    });
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_session_update(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.body.userid;
        var sessionid = req.body.sessionid;

        console.log(
            "update hdn_sessions_user set available = (available - 1),used = (used + 1) where id = " +
            sessionid +
            " and user_id = " +
            userid +
            " and available > 0"
        );
        connection.query(
            "update hdn_sessions_user set available = (available - 1),used = (used + 1) where id = " +
            sessionid +
            " and user_id = " +
            userid +
            " and available > 0",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                if (rows.affectedRows > 0) {
                    res.json({
                        affectedRows: 1,
                        status: 0,
                    });
                } else {
                    res.json({
                        status: -1,
                    });
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_session_purchase(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var userid = req.body.userid;
        var sessionid = req.body.sessionid;
        var companyid = req.body.companyid;

        console.log(
            "insert into hdn_sessions_user (description,available,company_id,purchasedate,expirationdate,price,user_id,purchased,used,session_id) (select description,sessions as avaliable," +
            companyid +
            " as company_id,NOW() as purchasedate,expirationdate,price, " +
            userid +
            " as user_id, sessions as purchased,0 as used,id as session_id from hdn_sessions where id = " +
            sessionid +
            ")"
        );
        connection.query(
            "insert into hdn_sessions_user (description,available,company_id,purchasedate,expirationdate,price,user_id,purchased,used,session_id) (select description,sessions as avaliable," +
            companyid +
            " as company_id,NOW() as purchasedate,expirationdate,price, " +
            userid +
            " as user_id, sessions as purchased,0 as used,id as session_id from hdn_sessions where id = " +
            sessionid +
            ")",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                if (err) {
                    res.json({
                        status: err.errno,
                        code: err.code,
                        message: err.sqlMessage,
                    });
                } else {
                    res.json({
                        status: 0,
                    });
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

// Openfit NEW !!!Callback
function handle_hdn_webhook2(req, res) {


    if (req.body.eventType == "REGISTRATION_COMPLETED") {
        res.status(200).json({
            received: true
        });
    } else {

        console.log("handle_hdn_webhook2");
        console.log(req.body);

        console.log(
            "insert into activity (user_id,name,duration,timestamp,equipment_id,location_id,client_id) select id,'" + req.body.eventData.classInfo.coach + " - " + req.body.eventData.classInfo.name + "'," + req.body.eventData.totalTime + ",'" + req.body.eventData.classInfo.scheduledStart.replace(/Z/g, '') + "',55,9999,8 from public.user where promocode = '" + req.body.promocode + "'"
        );

        ppool.query(
            "insert into activity (user_id,name,duration,timestamp,equipment_id,location_id,client_id) select id,'" + req.body.eventData.classInfo.coach + " - " + req.body.eventData.classInfo.name + "'," + req.body.eventData.totalTime + ",'" + req.body.eventData.classInfo.scheduledStart.replace(/Z/g, '') + "',55,9999,8 from public.user where promocode = '" + req.body.promocode + "'",
            function(err, rows) {

                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                if (err) {
                    res.status(400).json({
                        received: false
                    });
                } else {
                    res.status(200).json({
                        received: true
                    });
                }

            }
        );

    }



}


function handle_hdn_webhookgp(req, res) {
    let event;
    let body;

      body = JSON.parse(req.rawBody);

        // console.log(JSON.stringify(req.headers));
        let signature = req.headers['x-gympass-signature'];

        var secret    = 'ConcWebSec'; //make this your secret!!
        var algorithm = 'sha1';   //consider using sha256
        var hash, hmac;

        // Method 1 - Writing to a stream
        hmac = crypto.createHmac(algorithm, secret);    
        hmac.write(req.rawBody); // write in to the stream
        hmac.end();       // can't read from the stream until you call end()
        hash = hmac.read().toString('hex');    // read out hmac digest
       
        console.log(signature);
        console.log("Hash: ", hash.toUpperCase());

        if (signature != hash.toUpperCase()){
            res.status(400).send("Signature Error");

            return;
        }

       try {
                var a = "insert into log (data) values ('" + req.rawBody + "')";
                console.log(a);
                ppool.query(a, function(err, client_rows) {});

            } catch (err) {
                res.status(400).send("Webhook Error: ${err.message}");
            }



    if (body.event_type = "checkin") {

        let member_id = body.event_data.user.unique_token;
        let program_id = 76;
        var locationIDS = "";

            console.log(body.event_type);
            console.log(body.event_data.user.unique_token);
            console.log(body.event_data.location.lat);
            console.log(body.event_data.location.lon );
            console.log(body.event_data.gym.id);
            console.log(body.event_data.gym.title);


            findGymPassUser(member_id, function(data) {

                if (data == null) {
                    return res.json({
                        code: 404,
                        status: 'Member not found',
                    });
                }

                member = data;
                member_id = data.user_id;
                console.log(member);

                // Find the location
                findGymPassLocation(body.event_data.gym.id, function(data) {

                    if (data == null) {
                        return res.json({
                            code: 404,
                            status: 'Location not found',
                        });
                    }

                    location = data;
                    location_id = data.id;

                    if (location.parent_id == -1) {
                        location_parent = location.id;
                    } else {
                        location_parent = location.parent_id;
                    }


                    console.log(location);


                    findCompany(location.company_id, function(data) {

                        if (data == null) {
                            return res.json({
                                code: 404,
                                status: 'Program for location not found',
                            });
                        }

                        company = data;
                        console.log(company);


                        // Is this a master slave
                        findAllLocations(location_parent, function(data) {

                            if (data == null) {
                                return res.json({
                                    code: 404,
                                    status: 'Program for location not found',
                                });
                            }

                            locations = data;

                            for (let location of locations) {
                                locationIDS = locationIDS + location.id + ",";
                            }

                            locationIDS = locationIDS.substring(0, locationIDS.length - 1);

                            console.log(locationIDS);

                            findCompanyProgram(location.company_id, program_id, function(data) {

                                program = data;
                                console.log(program);


                                if (program == null) {

                                    findLocationProgram(location_id, program_id, function(data) {
                                        if (data == null) {
                                            return res.json({
                                                code: 404,
                                                status: 'Program for location/company not found',
                                            });
                                        }

                                        program = data;
                                        // console.log(program);

                                        var foundMemberMatch = false;

                                        for (var i = 0; i < program.length; i++) {
                                            var row = program[i];

                                            if (row.program_id == 76) {
                                                foundMemberMatch = true;
                                                program = row;
                                                break;
                                            }

                                            console.log(row);
                                        }


                                        if (!foundMemberMatch) {

                                            var error = '';

                                                error = 'It appears you are an eligible Gym Pass member, but not eligible for this location. Please call Gym Pass support and they will be glad to assist you.';
                                     
                                            return res.json({
                                                code: 204,
                                                status: error,
                                            });

                                        }
                                        console.log("=======================================================================================================================================");

                                        memberMonthlyCheckinsLocationProgram(member_id, locationIDS, program_id, function(data) {

                                            if (data == null) {
                                                return res.json({
                                                    code: 404,
                                                    status: 'Program for location not found',
                                                });
                                            }

                                            member_chekins = parseInt(data);

                                            console.log(member_chekins);

                                            if (program.allowance == 0) {
                                                console.log("insert into checkin_history (user_id,location_id,program_id,checkin,source_id) VALUES(" + member_id + "," + location_id + "," + program_id + ",1,3)");
                                                ppool.query("insert into checkin_history (user_id,location_id,program_id,checkin,source_id) VALUES(" + member_id + "," + location_id + "," + program_id + ",1,3)",
                                                    function(err, apirows) {

                                                        if (err) {
                                                            callback(null);
                                                        }

                                                        console.log("update public.user set eligibility_status = 'Eligible' where id = " + member_id);
                                                        ppool.query("update public.user set eligibility_status = 'Eligible' where id = " + member_id,
                                                            function(err, apirows) {});

                                                        return res.json({
                                                            code: 200,
                                                            status: "You have checked in!",
                                                        });

                                                    });

                                            } else if ((member_chekins + 1) > program.allowance) {
                                                // BAD
                                                return res.json({
                                                    code: 204,
                                                    status: "You have exceeded the allotted maximum visits this month at this location for your fitness offering. Talk to the front desk staff if you would like more visits at this club this month.",
                                                });
                                            } else {
                                                // GOOD
                                                console.log("insert into checkin_history (user_id,location_id,program_id,checkin,source_id) VALUES(" + member_id + "," + location_id + "," + program_id + ",1,3)");
                                                ppool.query("insert into checkin_history (user_id,location_id,program_id,checkin,source_id) VALUES(" + member_id + "," + location_id + "," + program_id + ",1,3)",
                                                    function(err, apirows) {

                                                        if (err) {
                                                            callback(null);
                                                        }

                                                        if ((member_chekins + 1) == program.allowance) {
                                                            return res.json({
                                                                code: 200,
                                                                status: "Congrats! You have met your maximum visits this month for your fitness offering. Talk to the front desk staff if you would like more visits at this club this month.",
                                                            });

                                                        } else {
                                                            return res.json({
                                                                code: 200,
                                                                status: "You have used " + (member_chekins + 1) + " of " + program.allowance + " checkins"
                                                            });
                                                        }

                                                    });
                                            }
                                        }); //memberMonthlyCheckinsLocationProgram
                                    }); //findLocationProgram

                                } else {


                                    memberMonthlyCheckinsCompanyProgram(member_id, location.company_id, program_id, function(data) {

                                        if (data == null) {
                                            return res.json({
                                                code: 404,
                                                status: 'Program for location not found',
                                            });
                                        }

                                        member_chekins = parseInt(data);

                                        console.log(member_chekins);
                                        if (program.allowance == 0) {
                                            console.log("insert into checkin_history (user_id,location_id,program_id,checkin,source_id) VALUES(" + member_id + "," + location_id + "," + program_id + ",1,3)");
                                            ppool.query("insert into checkin_history (user_id,location_id,program_id,checkin,source_id) VALUES(" + member_id + "," + location_id + "," + program_id + ",1,3)",
                                                function(err, apirows) {

                                                    if (err) {
                                                        callback(null);
                                                    }

                                                    return res.json({
                                                        code: 200,
                                                        status: "You have checked in!",
                                                    });

                                                });
                                        } else if ((member_chekins + 1) > program.allowance) {
                                            // BAD
                                            return res.json({
                                                code: 204,
                                                status: "You have exceeded the allotted maximum visits this month at this location for your fitness offering. Talk to the front desk staff if you would like more visits at this club this month.",
                                            });
                                        } else {
                                            // GOOD
                                            console.log("insert into checkin_history (user_id,location_id,program_id,checkin,source_id) VALUES(" + member_id + "," + location_id + "," + program_id + ",1,3)");
                                            ppool.query("insert into checkin_history (user_id,location_id,program_id,checkin,source_id) VALUES(" + member_id + "," + location_id + "," + program_id + ",1,3)",
                                                function(err, apirows) {

                                                    if (err) {
                                                        callback(null);
                                                    }

                                                    if ((member_chekins + 1) == program.allowance) {
                                                        return res.json({
                                                            code: 200,
                                                            status: "Congrats! You have met your maximum visits this month for your fitness offering. Talk to the front desk staff if you would like more visits at this club this month.",
                                                        });

                                                    } else {
                                                        return res.json({
                                                            code: 200,
                                                            status: "You have used " + (member_chekins + 1) + " of " + program.allowance + " checkins"
                                                        });
                                                    }

                                                });

                                        }

                                    }); //memberMonthlyCheckinsCompanyProgram    

                                }


                            }); //findLocationProgram




                        }); // findAllLocations

                    }); // findCompany
                }); // findLocation

            });
    // Return a response to acknowledge receipt of the event
     } else {
         return res.json({
                                    code: 404,
                                    status: 'Rejected event type',
                                });

     }
    }

function handle_hdn_webhooktg(req, res) {
    let event;

    try {
        //  event = JSON.parse(req.body);
        // console.log(res.body);

        var a = "insert into log (data) values ('" + res.body + "')";
        console.log(a);
        ppool.query(a, function(err, client_rows) {});

        res.status(200).json({
            received: true
        });
    } catch (err) {
        res.status(400).send("Webhook Error: ${err.message}");
    }

    // Return a response to acknowledge receipt of the event

}



function handle_hdn_webhook(req, res) {

    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }


        console.log(req.body);


        if (req.body.eventType == "REGISTRATION_COMPLETED") {

        } else {


            console.log(
                "insert into ch_activities (user_id,name,duration,timestamp,equipment_id,location_id,client_id) select id,'" + req.body.eventData.classInfo.coach + " - " + req.body.eventData.classInfo.name + "'," + req.body.eventData.totalTime + ",'" + req.body.eventData.classInfo.scheduledStart.replace(/Z/g, '') + "',55,9999,8 from users where beach_id = '" + req.body.userId + "'"
            );

            connection.query(
                "insert into ch_activities (user_id,name,duration,timestamp,equipment_id,location_id,client_id) select id,'" + req.body.eventData.classInfo.coach + " - " + req.body.eventData.classInfo.name + "'," + req.body.eventData.totalTime + ",'" + req.body.eventData.classInfo.scheduledStart.replace(/Z/g, '') + "',55,9999,8 from users where beach_id = '" + req.body.userId + "'",
                function(err, rows) {

                    res.header("Access-Control-Allow-Origin", "*");
                    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                    res.header("Access-Control-Allow-Headers", "Content-Type");
                    res.header(
                        "Access-Control-Allow-Headers",
                        "Content-Type, Authorization, Content-Length, X-Requested-With"
                    );

                    if (err) {
                        res.status(400).json({
                            received: false
                        });
                    } else {
                        res.status(200).json({
                            received: true
                        });
                    }

                }
            );

        }

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });


}

function handle_hdn_put_schedule(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var classname = req.body.classname;
        var room = req.body.room;
        var price = req.body.price;
        var start_date = req.body.start_date;
        var end_date = req.body.end_date;
        var max_attendees = req.body.max_attendees;
        var employee_id = req.body.employee_id;

        var startTime = new Date(start_date);
        var endTime = new Date(end_date);
        var difference = endTime.getTime() - startTime.getTime(); // This will give difference in milliseconds
        var minutes = Math.round(difference / 60000);

        console.log(
            "insert hdn_classes set duration = " +
            minutes +
            ",instance_id =" +
            Date.now() +
            ",company_id = 346,id_user = 121422988, location_id = 6373, class = '" +
            classname +
            "',room = '" +
            room +
            "', price = " +
            price +
            ", event_date =" +
            start_date +
            ",start_date = " +
            start_date +
            ",end_date = " +
            end_date +
            ",max_attendees = " +
            max_attendees +
            ",employee_id =" +
            employee_id
        );
        connection.query(
            "insert hdn_classes set duration = " +
            minutes +
            ",instance_id =" +
            Date.now() +
            ",company_id = 346,id_user = 121422988, location_id = 6373, class = '" +
            classname +
            "',room = '" +
            room +
            "', price = " +
            price +
            ", event_date =" +
            start_date +
            ",start_date = " +
            start_date +
            ",end_date = " +
            end_date +
            ",max_attendees = " +
            max_attendees +
            ",employee_id =" +
            employee_id,
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                if (err) {
                    res.json({
                        status: err.errno,
                        code: err.code,
                        message: err.sqlMessage,
                    });
                } else {
                    res.json({
                        status: 0,
                    });
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_wellness_employers(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var wellnessid = req.params.wellnessid;

        console.log(
            "select hdn_company.* from hdn_company join ch_wellness on ch_wellness.wellness_id = hdn_company.id group by company"
        );
        connection.query(
            "select hdn_company.* from hdn_company join ch_wellness on ch_wellness.wellness_id = hdn_company.id group by company",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                if (rows.length > 0) {
                    res.json(rows);
                } else {
                    res.json([]);
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_wellness_company_membership(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var wellnessid = req.params.wellnessid;

        console.log(
            "select hdn_memberships.id,hdn_memberships.name,hdn_memberships.desc, concat('\"',cast(hdn_memberships.price  as decimal(6,2)),'\"') as price  from hdn_company join ch_wellness on ch_wellness.company_id = hdn_company.id join hdn_memberships on hdn_memberships.company_id  = hdn_company.id where  hdn_company.id IN (select hdn_company.id from hdn_locations join hdn_company on hdn_locations.company_id = hdn_company.id where company = '" +
            wellnessid +
            "')"
        );
        connection.query(
            "select hdn_memberships.id,hdn_memberships.name,hdn_memberships.desc,concat('\"',cast(hdn_memberships.price  as decimal(6,2)),'\"') as price  from hdn_company join ch_wellness on ch_wellness.company_id = hdn_company.id join hdn_memberships on hdn_memberships.company_id  = hdn_company.id where  hdn_company.id IN (select hdn_company.id from hdn_locations join hdn_company on hdn_locations.company_id = hdn_company.id where company = '" +
            wellnessid +
            "')",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                if (rows.length > 0) {
                    res.json(rows);
                } else {
                    res.json([]);
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}


function handle_hdn_wellness_company(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var lat = req.params.lat;
        var lng = req.params.lng;
        var wellnessid = req.params.wellnessid;

        console.log(
            "SELECT *, ( 3959 * acos ( cos ( radians(" +
            lat +
            ") ) * cos( radians( lat ) ) * cos( radians( lng ) - radians(" +
            lng +
            ") ) + sin ( radians(" +
            lat +
            ") ) * sin( radians( lat ) ) ) ) AS distance FROM hdn_locations join hdn_company on hdn_company.id = hdn_locations.company_id join ch_wellness on ch_wellness.company_id = hdn_company.id HAVING (distance < 30) order by distance"
        );
        connection.query(
            "SELECT *, ( 3959 * acos ( cos ( radians(" +
            lat +
            ") ) * cos( radians( lat ) ) * cos( radians( lng ) - radians(" +
            lng +
            ") ) + sin ( radians(" +
            lat +
            ") ) * sin( radians( lat ) ) ) ) AS distance FROM hdn_locations join hdn_company on hdn_company.id = hdn_locations.company_id join ch_wellness on ch_wellness.company_id = hdn_company.id HAVING (distance < 30) order by distance",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                if (rows.length > 0) {
                    res.json(rows);
                } else {
                    res.json([]);
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

// function handle_hdn_wellness_company(req, res) {
//   pool.getConnection(function (err, connection) {
//     if (err) {
//       res.json({
//         code: 100,
//         status: err,
//       });

//       return;
//     }

//     var wellnessid = req.params.wellnessid;

//     console.log(
//       "select hdn_company.* from hdn_company join hdn_wellness on hdn_wellness.company_id = hdn_company.id where  hdn_company.id IN (select hdn_wellness.company_id from hdn_company join hdn_wellness on hdn_wellness.wellness_id = hdn_company.id   where company = '" +
//         wellnessid +
//         "') "
//     );
//     connection.query(
//       "select hdn_company.* from hdn_company join hdn_wellness on hdn_wellness.company_id = hdn_company.id where  hdn_company.id IN (select hdn_wellness.company_id from hdn_company join hdn_wellness on hdn_wellness.wellness_id = hdn_company.id   where company = '" +
//         wellnessid +
//         "') ",
//       function (err, rows) {
//         res.header("Access-Control-Allow-Origin", "*");
//         res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
//         res.header("Access-Control-Allow-Headers", "Content-Type");
//         res.header(
//           "Access-Control-Allow-Headers",
//           "Content-Type, Authorization, Content-Length, X-Requested-With"
//         );

//         if (rows.length > 0) {
//           res.json(rows);
//         } else {
//           res.json([]);
//         }
//       }
//     );

//     connection.release();

//     connection.on("error", function (err) {
//       connection.release();
//       res.json({
//         code: 100,
//         status: err,
//       });

//       return;
//     });
//   });
// }

function handle_hdn_wellness_company_id(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var wellnessid = req.params.wellnessid;

        console.log(
            "select * from hdn_company join ch_wellness on ch_wellness.`company_id` = hdn_company.id where wellness_id = " +
            wellnessid
        );
        connection.query(
            "select * from hdn_company join ch_wellness on ch_wellness.`company_id` = hdn_company.id where wellness_id = " +
            wellnessid,
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                if (rows.length > 0) {
                    res.json(rows);
                } else {
                    res.json([]);
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_validate_employee(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var memnum = req.body.memnum;
        var locationid = req.body.locationid;

        console.log(
            "select users.* from users where users.company_id IN (select id from hdn_company where company = '" +
            locationid +
            "') and ((memnum = '" +
            memnum +
            "') or (email = '" +
            memnum +
            "'))"
        );
        connection.query(
            "select users.* from users where users.company_id IN (select id from hdn_company where company = '" +
            locationid +
            "') and ((memnum = '" +
            memnum +
            "') or (email = '" +
            memnum +
            "'))",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                if (rows.length == 0) {
                    res.json({
                        code: 404,
                    });
                } else {
                    res.json({
                        status: 200,
                        data: rows,
                    });
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function timestamp() {
    function pad(n) {
        return n < 10 ? "0" + n : n;
    }
    d = new Date();
    dash = "-";
    colon = ":";
    return (
        d.getFullYear() + dash + pad(d.getMonth() + 1) + dash + pad(d.getDate())
    );
}

function handle_hdn_locations_distance(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var lat = req.params.lat;
        var lng = req.params.lng;

        console.log(
            "SELECT *, ( 3959 * acos ( cos ( radians(" +
            lat +
            ") ) * cos( radians( lat ) ) * cos( radians( lng ) - radians(" +
            lng +
            ") ) + sin ( radians(" +
            lat +
            ") ) * sin( radians( lat ) ) ) ) AS distance FROM hdn_locations HAVING (distance < 30) order by distance"
        );
        connection.query(
            "SELECT *, ( 3959 * acos ( cos ( radians(" +
            lat +
            ") ) * cos( radians( lat ) ) * cos( radians( lng ) - radians(" +
            lng +
            ") ) + sin ( radians(" +
            lat +
            ") ) * sin( radians( lat ) ) ) ) AS distance FROM hdn_locations HAVING (distance < 30) order by distance",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                if (rows.length > 0) {
                    res.json(rows);
                } else {
                    res.json([]);
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_distance(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var lat = req.params.lat;
        var lng = req.params.lng;

        console.log(
            "SELECT city, ( 3959 * acos ( cos ( radians(" +
            lat +
            ") ) * cos( radians( lat ) ) * cos( radians( lng ) - radians(" +
            lng +
            ") ) + sin ( radians(" +
            lat +
            ") ) * sin( radians( lat ) ) ) ) AS distance FROM hdn_locations HAVING (distance < 50) order by distance"
        );
        connection.query(
            "SELECT city, ( 3959 * acos ( cos ( radians(" +
            lat +
            ") ) * cos( radians( lat ) ) * cos( radians( lng ) - radians(" +
            lng +
            ") ) + sin ( radians(" +
            lat +
            ") ) * sin( radians( lat ) ) ) ) AS distance FROM hdn_locations HAVING (distance < 50) order by distance",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                if (rows.length > 0) {
                    res.json(rows);
                } else {
                    res.json([]);
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_post_accounts(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var account_id = req.body.account_id;
        var account = req.body.account;
        var user_id = req.body.user_id;

        console.log(
            "replace hdn_accounts set account_id = " +
            account_id +
            ",account = '" +
            account +
            "',user_id = " +
            user_id
        );
        connection.query(
            "replace hdn_accounts set account_id = " +
            account_id +
            ",account = '" +
            account +
            "',user_id = " +
            user_id,
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                if (err) {
                    res.json({
                        status: err.errno,
                        code: err.code,
                        message: err.sqlMessage,
                    });
                } else {
                    res.json({
                        status: 0,
                    });
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_get_account_types(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var user_id = req.params.user_id;

        console.log("select * from hdn_accounts_name");
        connection.query("select * from hdn_accounts_name", function(err, rows) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
            res.header("Access-Control-Allow-Headers", "Content-Type");
            res.header(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization, Content-Length, X-Requested-With"
            );

            if (rows.length > 0) {
                res.json(rows);
            } else {
                res.json([]);
            }
        });

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_get_accounts(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var user_id = req.params.user_id;

        // console.log("select * from hdn_accounts left join hdn_accounts_name on hdn_accounts_name.id = hdn_accounts.id where user_id = " + user_id);
        // connection.query("select * from hdn_accounts left join hdn_accounts_name on hdn_accounts_name.id = hdn_accounts.id where user_id = " + user_id, function(err, rows) {

        console.log(
            "select id,email,avatar,phone,birthday,memnum,fod_id,peloton_id,optum_id,echelon_id,ash_id,humana_id,gymfarm_id from users where id = " +
            user_id +
            " limit 1"
        );
        connection.query(
            "select id,email,avatar,phone,birthday,memnum,fod_id,peloton_id,optum_id,echelon_id,ash_id,humana_id,gymfarm_id from users where id = " +
            user_id +
            " limit 1",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                if (rows.length > 0) {
                    res.json(rows);
                } else {
                    res.json([]);
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_get_locations(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }
        var apikey = req.headers["x-api-key"];
        var user_id = req.params.user_id;

        if (!apikey) {
            res.json({
                code: 400,
                status: "Invalid API Key",
            });
            return;
        }

        //console.log("select * from ch_api where apikey = '" + apikey + "'");
        connection.query(
            "select * from ch_api where apikey = '" + apikey + "'",
            function(err, rows) {
                if (rows.length == 0) {
                    res.json({
                        code: 400,
                        status: "Invalid API Key",
                    });
                    return;
                } else {
                    console.log(
                        "select id,name,address,city,state,postal,lat,lng,timezone from ch_locations order by id"
                    );
                    connection.query(
                        "select id,name,address,city,state,postal,lat,lng,timezone from ch_locations order by id",
                        function(err, rows) {
                            res.header("Access-Control-Allow-Origin", "*");
                            res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                            res.header("Access-Control-Allow-Headers", "Content-Type");
                            res.header(
                                "Access-Control-Allow-Headers",
                                "Content-Type, Authorization, Content-Length, X-Requested-With"
                            );

                            if (rows.length > 0) {
                                res.json(rows);
                            } else {
                                res.json([]);
                            }
                        }
                    );
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_get_equipment(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }
        var apikey = req.headers["x-api-key"];
        var user_id = req.params.user_id;

        if (!apikey) {
            res.json({
                code: 400,
                status: "Invalid API Key",
            });
            return;
        }

        console.log("select * from ch_api where apikey = '" + apikey + "'");
        connection.query(
            "select * from ch_api where apikey = '" + apikey + "'",
            function(err, rows) {
                if (rows.length == 0) {
                    res.json({
                        code: 400,
                        status: "Invalid API Key",
                    });
                    return;
                } else {
                    console.log(
                        "select id,name from ch_equipment group by name order by id"
                    );
                    connection.query(
                        "select id,name from ch_equipment group by name order by id",
                        function(err, rows) {
                            res.header("Access-Control-Allow-Origin", "*");
                            res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                            res.header("Access-Control-Allow-Headers", "Content-Type");
                            res.header(
                                "Access-Control-Allow-Headers",
                                "Content-Type, Authorization, Content-Length, X-Requested-With"
                            );

                            if (rows.length > 0) {
                                res.json(rows);
                            } else {
                                res.json([]);
                            }
                        }
                    );
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_get_membership(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }
        var apikey = req.headers["x-api-key"];
        var memnum = req.params.memnum;

        if (!apikey) {
            res.json({
                code: 400,
                status: "Invalid API Key",
            });
            return;
        }

        if (!memnum) {
            res.json({
                code: 400,
            });
            return;
        }

        console.log("select * from ch_api where apikey = '" + apikey + "'");
        connection.query(
            "select * from ch_api where apikey = '" + apikey + "'",
            function(err, rows) {
                if (rows.length == 0) {
                    res.json({
                        code: 400,
                        status: "Invalid API Key",
                    });
                    return;
                } else {
                    console.log(
                        "select id,role,fname,lname,avatar,memnum,scancode,sequence,gymfarm_id as conciergeid,eligibility_status,eligibility_reason from users where memnum = '" +
                        memnum +
                        "'"
                    );
                    connection.query(
                        "select id,role,fname,lname,avatar,memnum,scancode,sequence,gymfarm_id as conciergeid,eligibility_status,eligibility_reason from users where memnum = '" +
                        memnum +
                        "'",
                        function(err, rows) {
                            res.header("Access-Control-Allow-Origin", "*");
                            res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                            res.header("Access-Control-Allow-Headers", "Content-Type");
                            res.header(
                                "Access-Control-Allow-Headers",
                                "Content-Type, Authorization, Content-Length, X-Requested-With"
                            );

                            if (rows.length > 0) {
                                res.json(rows);
                            } else {
                                res.json([]);
                            }
                        }
                    );
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_get_statistic(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }
        var apikey = req.headers["x-api-key"];
        var user_id = req.params.user_id;
        var timestamp = req.params.date;

        if (!apikey) {
            res.json({
                code: 400,
                status: "Invalid API Key",
            });
            return;
        }

        if (!timestamp) {
            res.json({
                code: 400,
            });
            return;
        }

        if (!user_id) {
            res.json({
                code: 400,
            });
            return;
        }

        console.log("select * from ch_api where apikey = '" + apikey + "'");
        connection.query(
            "select * from ch_api where apikey = '" + apikey + "'",
            function(err, rows) {
                if (rows.length == 0) {
                    res.json({
                        code: 400,
                        status: "Invalid API Key",
                    });
                    return;
                } else {
                    console.log(
                        "select ch_activities.*, if (ch_locations.name is null,'None',ch_locations.name) as location_name,if (ch_equipment.name is null,'None',ch_equipment.name) as equipment_name  from ch_activities left join ch_locations on ch_locations.id = ch_activities.location_id left join ch_equipment on ch_equipment.id = ch_activities.equipment_id where location_id = 9999 and equipment_id = 9999 and user_id = " +
                        user_id +
                        " and DATE(timestamp) = DATE('" +
                        timestamp +
                        "')"
                    );
                    connection.query(
                        "select ch_activities.*, if (ch_locations.name is null,'None',ch_locations.name) as location_name,if (ch_equipment.name is null,'None',ch_equipment.name) as equipment_name  from ch_activities left join ch_locations on ch_locations.id = ch_activities.location_id left join ch_equipment on ch_equipment.id = ch_activities.equipment_id where location_id = 9999 and equipment_id = 9999 and user_id = " +
                        user_id +
                        " and DATE(timestamp) = DATE('" +
                        timestamp +
                        "')",
                        function(err, rows) {
                            res.header("Access-Control-Allow-Origin", "*");
                            res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                            res.header("Access-Control-Allow-Headers", "Content-Type");
                            res.header(
                                "Access-Control-Allow-Headers",
                                "Content-Type, Authorization, Content-Length, X-Requested-With"
                            );

                            if (rows.length > 0) {
                                res.json(rows);
                            } else {
                                res.json([]);
                            }
                        }
                    );
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}


function handle_hdn_post_bytoken_member(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var apikey = req.headers["x-api-key"];
        var token = req.body.token;
        var fname = req.body.fname;
        var lname = req.body.lname;
        var memnum = req.body.memnum;
        var email = req.body.email;


        if (!apikey) {
            res.json({
                code: 400,
                status: "Invalid API Key",
            });
            return;
        }


        // required fields
        if (!token || !fname || !lname || !memnum || !email) {
            res.json({
                code: 400,
            });
            return;
        }


        var apiid = 0;

        console.log("select * from ch_api where apikey = '" + apikey + "'");

        connection.query(
            "select * from ch_api where apikey = '" + apikey + "'",
            function(err, apirows) {
                if (apirows.length == 0) {
                    res.json({
                        code: 400,
                        status: "Invalid API Key",
                    });
                    return;
                } else {

                    apiid = apirows[0].id;

                    console.log("select * from users2 where '" + token + "' = token limit 1");

                    connection.query(
                        "select * from users2 where '" + token + "' = token limit 1",

                        function(err, userrows) {

                            if (userrows.length == 0) {
                                //insert
                                console.log("insert into users2 (fname,lname,token,memnum,email,password,salt) VALUES('" + fname + "','" + lname + "','" + token + "','" + memnum + "','" + email + "','password','salt')");

                                connection.query(
                                    "insert into users2 (fname,lname,token,memnum,email,password,salt) VALUES('" + fname + "','" + lname + "','" + token + "','" + memnum + "','" + email + "','password','salt')",
                                    function(err, rows) {

                                        if (rows.insertId) {
                                            res.json({
                                                code: 200,
                                                status: err,
                                            });

                                        }
                                    }
                                );

                            } else {

                                res.json({
                                    code: 200,
                                    status: err,
                                });

                            }


                        });

                }
            });


        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });

    });
}

function handle_hdn_get_bytoken_activities(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }
        var apikey = req.headers["x-api-key"];
        var token = req.params.token;

        if (!apikey) {
            res.json({
                code: 400,
                status: "Invalid API Key",
            });
            return;
        }

        if (!token) {
            res.json({
                code: 400,
            });
            return;
        }

        console.log("select * from ch_api where apikey = '" + apikey + "'");
        connection.query(
            "select * from ch_api where apikey = '" + apikey + "'",
            function(err, rows) {
                if (rows.length == 0) {
                    res.json({
                        code: 400,
                        status: "Invalid API Key",
                    });
                    return;
                } else {
                    console.log(
                        "select ch_activities.*, if (ch_locations.name is null,'None',ch_locations.name) as location_name,if (ch_equipment.name is null,'None',ch_equipment.name) as equipment_name  from ch_activities left join ch_locations on ch_locations.id = ch_activities.location_id left join users on users.id = ch_activities.user_id left join ch_equipment on ch_equipment.id = ch_activities.equipment_id where token = '" + token + "' group by name, timestamp , user_id, location_id, equipment_id");
                    connection.query(
                        "select ch_activities.*, if (ch_locations.name is null,'None',ch_locations.name) as location_name,if (ch_equipment.name is null,'None',ch_equipment.name) as equipment_name  from ch_activities left join ch_locations on ch_locations.id = ch_activities.location_id left join users on users.id = ch_activities.user_id left join ch_equipment on ch_equipment.id = ch_activities.equipment_id where token = '" +
                        token + "' group by name, timestamp , user_id, location_id, equipment_id",
                        function(err, rows) {
                            res.header("Access-Control-Allow-Origin", "*");
                            res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                            res.header("Access-Control-Allow-Headers", "Content-Type");
                            res.header(
                                "Access-Control-Allow-Headers",
                                "Content-Type, Authorization, Content-Length, X-Requested-With"
                            );

                            if (rows.length > 0) {
                                res.json(rows);
                            } else {
                                res.json([]);
                            }
                        }
                    );
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_get_activities(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }
        var apikey = req.headers["x-api-key"];
        var user_id = req.params.user_id;

        if (!apikey) {
            res.json({
                code: 400,
                status: "Invalid API Key",
            });
            return;
        }

        if (!user_id) {
            res.json({
                code: 400,
            });
            return;
        }

        console.log("select * from ch_api where apikey = '" + apikey + "'");
        connection.query(
            "select * from ch_api where apikey = '" + apikey + "'",
            function(err, rows) {
                if (rows.length == 0) {
                    res.json({
                        code: 400,
                        status: "Invalid API Key",
                    });
                    return;
                } else {
                    console.log(
                        "select ch_activities.*, if (ch_locations.name is null,'None',ch_locations.name) as location_name,if (ch_equipment.name is null,'None',ch_equipment.name) as equipment_name  from ch_activities left join ch_locations on ch_locations.id = ch_activities.location_id left join ch_equipment on ch_equipment.id = ch_activities.equipment_id where user_id = " +
                        user_id + " group by name, timestamp , user_id, location_id, equipment_id"
                    );
                    connection.query(
                        "select ch_activities.*, if (ch_locations.name is null,'None',ch_locations.name) as location_name,if (ch_equipment.name is null,'None',ch_equipment.name) as equipment_name  from ch_activities left join ch_locations on ch_locations.id = ch_activities.location_id left join ch_equipment on ch_equipment.id = ch_activities.equipment_id where user_id = " +
                        user_id + " group by name, timestamp , user_id, location_id, equipment_id",
                        function(err, rows) {
                            res.header("Access-Control-Allow-Origin", "*");
                            res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                            res.header("Access-Control-Allow-Headers", "Content-Type");
                            res.header(
                                "Access-Control-Allow-Headers",
                                "Content-Type, Authorization, Content-Length, X-Requested-With"
                            );

                            if (rows.length > 0) {
                                res.json(rows);
                            } else {
                                res.json([]);
                            }
                        }
                    );
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_post_bytoken_activities2(req, res) {
    // console.log("handle_hdn_post_bytoken_activities2");

    var apikey = req.headers["x-api-key"];

    var token = req.body.token;
    var timestamp = req.body.timestamp;
    var equipmentid = req.body.equipmentid;
    var locationid = req.body.locationid;

    var score = req.body.score;
    var calories = req.body.calories;
    var minutes = req.body.minutes;
    var steps = req.body.steps;
    var distance = req.body.distance;
    var heart = req.body.heart;
    var checkedin = req.body.checkedin;
    var duration = req.body.duration;
    var watts = req.body.watts;
    var water = req.body.water;
    var weight = req.body.weight;
    var desc = req.body.desc;
    var feeling = req.body.feeling;
    var checkedout = req.body.checkedout;
    var bmi = req.body.bmi;

    if (!bmi) {
        bmi = 0;
    }

    if (!score) {
        score = 0;
    }

    if (!calories) {
        calories = 0;
    }

    if (!minutes) {
        minutes = 0;
    }

    if (!steps) {
        steps = 0;
    }

    if (!distance) {
        distance = 0;
    }

    if (!heart) {
        heart = 0;
    }

    if (!checkedin) {
        checkedin = 0;
    }

    if (!checkedout) {
        checkedout = 0;
    }


    if (!duration) {
        duration = 0;
    }

    if (!watts) {
        watts = 0;
    }

    if (!water) {
        water = 0;
    }

    if (!weight) {
        weight = 0;
    }

    if (!desc) {
        desc = "";
    } else {
        desc = desc.replace(/["']/g, "");
    }

    if (!feeling) {
        feeling = 0;
    }



    if (!apikey) {
        return;
    }

    // required fields
    if (!token || !timestamp || !equipmentid || !locationid) {
        return;
    }

    var apiid = 0;

    // console.log("select * from api where apikey = '" + apikey + "'");

    ppool.query(
        "select * from api where apikey = '" + apikey + "'",

        function(err, apirows) {
            if (apirows.rows.length == 0) {
                res.json({
                    code: 400,
                });
                return;
            } else {

                apiid = apirows.rows[0].id;

                // console.log("select * from public.user where token = '" + token + "'");

                ppool.query(
                    "select * from public.user where token = '" + token + "'",
                    function(err, userrows) {

                        if (userrows.rows.length == 0) {
                            res.json({
                                code: 404,
                                status: "token not found",
                            });
                            return;
                        }

                        var userid = userrows.rows[0].id;

                        // Daily combnations
                        if (equipmentid == 9999) {
                            console.log(
                                "select * from activity where location_id = " +
                                locationid +
                                " and equipment_id = " +
                                equipmentid +
                                " and user_id = " +
                                userid +
                                " and DATE(timestamp) = DATE('" +
                                timestamp +
                                "')"
                            );
                            ppool.query(
                                "select * from activity where location_id = " +
                                locationid +
                                " and equipment_id  = " +
                                equipmentid +
                                " and user_id = " +
                                userid +
                                " and DATE(timestamp) = DATE('" +
                                timestamp +
                                "')",
                                function(err, rows) {

                                    if (err) {
                                        console.log(err);
                                        res.json({
                                            code: 404,
                                            status: "activity error found",
                                        });
                                        return;
                                    }

                                    if (rows.length == 0) {
                                        console.log(
                                            "insert into activity (client_id,user_id,timestamp,equipment_id,location_id) VALUES(" +
                                            apiid + "," + userid +
                                            ",'" +
                                            timestamp +
                                            "'," +
                                            equipmentid +
                                            "," +
                                            locationid +
                                            ")  RETURNING id"
                                        );
                                        ppool.query(
                                            "insert into activity (client_id,user_id,timestamp,equipment_id,location_id) VALUES(" +
                                            apiid + "," + userid +
                                            ",'" +
                                            timestamp +
                                            "'," +
                                            equipmentid +
                                            "," +
                                            locationid +
                                            ")  RETURNING id",
                                            function(err, rows) {}
                                        );
                                    }

                                    var sql = "update activity set ";
                                    var updated = false;

                                    if (score) {
                                        updated = true;
                                        sql = sql + " score = " + score + " , ";
                                    }

                                    if (calories) {
                                        updated = true;
                                        sql = sql + " calories = " + calories + " , ";
                                    }

                                    if (minutes) {
                                        updated = true;
                                        sql = sql + " minutes = " + minutes + " , ";
                                    }

                                    if (steps) {
                                        updated = true;
                                        sql = sql + " steps = " + steps + " , ";
                                    }

                                    if (distance) {
                                        updated = true;
                                        sql = sql + " distance = " + distance + " , ";
                                    }

                                    if (heart) {
                                        updated = true;
                                        sql = sql + " heart = " + heart + " , ";
                                    }

                                    if (checkedin) {
                                        updated = true;
                                        sql = sql + " checkin = " + checkedin + " , ";
                                    }

                                    if (checkedout) {
                                        updated = true;
                                        sql = sql + " checkout = " + checkedout + " , ";
                                    }


                                    if (duration) {
                                        updated = true;
                                        sql = sql + " duration = " + duration + " , ";
                                    }

                                    if (watts) {
                                        updated = true;
                                        sql = sql + " watts = " + watts + " , ";
                                    }

                                    if (water) {
                                        updated = true;
                                        sql = sql + " water = " + water + " , ";
                                    }

                                    if (weight) {
                                        updated = true;
                                        sql = sql + " weight = " + weight + " , ";
                                    }

                                    if (desc) {
                                        updated = true;
                                        sql = sql + " name = '" + desc.replace(/["']/g, "") + "' , ";
                                        // sql = sql + " name = '" + desc.replace('\'', '`') + "' , ";
                                    }

                                    if (feeling) {
                                        updated = true;
                                        sql = sql + " feeling = " + feeling + " , ";
                                    }

                                    sql = sql + " active = 1";

                                    if (updated == true) {
                                        sql =
                                            sql +
                                            " where location_id = " +
                                            locationid +
                                            " and equipment_id  = " +
                                            equipmentid +
                                            " and user_id = " +
                                            userid +
                                            " and DATE(timestamp) = DATE('" +
                                            timestamp +
                                            "')";

                                        console.log(sql);
                                        ppool.query(sql, function(err, rows) {

                                            if (rows.affectedRows > 0) {
                                                res.json({
                                                    code: 200,
                                                });
                                                return;
                                            } else {
                                                res.json({
                                                    code: 400,
                                                });
                                                return;

                                            }
                                        });
                                    } else {
                                        res.json({
                                            code: 204,
                                        });
                                        return;

                                    }
                                }
                            );
                        } else {
                            if (!desc) {
                                res.json({
                                    code: 400,
                                });
                                return;
                            }


                            var active = 1;

                            console.log("insert into activity(checkin,timestamp,user_id,score,calories,minutes, steps,distance, heart,checkout,duration,watts,water,weight,active,feeling,bmi,equipment_id,name,client_id,location_id) VALUES(" + checkedin + ",'" + timestamp + "'," + userid + "," + score + "," + calories + "," + minutes + "," + steps + "," + distance + "," + heart + "," + checkedout + "," + duration + "," + watts + "," + water + "," + weight + "," + active + "," + feeling + "," + bmi + "," + equipmentid + ",'" + desc + "'," + apiid + ",9999) ON CONFLICT (user_id, location_id, equipment_id, client_id, name, timestamp) DO UPDATE SET steps = " + steps + ", calories = " + calories + ", minutes = " + minutes + ", distance = " + distance + ", heart = " + heart + ", water = " + water + ", duration = " + duration + ", watts = " + watts + ", score = " + score + ", bmi = " + bmi);

                            ppool.query("insert into activity(checkin,timestamp,user_id,score,calories,minutes, steps,distance, heart,checkout,duration,watts,water,weight,active,feeling,bmi,equipment_id,name,client_id,location_id) VALUES(" + checkedin + ",'" + timestamp + "'," + userid + "," + score + "," + calories + "," + minutes + "," + steps + "," + distance + "," + heart + "," + checkedout + "," + duration + "," + watts + "," + water + "," + weight + "," + active + "," + feeling + "," + bmi + "," + equipmentid + ",'" + desc + "'," + apiid + ",9999) ON CONFLICT (user_id, location_id, equipment_id, client_id, name, timestamp) DO UPDATE SET steps = " + steps + ", calories = " + calories + ", minutes = " + minutes + ", distance = " + distance + ", heart = " + heart + ", water = " + water + ", duration = " + duration + ", watts = " + watts + ", score = " + score + ", bmi = " + bmi, function(err, rows, fields) {
                                // result = rows;



                                if (err != null) {
                                    console.log(err);
                                    res.json({
                                        code: 400,
                                    });
                                    return;

                                } else {

                                    res.json({
                                        code: 200,
                                    });
                                    return;

                                }

                            });
                        }
                    });
            }

        }
    );
}


function handle_hdn_post_bytoken_activities(req, res) {
    console.log("handle_hdn_post_bytoken_activities");
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var apikey = req.headers["x-api-key"];

        var token = req.body.token;
        var timestamp = req.body.timestamp;
        var equipmentid = req.body.equipmentid;
        var locationid = req.body.locationid;

        var score = req.body.score;
        var calories = req.body.calories;
        var minutes = req.body.minutes;
        var steps = req.body.steps;
        var distance = req.body.distance;
        var heart = req.body.heart;
        var checkedin = req.body.checkedin;
        var duration = req.body.duration;
        var watts = req.body.watts;
        var water = req.body.water;
        var weight = req.body.weight;
        var desc = req.body.desc;
        var feeling = req.body.feeling;

        if (!apikey) {
            res.json({
                code: 400,
                status: "Invalid API Key",
            });
            return;
        }

        // required fields
        if (!token || !timestamp || !equipmentid || !locationid) {
            res.json({
                code: 400,
            });
            return;
        }

        var apiid = 0;

        console.log("select * from ch_api where apikey = '" + apikey + "'");

        connection.query(
            "select * from ch_api where apikey = '" + apikey + "'",
            function(err, apirows) {
                if (apirows.length == 0) {
                    res.json({
                        code: 400,
                        status: "Invalid API Key",
                    });
                    return;
                } else {

                    apiid = apirows[0].id;

                    console.log("select * from users where token = '" + token + "'");

                    connection.query(
                        "select * from users where token = '" + token + "'",
                        function(err, userrows) {

                            if (userrows.length == 0) {
                                res.json({
                                    code: 404,
                                    status: "token not found",
                                });
                                return;
                            }

                            var userid = userrows[0].id;

                            // Daily combnations
                            if (equipmentid == 9999) {
                                console.log(
                                    "select * from ch_activities where location_id = " +
                                    locationid +
                                    " and equipment_id = " +
                                    equipmentid +
                                    " and user_id = " +
                                    userid +
                                    " and DATE(timestamp) = DATE('" +
                                    timestamp +
                                    "')"
                                );
                                connection.query(
                                    "select * from ch_activities where location_id = " +
                                    locationid +
                                    " and equipment_id  = " +
                                    equipmentid +
                                    " and user_id = " +
                                    userid +
                                    " and DATE(timestamp) = DATE('" +
                                    timestamp +
                                    "')",
                                    function(err, rows) {
                                        res.header("Access-Control-Allow-Origin", "*");
                                        res.header(
                                            "Access-Control-Allow-Methods",
                                            "GET,PUT,POST,DELETE"
                                        );
                                        res.header("Access-Control-Allow-Headers", "Content-Type");
                                        res.header(
                                            "Access-Control-Allow-Headers",
                                            "Content-Type, Authorization, Content-Length, X-Requested-With"
                                        );

                                        if (rows.length == 0) {
                                            console.log(
                                                "insert into ch_activities (client_id,user_id,timestamp,equipment_id,location_id) VALUES(" +
                                                apiid + "," + userid +
                                                ",'" +
                                                timestamp +
                                                "'," +
                                                equipmentid +
                                                "," +
                                                locationid +
                                                ")"
                                            );
                                            connection.query(
                                                "insert into ch_activities (client_id,user_id,timestamp,equipment_id,location_id) VALUES(" +
                                                apiid + "," + userid +
                                                ",'" +
                                                timestamp +
                                                "'," +
                                                equipmentid +
                                                "," +
                                                locationid +
                                                ")",
                                                function(err, rows) {}
                                            );
                                        }

                                        var sql = "update ch_activities set ";
                                        var updated = false;

                                        if (score) {
                                            updated = true;
                                            sql = sql + " score = " + score + " , ";
                                        }

                                        if (calories) {
                                            updated = true;
                                            sql = sql + " calories = " + calories + " , ";
                                        }

                                        if (minutes) {
                                            updated = true;
                                            sql = sql + " minutes = " + minutes + " , ";
                                        }

                                        if (steps) {
                                            updated = true;
                                            sql = sql + " steps = " + steps + " , ";
                                        }

                                        if (distance) {
                                            updated = true;
                                            sql = sql + " distance = " + distance + " , ";
                                        }

                                        if (heart) {
                                            updated = true;
                                            sql = sql + " heart = " + heart + " , ";
                                        }

                                        if (checkedin) {
                                            updated = true;
                                            sql = sql + " checkin = " + checkedin + " , ";
                                        }

                                        if (duration) {
                                            updated = true;
                                            sql = sql + " duration = " + duration + " , ";
                                        }

                                        if (watts) {
                                            updated = true;
                                            sql = sql + " watts = " + watts + " , ";
                                        }

                                        if (water) {
                                            updated = true;
                                            sql = sql + " water = " + water + " , ";
                                        }

                                        if (weight) {
                                            updated = true;
                                            sql = sql + " weight = " + weight + " , ";
                                        }

                                        if (desc) {
                                            updated = true;
                                            sql = sql + " name = '" + desc.replace('\'', '`') + "' , ";
                                        }

                                        if (feeling) {
                                            updated = true;
                                            sql = sql + " feeling = " + feeling + " , ";
                                        }

                                        sql = sql + " active = 1";

                                        if (updated == true) {
                                            sql =
                                                sql +
                                                " where location_id = " +
                                                locationid +
                                                " and equipment_id  = " +
                                                equipmentid +
                                                " and user_id = " +
                                                userid +
                                                " and DATE(timestamp) = DATE('" +
                                                timestamp +
                                                "')";

                                            console.log(sql);
                                            connection.query(sql, function(err, rows) {
                                                res.header("Access-Control-Allow-Origin", "*");
                                                res.header(
                                                    "Access-Control-Allow-Methods",
                                                    "GET,PUT,POST,DELETE"
                                                );
                                                res.header("Access-Control-Allow-Headers", "Content-Type");
                                                res.header(
                                                    "Access-Control-Allow-Headers",
                                                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                                                );

                                                if (rows.affectedRows > 0) {
                                                    res.json({
                                                        code: 200,
                                                    });
                                                } else {
                                                    res.json({
                                                        code: 400,
                                                    });
                                                }
                                            });
                                        } else {
                                            res.json({
                                                code: 204,
                                            });
                                        }
                                    }
                                );
                            } else {
                                if (!desc) {
                                    res.json({
                                        code: 400,
                                    });
                                    return;
                                }
                                console.log(
                                    "insert into ch_activities (client_id,user_id,timestamp,equipment_id,location_id) VALUES(" +
                                    apiid + "," + userid +
                                    ",'" +
                                    timestamp +
                                    "'," +
                                    equipmentid +
                                    "," +
                                    locationid +
                                    ")"
                                );
                                connection.query(
                                    "insert into ch_activities (client_id,user_id,timestamp,equipment_id,location_id) VALUES(" +
                                    apiid + "," + userid +
                                    ",'" +
                                    timestamp +
                                    "'," +
                                    equipmentid +
                                    "," +
                                    locationid +
                                    ")",
                                    function(err, result) {

                                        if (err) {
                                            res.json({
                                                code: 200,
                                            });
                                            return;
                                        }



                                        var newid = result.insertId;

                                        var sql = "update ch_activities set ";
                                        var updated = false;

                                        if (score) {
                                            updated = true;
                                            sql = sql + " score = " + score + " , ";
                                        }

                                        if (calories) {
                                            updated = true;
                                            sql = sql + " calories = " + calories + " , ";
                                        }

                                        if (minutes) {
                                            updated = true;
                                            sql = sql + " minutes = " + minutes + " , ";
                                        }

                                        if (steps) {
                                            updated = true;
                                            sql = sql + " steps = " + steps + " , ";
                                        }

                                        if (distance) {
                                            updated = true;
                                            sql = sql + " distance = " + distance + " , ";
                                        }

                                        if (heart) {
                                            updated = true;
                                            sql = sql + " heart = " + heart + " , ";
                                        }

                                        if (checkedin) {
                                            updated = true;
                                            sql = sql + " checkin = " + checkedin + " , ";
                                        }

                                        if (duration) {
                                            updated = true;
                                            sql = sql + " duration = " + duration + " , ";
                                        }

                                        if (watts) {
                                            updated = true;
                                            sql = sql + " watts = " + watts + " , ";
                                        }

                                        if (water) {
                                            updated = true;
                                            sql = sql + " water = " + water + " , ";
                                        }

                                        if (weight) {
                                            updated = true;
                                            sql = sql + " weight = " + weight + " , ";
                                        }

                                        if (desc) {
                                            updated = true;
                                            sql = sql + " name = '" + desc.replace('\'', '`') + "' , ";
                                            //sql = sql + " name = '" + desc + "' , ";
                                        }

                                        if (feeling) {
                                            updated = true;
                                            sql = sql + " feeling = " + feeling + " , ";
                                        }

                                        sql = sql + " active = 1";

                                        if (updated == true) {
                                            sql = sql + " where id = " + newid;

                                            console.log(sql);
                                            connection.query(sql, function(err, rows) {
                                                res.header("Access-Control-Allow-Origin", "*");
                                                res.header(
                                                    "Access-Control-Allow-Methods",
                                                    "GET,PUT,POST,DELETE"
                                                );
                                                res.header("Access-Control-Allow-Headers", "Content-Type");
                                                res.header(
                                                    "Access-Control-Allow-Headers",
                                                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                                                );

                                                if (rows.affectedRows > 0) {
                                                    res.json({
                                                        code: 200,
                                                    });
                                                } else {
                                                    res.json({
                                                        code: 400,
                                                    });
                                                }
                                            });
                                        } else {
                                            res.json({
                                                code: 204,
                                            });
                                        }
                                    }
                                );

                            }
                        });
                }

            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_post_activities(req, res) {
    console.log("handle_hdn_post_activities");
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var apikey = req.headers["x-api-key"];

        var userid = req.body.userid;
        var timestamp = req.body.timestamp;
        var equipmentid = req.body.equipmentid;
        var locationid = req.body.locationid;
        var count = req.body.count;
        var score = req.body.score;
        var calories = req.body.calories;
        var minutes = req.body.minutes;
        var steps = req.body.steps;
        var distance = req.body.distance;
        var heart = req.body.heart;
        var checkedin = req.body.checkedin;
        var duration = req.body.duration;
        var watts = req.body.watts;
        var water = req.body.water;
        var weight = req.body.weight;
        var desc = req.body.desc;
        var feeling = req.body.feeling;

        if (!apikey) {
            res.json({
                code: 400,
                status: "Invalid API Key",
            });
            return;
        }

        // required fields
        if (!userid || !timestamp || !equipmentid || !locationid) {
            res.json({
                code: 400,
            });
            return;
        }


        var apiid = 0;

        console.log("select * from ch_api where apikey = '" + apikey + "'");
        connection.query(
            "select * from ch_api where apikey = '" + apikey + "'",
            function(err, apirows) {
                if (apirows.length == 0) {
                    res.json({
                        code: 400,
                        status: "Invalid API Key",
                    });
                    return;
                } else {
                    apiid = apirows[0].id;
                    // Daily combnations
                    if (equipmentid == 9999) {
                        console.log(
                            "select * from ch_activities where location_id = " +
                            locationid +
                            " and equipment_id = " +
                            equipmentid +
                            " and user_id = " +
                            userid +
                            " and DATE(timestamp) = DATE('" +
                            timestamp +
                            "')"
                        );
                        connection.query(
                            "select * from ch_activities where location_id = " +
                            locationid +
                            " and equipment_id  = " +
                            equipmentid +
                            " and user_id = " +
                            userid +
                            " and DATE(timestamp) = DATE('" +
                            timestamp +
                            "')",
                            function(err, rows) {
                                res.header("Access-Control-Allow-Origin", "*");
                                res.header(
                                    "Access-Control-Allow-Methods",
                                    "GET,PUT,POST,DELETE"
                                );
                                res.header("Access-Control-Allow-Headers", "Content-Type");
                                res.header(
                                    "Access-Control-Allow-Headers",
                                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                                );

                                if (rows.length == 0) {
                                    console.log(
                                        "insert into ch_activities (client_id,user_id,timestamp,equipment_id,location_id) VALUES(" +
                                        apiid + "," + userid +
                                        ",'" +
                                        timestamp +
                                        "'," +
                                        equipmentid +
                                        "," +
                                        locationid +
                                        ")"
                                    );
                                    connection.query(
                                        "insert into ch_activities (client_id,user_id,timestamp,equipment_id,location_id) VALUES(" +
                                        apiid + "," + userid +
                                        ",'" +
                                        timestamp +
                                        "'," +
                                        equipmentid +
                                        "," +
                                        locationid +
                                        ")",
                                        function(err, rows) {}
                                    );
                                }

                                var sql = "update ch_activities set ";
                                var updated = false;

                                if (score) {
                                    updated = true;
                                    sql = sql + " score = " + score + " , ";
                                }

                                if (calories) {
                                    updated = true;
                                    sql = sql + " calories = " + calories + " , ";
                                }

                                if (minutes) {
                                    updated = true;
                                    sql = sql + " minutes = " + minutes + " , ";
                                }

                                if (steps) {
                                    updated = true;
                                    sql = sql + " steps = " + steps + " , ";
                                }

                                if (distance) {
                                    updated = true;
                                    sql = sql + " distance = " + distance + " , ";
                                }

                                if (heart) {
                                    updated = true;
                                    sql = sql + " heart = " + heart + " , ";
                                }

                                if (checkedin) {
                                    updated = true;
                                    sql = sql + " checkin = " + checkedin + " , ";
                                }

                                if (duration) {
                                    updated = true;
                                    sql = sql + " duration = " + duration + " , ";
                                }

                                if (watts) {
                                    updated = true;
                                    sql = sql + " watts = " + watts + " , ";
                                }

                                if (water) {
                                    updated = true;
                                    sql = sql + " water = " + water + " , ";
                                }

                                if (weight) {
                                    updated = true;
                                    sql = sql + " weight = " + weight + " , ";
                                }

                                if (desc) {
                                    updated = true;
                                    sql = sql + " name = '" + desc.replace('\'', '`') + "' , ";
                                    // sql = sql + " name = '" + desc + "' , ";
                                }

                                if (feeling) {
                                    updated = true;
                                    sql = sql + " feeling = " + feeling + " , ";
                                }

                                if (count) {
                                    updated = true;
                                    sql = sql + " count = " + count + " , ";
                                }

                                sql = sql + " active = 1";

                                if (updated == true) {
                                    sql =
                                        sql +
                                        " where location_id = " +
                                        locationid +
                                        " and equipment_id  = " +
                                        equipmentid +
                                        " and user_id = " +
                                        userid +
                                        " and DATE(timestamp) = DATE('" +
                                        timestamp +
                                        "')";

                                    console.log(sql);
                                    connection.query(sql, function(err, rows) {
                                        res.header("Access-Control-Allow-Origin", "*");
                                        res.header(
                                            "Access-Control-Allow-Methods",
                                            "GET,PUT,POST,DELETE"
                                        );
                                        res.header("Access-Control-Allow-Headers", "Content-Type");
                                        res.header(
                                            "Access-Control-Allow-Headers",
                                            "Content-Type, Authorization, Content-Length, X-Requested-With"
                                        );

                                        if (rows.affectedRows > 0) {
                                            res.json({
                                                code: 200,
                                            });
                                        } else {
                                            res.json({
                                                code: 400,
                                            });
                                        }
                                    });
                                } else {
                                    res.json({
                                        code: 204,
                                    });
                                }
                            }
                        );
                    } else {
                        if (!desc) {
                            res.json({
                                code: 400,
                            });
                            return;
                        }
                        console.log(
                            "insert into ch_activities (client_id,user_id,timestamp,equipment_id,location_id) VALUES(" +
                            apiid + "," + userid +
                            ",'" +
                            timestamp +
                            "'," +
                            equipmentid +
                            "," +
                            locationid +
                            ")"
                        );
                        connection.query(
                            "insert into ch_activities (client_id,user_id,timestamp,equipment_id,location_id) VALUES(" +
                            apiid + "," + userid +
                            ",'" +
                            timestamp +
                            "'," +
                            equipmentid +
                            "," +
                            locationid +
                            ")",
                            function(err, result) {
                                var newid = result.insertId;

                                var sql = "update ch_activities set ";
                                var updated = false;

                                if (score) {
                                    updated = true;
                                    sql = sql + " score = " + score + " , ";
                                }

                                if (calories) {
                                    updated = true;
                                    sql = sql + " calories = " + calories + " , ";
                                }

                                if (minutes) {
                                    updated = true;
                                    sql = sql + " minutes = " + minutes + " , ";
                                }

                                if (steps) {
                                    updated = true;
                                    sql = sql + " steps = " + steps + " , ";
                                }

                                if (distance) {
                                    updated = true;
                                    sql = sql + " distance = " + distance + " , ";
                                }

                                if (heart) {
                                    updated = true;
                                    sql = sql + " heart = " + heart + " , ";
                                }

                                if (checkedin) {
                                    updated = true;
                                    sql = sql + " checkin = " + checkedin + " , ";
                                }

                                if (duration) {
                                    updated = true;
                                    sql = sql + " duration = " + duration + " , ";
                                }

                                if (watts) {
                                    updated = true;
                                    sql = sql + " watts = " + watts + " , ";
                                }

                                if (water) {
                                    updated = true;
                                    sql = sql + " water = " + water + " , ";
                                }

                                if (weight) {
                                    updated = true;
                                    sql = sql + " weight = " + weight + " , ";
                                }

                                if (desc) {
                                    updated = true;


                                    sql = sql + " name = '" + desc.replace('\'', '`') + "' , ";
                                    // sql = sql + " name = '" + desc + "' , ";
                                }

                                if (feeling) {
                                    updated = true;
                                    sql = sql + " feeling = " + feeling + " , ";
                                }

                                if (count) {
                                    updated = true;
                                    sql = sql + " count = " + count + " , ";
                                }

                                sql = sql + " active = 1";

                                if (updated == true) {
                                    sql = sql + " where id = " + newid;

                                    console.log(sql);
                                    connection.query(sql, function(err, rows) {
                                        res.header("Access-Control-Allow-Origin", "*");
                                        res.header(
                                            "Access-Control-Allow-Methods",
                                            "GET,PUT,POST,DELETE"
                                        );
                                        res.header("Access-Control-Allow-Headers", "Content-Type");
                                        res.header(
                                            "Access-Control-Allow-Headers",
                                            "Content-Type, Authorization, Content-Length, X-Requested-With"
                                        );

                                        if (rows.affectedRows > 0) {
                                            res.json({
                                                code: 200,
                                            });
                                        } else {
                                            res.json({
                                                code: 400,
                                            });
                                        }
                                    });
                                } else {
                                    res.json({
                                        code: 204,
                                    });
                                }
                            }
                        );
                    }
                }
            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_login(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var fname = req.body.first_name;
        var lname = req.body.last_name;
        var memnum = req.body.memnum;

        console.log(
            "select * from users where fname = '" +
            fname +
            "' and lname = '" +
            lname +
            "' and memnum = '" +
            memnum +
            "'"
        );
        connection.query(
            "select * from users where fname = '" +
            fname +
            "' and lname = '" +
            lname +
            "' and memnum = '" +
            memnum +
            "'",
            function(err, rows) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.header(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                );

                if (rows.length == 0) {
                    res.json({
                        code: 404,
                    });
                } else {
                    res.json({
                        status: 200,
                        data: rows,
                    });
                }
            }
        );
        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function handle_hdn_geocode(req, res) {
    var geooptions = {
        provider: "google",

        // Optional depending on the providers
        httpAdapter: "https", // Default
        apiKey: "AIzaSyD2SdDKRTDSZ91wgvxJvnxaOiG35pYIunM", // for Mapquest, OpenCage, Google Premier
        formatter: null, // 'gpx', 'string', ...
    };

    var geocoder = NodeGeocoder(geooptions);

    var address = req.params.address;

    geocoder.geocode(address, function(error, response) {
        console.log(error);
        console.log(response);

        res.json(response);
    });
}

function handle_hdn_clubinfo(req, res) {
    var clubid = req.body.clubid;

    if (clubid === undefined) {
        clubid = 9003;
    }

    var date = Date.now();

    console.log(timestamp());

    var options = {
        method: "GET",
        port: 443,
        url: "https://api.abcfinancial.com/rest/" + clubid + "/clubs",
        timeout: 10000,
        headers: {
            app_id: "743e1a7d",
            app_key: "02645031beaed6462c10e6d20c6202c6",
            "Content-Type": "application/json",
            Accept: "application/json;charset=UTF-8",
        },
        // ,body: JSON.stringify({"prospects":[{"prospect":{"personal":{"memberId":barcode,"firstName":fname,"lastName":lname,"middleInitial":"","addressLine1":"","addressLine2":"","city":"","state":"","countryCode":"US","postalCode":"","email":email,"sendEmail":"false","primaryPhone":barcode,"mobilePhone":"","workPhone":"","workPhoneExt":"","barcode":barcode,"birthDate":birthday,"gender":"","employer":"","occupation":"","groupId":"","misc1":"","misc2":""},"agreement":{"referringMemberId":"","salesPersonId":"","campaignId":"","beginDate":"1997-08-13","expirationDate":"2016-12-28","issueDate":"1997-08-13","tourDate":"2016-12-28","visitsAllowed":"17","leadPriority":""},"note":{"text":note}}}]})
    };

    request(options, function(error, response) {
        if (error) throw new Error(error);
        res.json(response.body);
    });
}

function handle_hdn_prospect(req, res) {
    var fname = req.body.fname;
    var lname = req.body.lname;
    var phone = req.body.phone;
    var barcode = req.body.phone;
    var email = req.body.email;
    var birthday = req.body.birthday;
    var note = req.body.note;
    var clubid = req.body.clubid;

    if (clubid === undefined) {
        clubid = 9003;
    }

    barcode = "" + clubid + barcode;

    var date = Date.now();

    console.log(timestamp());

    var options = {
        method: "POST",
        port: 443,
        url: "https://api.abcfinancial.com/rest/" + clubid + "/prospects",
        timeout: 10000,
        headers: {
            app_id: "743e1a7d",
            app_key: "02645031beaed6462c10e6d20c6202c6",
            "Content-Type": "application/json",
            Accept: "application/json;charset=UTF-8",
        },
        body: JSON.stringify({
            prospects: [{
                prospect: {
                    personal: {
                        memberId: barcode,
                        firstName: fname,
                        lastName: lname,
                        middleInitial: "",
                        addressLine1: "",
                        addressLine2: "",
                        city: "",
                        state: "",
                        countryCode: "US",
                        postalCode: "",
                        email: email,
                        sendEmail: "false",
                        primaryPhone: phone,
                        mobilePhone: "",
                        workPhone: "",
                        workPhoneExt: "",
                        barcode: barcode,
                        birthDate: birthday,
                        gender: "",
                        employer: "",
                        occupation: "",
                        groupId: "",
                        misc1: "",
                        misc2: "",
                    },
                    agreement: {
                        referringMemberId: "",
                        salesPersonId: "",
                        campaignId: "",
                        beginDate: "1997-08-13",
                        expirationDate: "2016-12-28",
                        issueDate: "1997-08-13",
                        tourDate: "2016-12-28",
                        visitsAllowed: "17",
                        leadPriority: "",
                    },
                    note: {
                        text: note
                    },
                },
            }, ],
        }),
    };

    request(options, function(error, response) {
        if (error) throw new Error(error);
        res.json(response.body);
    });
}

function handle_hdn_member_validate_name(req, res) {
    var fname = req.body.fname;
    var lname = req.body.lname;
    var email = req.body.email;
    var memberid = req.body.memberid;
    var birthday = req.body.birthday;
    var deviceid = req.body.deviceid;
    var reference = req.body.reference;

    const token = crypto
        .createHash("sha256")
        .update(fname + lname + email)
        .digest("hex");

    res.json({
        code: 200,
        token: token,
    });
}

function handle_hdn_member_validate_token(req, res) {
    var token = req.body.token;
    var clubid = req.body.clubid;

    res.json({
        code: 200,
        token: token,
    });
}

function validateApiRequest(apikey) {
    var status = false;

    if (!apikey) {
        return false;
    }

    pool.getConnection(function(err, connection) {
        if (err) {
            status = false;
        }

        // Check for first time member
        console.log("select * from ch_api where apikey = '" + apikey + "'");

        connection.query(
            "select * from ch_api where apikey = '" + apikey + "'",
            function(err, rows) {
                if (rows.length == 0) {
                    // console.log("status = false");
                    status = false;
                } else {
                    // console.log("status = true");
                    status = true;
                }
                return status;
            }
        );

        // connection.release();

        // connection.on('error', function(err) {
        //     connection.release();
        //     console.log("ffalse");
        //     status =  false;
        // });

        //  console.log(status);
    });
}

function handle_stripe_cancel_subscription(req, res) {
    console.log('stripe_cancel_subscription:' + req.body);
    var subscriptionId = req.body.subscriptionId;

    stripe.subscriptions.del(
        subscriptionId,
        function(err, confirmation) {

            if (err) {
                res.json({
                    "code": 404,
                    "data": err
                });
            } else {
                res.json({
                    "code": 200,
                    "data": confirmation
                });
            }

        }
    );
}

function handle_plaid_account_transactions(req, res) {
    console.log('handle_plaid_account_transactions:' + req.body);
    var accessToken = req.body.accessToken;
    var startDate = req.body.start_date;
    var endDate = req.body.end_date;

    var options = {
        'method': 'POST',
        'url': plaid_url + '/transactions/get',
        'headers': {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "client_id": "5ea33b63155af90013f2f01a",
            "secret": "e1a83fcd94873ca2bf49000dff52fe",
            "access_token": accessToken,
            "start_date": startDate,
            "end_date": endDate
        })

    };
    request(options, function(error, response) {
        if (error) {
            res.json({
                "code": 404,
                "data": error
            });
            console.log(error);
        } else {

            var data = JSON.parse(response.body);

            res.json({
                "code": 200,
                "data": data
            });

            console.log(response.body);
        };
    });
}

function handle_plaid_account_balance(req, res) {
    console.log('handle_plaid_account_balance:' + req.body);
    var accessToken = req.body.accessToken;
    var account_id = req.body.account_id;

    var options = {
        'method': 'POST',
        'url': plaid_url + '/accounts/balance/get',
        'headers': {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "client_id": "5ea33b63155af90013f2f01a",
            "secret": "e1a83fcd94873ca2bf49000dff52fe",
            "access_token": accessToken,
            "options": {
                "account_ids": [account_id]
            }
        })

    };
    request(options, function(error, response) {
        if (error) {
            res.json({
                "code": 404,
                "data": error
            });
            console.log(error);
        } else {

            var data = JSON.parse(response.body);

            res.json({
                "code": 200,
                "data": data
            });

            console.log(response.body);
        };
    });
}

function handle_plaid_create_linked_account(req, res) {
    console.log('handle_plaid_create_linked_account:' + req.body);
    var accessToken = req.body.accessToken;
    var client_name = req.body.client_name;
    var client_user_id = req.body.client_user_id;

    var options = {
        'method': 'POST',
        'url': plaid_url + '/link/token/create',
        'headers': {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "client_id": "5ea33b63155af90013f2f01a",
            "secret": "e1a83fcd94873ca2bf49000dff52fe",
            "client_name": client_name,
            "user": {
                "client_user_id": client_user_id
            },
            "products": ["auth"],
            "country_codes": ["US"],
            "language": "en"
        })

    };
    request(options, function(error, response) {
        if (error) {
            res.json({
                "code": 404,
                "data": error
            });
            console.log(error);
        } else {

            var data = JSON.parse(response.body);

            res.json({
                "code": 200,
                "link_token": data.link_token,
                "request_id": data.request_id
            });

            console.log(response.body);
        };
    });
}


function handle_plaid_processor_token(req, res) {
    console.log('handle_plaid_processor_token:' + req.body);
    var accessToken = req.body.accessToken;
    var bank_account = req.body.bank_account;


    var options = {
        'method': 'POST',
        'url': 'https://sandbox.plaid.com/processor/stripe/bank_account_token/create',
        'headers': {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "client_id": "5ea33b63155af90013f2f01a",
            "secret": "e1a83fcd94873ca2bf49000dff52fe",
            "access_token": accessToken,
            "account_id": bank_account
        })

    };
    request(options, function(error, response) {
        if (error) {
            res.json({
                "code": 404,
                "data": error
            });
            console.log(error);
        } else {

            var data = JSON.parse(response.body);

            res.json({
                "code": 200,
                "stripe_bank_account_token": data.stripe_bank_account_token,
                "request_id": data.request_id
            });

            console.log(response.body);
        };
    });
}

function handle_plaid_create_customer(req, res) {
    console.log('stripe_create_customer:' + req.body);

    var email = req.body.email;
    var name = req.body.name;

    stripePlaid.customers.create({
            email: email,
            name: name
        })
        .then((data) => {
            res.json({
                "code": 200,
                "data": data
            });
        })
        .catch((error) => {
            console.error(error);
            res.json({
                "code": 404,
                "data": error
            });
        })
}

function handle_plaid_exchange_token(req, res) {
    console.log('handle_plaid_exchange_token:' + req.body);
    var accessToken = req.body.accessToken;
    var email = req.body.email;
    var password = req.body.password;


    var options = {
        'method': 'POST',
        'url': plaid_url + '/item/public_token/exchange',
        'headers': {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "client_id": "5ea33b63155af90013f2f01a",
            "secret": "e1a83fcd94873ca2bf49000dff52fe",
            "public_token": accessToken
        })

    };
    request(options, function(error, response) {
        if (error) {
            res.json({
                "code": 404,
                "data": error
            });
            console.log(error);
        } else {

            var data = JSON.parse(response.body);

            res.json({
                "code": 200,
                "access_token": data.access_token,
                "item_id": data.item_id,
                "request_id": data.request_id
            });

            console.log(response.body);
        };
    });
}

function handle_stripe_create_invoice(req, res) {
    console.log('stripe_create_invoice:' + req.body);
    var customerId = req.body.customerId;
    var productId = req.body.productId;
    var priceId;
    var found = false;

    //Find the price for the product
    stripe.prices.list(

        function(err, prices) {
            var resjson = prices.data;

            resjson.forEach(function(price) {
                if (price.product == productId) {
                    priceId = price.id;
                    found = true;
                }
            });

            if (found == false) {
                res.json({
                    "code": 404
                });
            }


            stripe.subscriptions.list({
                    customer: customerId
                },
                function(err, subscriptions) {

                    console.log(subscriptions);
                    console.log(subscriptions.data.length);

                    if (subscriptions.data.length == 0) {
                        stripe.subscriptions.create({
                                customer: customerId,
                                items: [{
                                    price: priceId
                                }, ],
                            },
                            function(err, invoice) {
                                if (err) {
                                    res.json({
                                        "code": 404,
                                        "data": err
                                    });
                                } else {
                                    res.json({
                                        "code": 200,
                                        "data": invoice
                                    });
                                }

                            }
                        );
                    } else {

                        res.json({
                            "code": 404,

                        });
                    }

                }
            );

        }
    );

}


function handle_stripe_create_bank_account(req, res) {
    console.log('handle_stripe_create_bank_account:' + req.body);

    var bank_account = req.body.bank_account;

    stripe.tokens.create({
            bank_account: {
                country: 'US',
                currency: 'usd',
                account_number: bank_account,
            },
        })
        .then((data) => {
            res.json({
                "code": 200,
                "data": data
            });
        })
        .catch((error) => {
            console.error(error);
            res.json({
                "code": 404,
                "data": error
            });
        })
}

function handle_stripe_terms_and_conditions(req, res) {
    console.log('handle_stripe_terms_and_conditions:' + req.body);
    var account_id = req.body.account_id;


    stripePlaid.accounts.update(
            account_id, {
                tos_acceptance: {
                    date: Math.floor(Date.now() / 1000),
                    ip: req.connection.remoteAddress, // Assumes you're not using a proxy
                },
            })
        .then((data) => {
            res.json({
                "code": 200,
                "data": data
            });
        })
        .catch((error) => {
            console.error(error);
            res.json({
                "code": 404,
                "data": error
            });
        })


}

function handle_stripe_create_external_bank_account(req, res) {
    console.log('handle_stripe_create_external_bank_account:' + req.body);

    var bank_token = req.body.bank_token;
    var email = req.body.email;

    stripePlaid.accounts.create({
            type: 'custom',
            country: 'US',
            email: email,
            capabilities: {
                transfers: {
                    requested: true
                },
            },



            business_profile: {
                url: 'https://conciergehealth.co'
            },

            individual: {
                first_name: 'Troy',
                last_name: 'Simon',
                ssn_last_4: '4216',
                dob: {
                    day: 4,
                    month: 10,
                    year: 1965
                },
            },

            business_type: 'individual',
            external_account: bank_token


        })
        .then((data) => {
            res.json({
                "code": 200,
                "data": data
            });
        })
        .catch((error) => {
            console.error(error);
            res.json({
                "code": 404,
                "data": error
            });
        })
}

function handle_stripe_create_bank_account(req, res) {
    console.log('handle_stripe_create_bank_account:' + req.body);

    var bank_account = req.body.bank_account;

    stripe.tokens.create({
            bank_account: {
                country: 'US',
                currency: 'usd',
                account_number: bank_account,
            },
        })
        .then((data) => {
            res.json({
                "code": 200,
                "data": data
            });
        })
        .catch((error) => {
            console.error(error);
            res.json({
                "code": 404,
                "data": error
            });
        })
}

function handle_stripe_create_customer(req, res) {
    console.log('stripe_create_customer:' + req.body);

    var email = req.body.email;
    var name = req.body.name;

    stripe.customers.create({
            email: email,
            name: name
        })
        .then((data) => {
            res.json({
                "code": 200,
                "data": data
            });
        })
        .catch((error) => {
            console.error(error);
            res.json({
                "code": 404,
                "data": error
            });
        })
}

function handle_stripe_customer_subscriptions(req, res) {
    console.log('stripe_subscriptions:' + req.body);
    var customerId = req.body.customerId;

    stripe.subscriptions.list({
            customer: customerId
        },

        function(err, subscriptions) {

            if (err) {
                res.json({
                    "code": 404,
                    "data": err
                });
            } else {
                res.json({
                    "code": 200,
                    "data": subscriptions
                });
            }
        }
    );

}

function handle_stripe_subscriptions(req, res) {
    console.log('stripe_subscriptions:' + req.body);

    stripe.products.list(
        function(err, subscriptions) {

            if (err) {
                res.json({
                    "code": 404,
                    "data": err
                });
            } else {
                res.json({
                    "code": 200,
                    "data": subscriptions
                });
            }
        }
    );

}

function handle_stripe_customer_payment_method(req, res) {
    console.log('stripe_customer_payment_method:' + req.body);
    var customerID = req.body.customerID;

    stripe.paymentMethods.list({
            customer: customerID,
            type: 'card'
        },

        function(err, subscriptions) {

            if (err) {
                res.json({
                    "code": 404,
                    "data": err
                });
            } else {
                res.json({
                    "code": 200,
                    "data": subscriptions
                });
            }
        }
    );

}


function handle_stripe_create_payment_method(req, res) {
    console.log('stripe_create_payment_method:' + req.body);

    var customerID = req.body.customerID;
    var card = req.body.card;
    var expMonth = req.body.expMonth;
    var expYear = req.body.expYear;
    var cvc = req.body.cvc;

    var paymentmethod;
    var paymentattach;
    var customer;

    stripe.paymentMethods.create({
            type: 'card',
            card: {
                number: card,
                exp_month: expMonth,
                exp_year: expYear,
                cvc: cvc,
            },
        })
        .then((data) => {
            paymentmethod = data;
            console.log(data);
            return stripe.paymentMethods.attach(
                    paymentmethod.id, {
                        customer: customerID
                    })
                .catch((error) => {
                    console.error(error);
                    res.json({
                        "code": 404,
                        "data": error
                    });
                    return;
                })

                .then((data) => {
                    paymentattach = data;
                    console.log(data);
                    return stripe.customers.update(
                            customerID, {
                                invoice_settings: {
                                    default_payment_method: paymentmethod.id
                                }
                            },

                        )
                        .catch((error) => {
                            console.error(error);
                            res.json({
                                "code": 404,
                                "data": error
                            });
                            return;
                        })

                        .then((data) => {
                            customer = data;
                            console.log(data);
                            res.json({
                                "code": 200,
                                "data": data
                            });

                        })

                })


        })
        .catch((error) => {
            console.error(error);
            res.json({
                "code": 404,
                "data": error
            });
        })
}


function handle_hdn_post_byemail_activities(req, res) {
    //console.log("handle_hdn_post_byemail_activities");
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                code: 100,
                status: err,
            });

            return;
        }

        var apikey = req.headers["x-api-key"];

        var token = req.body.token;
        var timestamp = req.body.timestamp;
        var equipmentid = req.body.equipmentid;
        var locationid = req.body.locationid;

        var score = req.body.score;
        var calories = req.body.calories;
        var minutes = req.body.minutes;
        var steps = req.body.steps;
        var distance = req.body.distance;
        var heart = req.body.heart;
        var checkedin = req.body.checkedin;
        var duration = req.body.duration;
        var watts = req.body.watts;
        var water = req.body.water;
        var weight = req.body.weight;
        var desc = req.body.desc;
        var feeling = req.body.feeling;

        if (!apikey) {
            res.json({
                code: 400,
                status: "Invalid API Key",
            });
            return;
        }

        // required fields
        if (!token || !timestamp || !equipmentid || !locationid) {
            res.json({
                code: 400,
            });
            return;
        }

        var apiid = 0;

        //console.log("select * from ch_api where apikey = '" + apikey + "'");

        connection.query(
            "select * from ch_api where apikey = '" + apikey + "'",
            function(err, apirows) {
                if (apirows.length == 0) {
                    res.json({
                        code: 400,
                        status: "Invalid API Key",
                    });
                    return;
                } else {

                    apiid = apirows[0].id;

                    //console.log("select * from users where '" + token + "' = echelon_id limit 1");

                    connection.query(
                        "select * from users where '" + token + "' = echelon_id limit 1",
                        function(err, userrows) {

                            if (userrows.length == 0) {
                                res.json({
                                    code: 404,
                                    status: "token not found",
                                });
                                return;
                            }

                            var userid = userrows[0].id;

                            // Daily combnations
                            if (equipmentid == 9999) {
                                console.log(
                                    "select * from ch_activities where location_id = " +
                                    locationid +
                                    " and equipment_id = " +
                                    equipmentid +
                                    " and user_id = " +
                                    userid +
                                    " and DATE(timestamp) = DATE('" +
                                    timestamp +
                                    "')"
                                );
                                connection.query(
                                    "select * from ch_activities where location_id = " +
                                    locationid +
                                    " and equipment_id  = " +
                                    equipmentid +
                                    " and user_id = " +
                                    userid +
                                    " and DATE(timestamp) = DATE('" +
                                    timestamp +
                                    "')",
                                    function(err, rows) {
                                        res.header("Access-Control-Allow-Origin", "*");
                                        res.header(
                                            "Access-Control-Allow-Methods",
                                            "GET,PUT,POST,DELETE"
                                        );
                                        res.header("Access-Control-Allow-Headers", "Content-Type");
                                        res.header(
                                            "Access-Control-Allow-Headers",
                                            "Content-Type, Authorization, Content-Length, X-Requested-With"
                                        );

                                        if (rows.length == 0) {
                                            console.log(
                                                "insert into ch_activities (client_id,user_id,timestamp,equipment_id,location_id) VALUES(" +
                                                apiid + "," + userid +
                                                ",'" +
                                                timestamp +
                                                "'," +
                                                equipmentid +
                                                "," +
                                                locationid +
                                                ")"
                                            );
                                            connection.query(
                                                "insert into ch_activities (client_id,user_id,timestamp,equipment_id,location_id) VALUES(" +
                                                apiid + "," + userid +
                                                ",'" +
                                                timestamp +
                                                "'," +
                                                equipmentid +
                                                "," +
                                                locationid +
                                                ")",
                                                function(err, rows) {}
                                            );
                                        }

                                        var sql = "update ch_activities set ";
                                        var updated = false;

                                        if (score) {
                                            updated = true;
                                            sql = sql + " score = " + score + " , ";
                                        }

                                        if (calories) {
                                            updated = true;
                                            sql = sql + " calories = " + calories + " , ";
                                        }

                                        if (minutes) {
                                            updated = true;
                                            sql = sql + " minutes = " + minutes + " , ";
                                        }

                                        if (steps) {
                                            updated = true;
                                            sql = sql + " steps = " + steps + " , ";
                                        }

                                        if (distance) {
                                            updated = true;
                                            sql = sql + " distance = " + distance + " , ";
                                        }

                                        if (heart) {
                                            updated = true;
                                            sql = sql + " heart = " + heart + " , ";
                                        }

                                        if (checkedin) {
                                            updated = true;
                                            sql = sql + " checkin = " + checkedin + " , ";
                                        }

                                        if (duration) {
                                            updated = true;
                                            sql = sql + " duration = " + duration + " , ";
                                        }

                                        if (watts) {
                                            updated = true;
                                            sql = sql + " watts = " + watts + " , ";
                                        }

                                        if (water) {
                                            updated = true;
                                            sql = sql + " water = " + water + " , ";
                                        }

                                        if (weight) {
                                            updated = true;
                                            sql = sql + " weight = " + weight + " , ";
                                        }

                                        if (desc) {
                                            updated = true;
                                            sql = sql + " name = '" + desc + "' , ";
                                        }

                                        if (feeling) {
                                            updated = true;
                                            sql = sql + " feeling = " + feeling + " , ";
                                        }

                                        sql = sql + " active = 1";

                                        if (updated == true) {
                                            sql =
                                                sql +
                                                " where location_id = " +
                                                locationid +
                                                " and equipment_id  = " +
                                                equipmentid +
                                                " and user_id = " +
                                                userid +
                                                " and DATE(timestamp) = DATE('" +
                                                timestamp +
                                                "')";

                                            console.log(sql);
                                            connection.query(sql, function(err, rows) {
                                                res.header("Access-Control-Allow-Origin", "*");
                                                res.header(
                                                    "Access-Control-Allow-Methods",
                                                    "GET,PUT,POST,DELETE"
                                                );
                                                res.header("Access-Control-Allow-Headers", "Content-Type");
                                                res.header(
                                                    "Access-Control-Allow-Headers",
                                                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                                                );

                                                if (rows.affectedRows > 0) {
                                                    res.json({
                                                        code: 200,
                                                    });
                                                } else {
                                                    res.json({
                                                        code: 400,
                                                    });
                                                }
                                            });
                                        } else {
                                            res.json({
                                                code: 204,
                                            });
                                        }
                                    }
                                );
                            } else {
                                if (!desc) {
                                    res.json({
                                        code: 400,
                                    });
                                    return;
                                }
                                console.log(
                                    "insert into ch_activities (client_id,user_id,timestamp,equipment_id,location_id) VALUES(" +
                                    apiid + "," + userid +
                                    ",'" +
                                    timestamp +
                                    "'," +
                                    equipmentid +
                                    "," +
                                    locationid +
                                    ")"
                                );
                                connection.query(
                                    "insert into ch_activities (client_id,user_id,timestamp,equipment_id,location_id) VALUES(" +
                                    apiid + "," + userid +
                                    ",'" +
                                    timestamp +
                                    "'," +
                                    equipmentid +
                                    "," +
                                    locationid +
                                    ")",
                                    function(err, result) {

                                        if (err) {
                                            res.json({
                                                code: 200,
                                            });
                                            return;
                                        }


                                        var newid = result.insertId;

                                        var sql = "update ch_activities set ";
                                        var updated = false;

                                        if (score) {
                                            updated = true;
                                            sql = sql + " score = " + score + " , ";
                                        }

                                        if (calories) {
                                            updated = true;
                                            sql = sql + " calories = " + calories + " , ";
                                        }

                                        if (minutes) {
                                            updated = true;
                                            sql = sql + " minutes = " + minutes + " , ";
                                        }

                                        if (steps) {
                                            updated = true;
                                            sql = sql + " steps = " + steps + " , ";
                                        }

                                        if (distance) {
                                            updated = true;
                                            sql = sql + " distance = " + distance + " , ";
                                        }

                                        if (heart) {
                                            updated = true;
                                            sql = sql + " heart = " + heart + " , ";
                                        }

                                        if (checkedin) {
                                            updated = true;
                                            sql = sql + " checkin = " + checkedin + " , ";
                                        }

                                        if (duration) {
                                            updated = true;
                                            sql = sql + " duration = " + duration + " , ";
                                        }

                                        if (watts) {
                                            updated = true;
                                            sql = sql + " watts = " + watts + " , ";
                                        }

                                        if (water) {
                                            updated = true;
                                            sql = sql + " water = " + water + " , ";
                                        }

                                        if (weight) {
                                            updated = true;
                                            sql = sql + " weight = " + weight + " , ";
                                        }

                                        if (desc) {
                                            updated = true;
                                            //  sql = sql + " name = '" + desc + "' , ";
                                            sql = sql + " name = '" + desc.replace('\'', '`') + "' , ";
                                        }

                                        if (feeling) {
                                            updated = true;
                                            sql = sql + " feeling = " + feeling + " , ";
                                        }

                                        sql = sql + " active = 1";

                                        if (updated == true) {
                                            sql = sql + " where id = " + newid;

                                            console.log(sql);
                                            connection.query(sql, function(err, rows) {
                                                res.header("Access-Control-Allow-Origin", "*");
                                                res.header(
                                                    "Access-Control-Allow-Methods",
                                                    "GET,PUT,POST,DELETE"
                                                );
                                                res.header("Access-Control-Allow-Headers", "Content-Type");
                                                res.header(
                                                    "Access-Control-Allow-Headers",
                                                    "Content-Type, Authorization, Content-Length, X-Requested-With"
                                                );

                                                if (rows.affectedRows > 0) {
                                                    res.json({
                                                        code: 200,
                                                    });
                                                } else {
                                                    res.json({
                                                        code: 400,
                                                    });
                                                }
                                            });
                                        } else {
                                            res.json({
                                                code: 204,
                                            });
                                        }
                                    }
                                );

                            }
                        });
                }

            }
        );

        connection.release();

        connection.on("error", function(err) {
            connection.release();
            res.json({
                code: 100,
                status: err,
            });

            return;
        });
    });
}

function findGymPassUser(member_id, callback) {
    console.log("select * from public.user join member_program  on member_program.user_id = public.user.id where member_program.membership = '" + member_id + 
    "' and member_program.program_id = 76");

    ppool.query("select * from public.user join member_program  on member_program.user_id = public.user.id where member_program.membership = '" + member_id + 
    "' and member_program.program_id = 76",
        function(err, apirows) {

            if (err) {
                callback(null);
            }


            if (apirows.rows.length > 0) {
                callback(apirows.rows[0]);
            } else {
                callback(null);
            }
        });
}

function findGymPassLocation(location_id, callback) {
    console.log("select * from locations where gympass_id = " + location_id);
    ppool.query("select * from locations where gympass_id = " + location_id,
        function(err, apirows) {

            if (err) {
                callback(null);
            }


            if (apirows.rows.length > 0) {
                callback(apirows.rows[0]);
            } else {
                callback(null);
            }
        });
}


function findUser(member_id, callback) {
    console.log("select * from public.user where id = " + member_id);
    ppool.query("select * from public.user where id = " + member_id,
        function(err, apirows) {

            if (err) {
                callback(null);
            }


            if (apirows.rows.length > 0) {
                callback(apirows.rows[0]);
            } else {
                callback(null);
            }
        });
}

function findAllLocations(parent_id, callback) {
    console.log("select * from locations where parent_id = " + parent_id + " or id = " + parent_id);
    ppool.query("select * from locations where parent_id = " + parent_id + " or id = " + parent_id,
        function(err, apirows) {

            if (err) {
                callback(-1);
            }


            if (apirows.rows.length > 0) {
                callback(apirows.rows);
            } else {
                callback(null);
            }
        });
}

function findLocation(location_id, callback) {
    console.log("select * from locations where id = '" + location_id + "'");
    ppool.query("select * from locations where id = '" + location_id + "'",
        function(err, apirows) {

            if (err) {
                callback(null);
            }


            if (apirows.rows.length > 0) {
                callback(apirows.rows[0]);
            } else {
                callback(null);
            }
        });
}

function findCompany(company_id, callback) {
    console.log("select * from company where id = " + company_id);
    ppool.query("select * from company where id = " + company_id,
        function(err, apirows) {

            if (err) {
                callback(null);
            }


            if (apirows.rows.length > 0) {
                callback(apirows.rows[0]);
            } else {
                callback(null);
            }
        });
}

function findLocationProgram(location_id, program_id, callback) {
    console.log("select company_program.*,company_program_tier.name as tier,company_program_sector.name as sector from company_program left join company_program_sector on company_program_sector.id =  company_program.sector_id left join company_program_tier on company_program_tier.id =  company_program.tier_id where company_program.status = 1 and location_id = " + location_id); // + " and program_id =" + program_id
    ppool.query("select company_program.*,company_program_tier.name as tier,company_program_sector.name as sector from company_program left join company_program_sector on company_program_sector.id =  company_program.sector_id left join company_program_tier on company_program_tier.id =  company_program.tier_id where company_program.status = 1 and location_id = " + location_id,
        function(err, apirows) {

            if (err) {
                callback(null);
            }


            if (apirows.rows.length > 0) {
                callback(apirows.rows);
            } else {
                callback(null);
            }
        });
}

function findCompanyProgram(company_id, program_id, callback) {
    console.log("select * from company_program where status = 1 and location_id = -1 and company_id = " + company_id + " and program_id =" + program_id);
    ppool.query("select * from company_program where status = 1 and location_id = -1 and company_id = " + company_id + " and program_id =" + program_id,
        function(err, apirows) {

            if (err) {
                callback(null);
            }


            if (apirows.rows.length > 0) {
                callback(apirows.rows[0]);
            } else {
                callback(null);
            }
        });
}

function memberMonthlyCheckinsLocationProgram(member_id, location_id, program_id, callback) {
    console.log("select count(*) as count from checkin_history where user_id = " + member_id + " and  location_id IN ( " + location_id + ") and program_id =" + program_id + " and date_trunc('month', timestamp) = date_trunc('month', current_date)  and date_trunc('month', timestamp) = date_trunc('month', current_date)");
    ppool.query("select count(*) as count from checkin_history where user_id = " + member_id + " and  location_id IN (" + location_id + ") and program_id =" + program_id + " and date_trunc('month', timestamp) = date_trunc('month', current_date)  and date_trunc('month', timestamp) = date_trunc('month', current_date)",
        function(err, apirows) {

            if (err) {
                callback(null);
            }


            if (apirows.rows.length > 0) {
                callback(apirows.rows[0].count);
            } else {
                callback(null);
            }
        });
}

function memberMonthlyCheckinsCompanyProgram(member_id, company_id, program_id, callback) {
    console.log("select count(*) as count from checkin_history join locations on locations.id = checkin_history.location_id where locations.company_id = " + company_id + " and date_trunc('month', timestamp) = date_trunc('month', current_date)  and date_trunc('month', timestamp) = date_trunc('month', current_date) and checkin_history.program_id = " + program_id + " and checkin_history.user_id =" + member_id);
    ppool.query("select count(*) as count from checkin_history join locations on locations.id = checkin_history.location_id where locations.company_id = " + company_id + " and date_trunc('month', timestamp) = date_trunc('month', current_date)  and date_trunc('month', timestamp) = date_trunc('month', current_date) and checkin_history.program_id = " + program_id + " and checkin_history.user_id = " + member_id,
        function(err, apirows) {

            if (err) {
                callback(null);
            }


            if (apirows.rows.length > 0) {
                callback(apirows.rows[0].count);
            } else {
                callback(null);
            }
        });
}


function handle_checkin_optum_eligibility(req, res) {
    console.log("handle_checkin_optum_eligibility");

    var location_id = req.body.location_id;
    var program_id = req.body.program_id;
    var member_id = req.body.member_id;
    var code = req.body.code.toUpperCase();

    // get the program for the location
    var member_chekins = 0;
    var program;
    var member;
    var location;
    var location_parent = -99999
    var locations;
    var company;

    var locationIDS = "";


    if (!location_id || !program_id || !member_id || !code) {
        res.json({
            code: 400,
        });
        return;
    }


    // Production: https://ogee.int.werally.in
    var options = {
        'method': 'GET',
        'url': 'https://ogee.werally.com/rest/pass-edge/v1/members/code/' + code,
        'headers': {
            'X-OnePass-API-Key': 'HhTWL4vaCb1sftDvQkPJqAtc51pkH2rP',
            'X-OnePass-ClientKey': 'Partner-concierge_health',
            'Content-Type': 'application/json'
        }
    };

    // Dev
    // var options = {
    //     'method': 'GET',
    //     'url': 'https://ogee.int.werally.in/rest/pass-edge/v1/members/code/' + code,
    //     'headers': {
    //         'X-OnePass-API-Key': 'qAf36sfXEv7YzXmaWGmEe6s54wtmfe0k',
    //         'X-OnePass-ClientKey': 'Partner-concierge_health',
    //         'Content-Type': 'application/json'
    //     }
    // };

    request(options, function(error, response) {

        if (error) {
            return res.json({
                code: 500,
                status: error,
            });
        }

        var a = "insert into log (data) values ('" + response.body + "')";
        console.log(a);
        ppool.query(a, function(err, client_rows) {});

        var data = JSON.parse(response.body);
        var insuranceData = data;
        console.log(data)

        if (data.memberStatus == "active") {

            // Find the member
            findUser(member_id, function(data) {

                if (data == null) {
                    return res.json({
                        code: 404,
                        status: 'Member not found',
                    });
                }

                member = data;
                console.log(member);

                // Find the location
                findLocation(location_id, function(data) {

                    if (data == null) {
                        return res.json({
                            code: 404,
                            status: 'Location not found',
                        });
                    }

                    location = data;


                    if (location.parent_id == -1) {
                        location_parent = location.id;
                    } else {
                        location_parent = location.parent_id;
                    }


                    console.log(location);


                    findCompany(location.company_id, function(data) {

                        if (data == null) {
                            return res.json({
                                code: 404,
                                status: 'Program for location not found',
                            });
                        }

                        company = data;
                        console.log(company);


                        // Is this a master slave
                        findAllLocations(location_parent, function(data) {

                            if (data == null) {
                                return res.json({
                                    code: 404,
                                    status: 'Program for location not found',
                                });
                            }

                            locations = data;

                            for (let location of locations) {
                                locationIDS = locationIDS + location.id + ",";
                            }

                            locationIDS = locationIDS.substring(0, locationIDS.length - 1);

                            console.log(locationIDS);

                            findCompanyProgram(location.company_id, program_id, function(data) {

                                program = data;
                                console.log(program);


                                if (program == null) {

                                    findLocationProgram(location_id, program_id, function(data) {
                                        if (data == null) {
                                            return res.json({
                                                code: 404,
                                                status: 'Program for location/company not found',
                                            });
                                        }

                                        program = data;
                                        // console.log(program);

                                        var foundMemberMatch = false;

                                        // console.log("=======================================================================================================================================");
                                        // console.log(insuranceData);
                                        // console.log("=======================================================================================================================================");


                                        for (var i = 0; i < program.length; i++) {
                                            var row = program[i];

                                            if (row.tier == insuranceData.tierName && row.sector == insuranceData.serviceSector) {
                                                foundMemberMatch = true;
                                                program = row;
                                                break;
                                            }

                                            console.log(row);
                                        }


                                        if (!foundMemberMatch) {

                                            var error = '';

                                            if (data.serviceSector == 'Medicare/Medicaid') {
                                                error = 'It appears you are an eligible Renew Active member, but not eligible for this location. Please call the Customer Service phone number on your health plan member ID card and they will be glad to assist you.';
                                            } else {
                                                error = 'It appears you are an eligible One Pass member, but not eligible for this location. Please call the One Pass team at 877-504-6830 and they will be glad to assist you.';
                                            }

                                            return res.json({
                                                code: 204,
                                                status: error,
                                            });

                                        }
                                        console.log("=======================================================================================================================================");

                                        memberMonthlyCheckinsLocationProgram(member_id, locationIDS, program_id, function(data) {

                                            if (data == null) {
                                                return res.json({
                                                    code: 404,
                                                    status: 'Program for location not found',
                                                });
                                            }

                                            member_chekins = parseInt(data);

                                            console.log(member_chekins);

                                            if (program.allowance == 0) {
                                                console.log("insert into checkin_history (user_id,location_id,program_id,checkin) VALUES(" + member_id + "," + location_id + "," + program_id + ",1)");
                                                ppool.query("insert into checkin_history (user_id,location_id,program_id,checkin) VALUES(" + member_id + "," + location_id + "," + program_id + ",1)",
                                                    function(err, apirows) {

                                                        if (err) {
                                                            callback(null);
                                                        }

                                                        console.log("update public.user set eligibility_status = 'Eligible' where id = " + member_id);
                                                        ppool.query("update public.user set eligibility_status = 'Eligible' where id = " + member_id,
                                                            function(err, apirows) {});

                                                        return res.json({
                                                            code: 200,
                                                            status: "You have checked in!",
                                                        });

                                                    });

                                            } else if ((member_chekins + 1) > program.allowance) {
                                                // BAD
                                                return res.json({
                                                    code: 204,
                                                    status: "You have exceeded the allotted maximum visits this month at this location for your fitness offering. Talk to the front desk staff if you would like more visits at this club this month.",
                                                });
                                            } else {
                                                // GOOD
                                                console.log("insert into checkin_history (user_id,location_id,program_id,checkin) VALUES(" + member_id + "," + location_id + "," + program_id + ",1)");
                                                ppool.query("insert into checkin_history (user_id,location_id,program_id,checkin) VALUES(" + member_id + "," + location_id + "," + program_id + ",1)",
                                                    function(err, apirows) {

                                                        if (err) {
                                                            callback(null);
                                                        }

                                                        if ((member_chekins + 1) == program.allowance) {
                                                            return res.json({
                                                                code: 200,
                                                                status: "Congrats! You have met your maximum visits this month for your fitness offering. Talk to the front desk staff if you would like more visits at this club this month.",
                                                            });

                                                        } else {
                                                            return res.json({
                                                                code: 200,
                                                                status: "You have used " + (member_chekins + 1) + " of " + program.allowance + " checkins"
                                                            });
                                                        }

                                                    });
                                            }
                                        }); //memberMonthlyCheckinsLocationProgram
                                    }); //findLocationProgram

                                } else {


                                    memberMonthlyCheckinsCompanyProgram(member_id, location.company_id, program_id, function(data) {

                                        if (data == null) {
                                            return res.json({
                                                code: 404,
                                                status: 'Program for location not found',
                                            });
                                        }

                                        member_chekins = parseInt(data);

                                        console.log(member_chekins);
                                        if (program.allowance == 0) {
                                            console.log("insert into checkin_history (user_id,location_id,program_id,checkin) VALUES(" + member_id + "," + location_id + "," + program_id + ",1)");
                                            ppool.query("insert into checkin_history (user_id,location_id,program_id,checkin) VALUES(" + member_id + "," + location_id + "," + program_id + ",1)",
                                                function(err, apirows) {

                                                    if (err) {
                                                        callback(null);
                                                    }

                                                    return res.json({
                                                        code: 200,
                                                        status: "You have checked in!",
                                                    });

                                                });
                                        } else if ((member_chekins + 1) > program.allowance) {
                                            // BAD
                                            return res.json({
                                                code: 204,
                                                status: "You have exceeded the allotted maximum visits this month at this location for your fitness offering. Talk to the front desk staff if you would like more visits at this club this month.",
                                            });
                                        } else {
                                            // GOOD
                                            console.log("insert into checkin_history (user_id,location_id,program_id,checkin) VALUES(" + member_id + "," + location_id + "," + program_id + ",1)");
                                            ppool.query("insert into checkin_history (user_id,location_id,program_id,checkin) VALUES(" + member_id + "," + location_id + "," + program_id + ",1)",
                                                function(err, apirows) {

                                                    if (err) {
                                                        callback(null);
                                                    }

                                                    if ((member_chekins + 1) == program.allowance) {
                                                        return res.json({
                                                            code: 200,
                                                            status: "Congrats! You have met your maximum visits this month for your fitness offering. Talk to the front desk staff if you would like more visits at this club this month.",
                                                        });

                                                    } else {
                                                        return res.json({
                                                            code: 200,
                                                            status: "You have used " + (member_chekins + 1) + " of " + program.allowance + " checkins"
                                                        });
                                                    }

                                                });

                                        }

                                    }); //memberMonthlyCheckinsCompanyProgram    

                                }


                            }); //findLocationProgram




                        }); // findAllLocations

                    }); // findCompany
                }); // findLocation

            }); // findUser

        } else {

            console.log("update public.user set eligibility_status = 'Unknown' where id = " + member_id);
            ppool.query("update public.user set eligibility_status = 'Unknown' where id = " + member_id,
                function(err, apirows) {});
            var error = '';

            if (data.serviceSector == 'Medicare/Medicaid') {
                error = renewError;
            } else {
                error = onePassError;
            }

            return res.json({
                code: 204,
                status: error,
            });
        }
    });
}

function handle_verify_tivity_eligibility(req, res) {
    console.log("handle_verify_tivity_eligibility");
    var FirstName = req.body.FirstName;
    var LastName = req.body.LastName;
    var DateOfBirth = req.body.DateOfBirth;
    var Zip = req.body.Zip;

    if (!FirstName || !LastName || !DateOfBirth || !Zip) {
        res.json({
            code: 400,
        });
        return;
    }

    var options = {
        'method': 'POST',
        'url': 'https://instructor.tivityhealth.com/Home/EligibilityCheck',
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
            'FirstName': FirstName,
            'LastName': LastName,
            'DateOfBirth': DateOfBirth,
            'Zip': Zip
        }
    };

    request(options, function(error, response) {

        if (error) {
            return res.json({
                code: 500,
                status: error,
            });
        }

        if (response.body == '"101,"') {
            return res.json({
                code: 200,
                status: "You can check in!",
            });
        } else {
            return res.json({
                code: 404,
                status: renewError,
            });
        }

    });
}

function handle_verify_optum_eligibility(req, res) {
    console.log("handle_verify_optum_eligibility");

    var location_id = req.body.location_id;
    var program_id = req.body.program_id;
    var member_id = req.body.member_id;
    var code = req.body.code.toUpperCase();

    // get the program for the location
    var member_chekins = 0;
    var program;
    var member;
    var location;
    var location_parent = -99999
    var locations;
    var company;

    var locationIDS = "";


    if (!location_id || !program_id || !member_id || !code) {
        res.json({
            code: 400,
        });
        return;
    }


    // Production: https://ogee.int.werally.in
    var options = {
        'method': 'GET',
        'url': 'https://ogee.werally.com/rest/pass-edge/v1/members/code/' + code,
        'headers': {
            'X-OnePass-API-Key': 'HhTWL4vaCb1sftDvQkPJqAtc51pkH2rP',
            'X-OnePass-ClientKey': 'Partner-concierge_health',
            'Content-Type': 'application/json'
        }
    };

    // Dev
    // var options = {
    //     'method': 'GET',
    //     'url': 'https://ogee.int.werally.in/rest/pass-edge/v1/members/code/' + code,
    //     'headers': {
    //         'X-OnePass-API-Key': 'qAf36sfXEv7YzXmaWGmEe6s54wtmfe0k',
    //         'X-OnePass-ClientKey': 'Partner-concierge_health',
    //         'Content-Type': 'application/json'
    //     }
    // };

    request(options, function(error, response) {

        if (error) {
            return res.json({
                code: 500,
                status: error,
            });
        }

        var a = "insert into log (data) values ('" + response.body + "')";
        console.log(a);
        ppool.query(a, function(err, client_rows) {});

        var data = JSON.parse(response.body);
        var insuranceData = data;
        console.log(data)


        if (data.memberStatus == "active") {

            // Find the member
            findUser(member_id, function(data) {

                if (data == null) {
                    return res.json({
                        code: 404,
                        status: 'Member not found',
                    });
                }

                member = data;
                console.log(member);

                // Find the location
                findLocation(location_id, function(data) {

                    if (data == null) {
                        return res.json({
                            code: 404,
                            status: 'Location not found',
                        });
                    }

                    location = data;


                    if (location.parent_id == -1) {
                        location_parent = location.id;
                    } else {
                        location_parent = location.parent_id;
                    }


                    console.log(location);

                    findCompany(location.company_id, function(data) {

                        if (data == null) {
                            return res.json({
                                code: 404,
                                status: 'Program for location not found',
                            });
                        }

                        company = data;
                        console.log(company);


                        // Is this a master slave
                        findAllLocations(location_parent, function(data) {

                            if (data == null) {
                                return res.json({
                                    code: 404,
                                    status: 'Program for location not found',
                                });
                            }

                            locations = data;

                            for (let location of locations) {
                                locationIDS = locationIDS + location.id + ",";
                            }

                            locationIDS = locationIDS.substring(0, locationIDS.length - 1);

                            console.log(locationIDS);

                            findCompanyProgram(location.company_id, program_id, function(data) {

                                program = data;
                                console.log(program);


                                if (program == null) {

                                    findLocationProgram(location_id, program_id, function(data) {
                                        if (data == null) {
                                            return res.json({
                                                code: 404,
                                                status: 'Program for location/company not found',
                                            });
                                        }

                                        program = data;
                                        // console.log(program);

                                        var foundMemberMatch = false;

                                        // console.log("=======================================================================================================================================");
                                        // console.log(insuranceData);
                                        // console.log("=======================================================================================================================================");


                                        for (var i = 0; i < program.length; i++) {
                                            var row = program[i];

                                            if (row.tier == insuranceData.tierName && row.sector == insuranceData.serviceSector) {
                                                foundMemberMatch = true;
                                                program = row;
                                                break;
                                            }

                                            console.log(row);
                                        }


                                        if (!foundMemberMatch) {
                                            var error = '';

                                            if (data.serviceSector == 'Medicare/Medicaid') {
                                                error = 'It appears you are an eligible Renew Active member, but not eligible for this location. Please call the Customer Service phone number on your health plan member ID card and they will be glad to assist you.';
                                            } else {
                                                error = 'It appears you are an eligible One Pass member, but not eligible for this location. Please call the One Pass team at 877-504-6830 and they will be glad to assist you.';
                                            }


                                            return res.json({
                                                code: 204,
                                                status: error,
                                            });

                                        }
                                        console.log("=======================================================================================================================================");

                                        memberMonthlyCheckinsLocationProgram(member_id, locationIDS, program_id, function(data) {

                                            if (data == null) {
                                                return res.json({
                                                    code: 404,
                                                    status: 'Program for location not found',
                                                });
                                            }

                                            member_chekins = parseInt(data);

                                            console.log(member_chekins);

                                            if (program.allowance == 0) {

                                                return res.json({
                                                    code: 200,
                                                    status: "You have checked in!",
                                                });
                                            } else if ((member_chekins + 1) > program.allowance) {
                                                // BAD
                                                return res.json({
                                                    code: 204,
                                                    status: "You have exceeded the allotted maximum visits this month at this location for your fitness offering. Talk to the front desk staff if you would like more visits at this club this month.",
                                                });
                                            } else {
                                                // GOOD

                                                if ((member_chekins + 1) == program.allowance) {
                                                    return res.json({
                                                        code: 200,
                                                        status: "Congrats! You have met your maximum visits this month for your fitness offering. Talk to the front desk staff if you would like more visits at this club this month.",
                                                    });

                                                } else {
                                                    return res.json({
                                                        code: 200,
                                                        status: "You have used " + (member_chekins + 1) + " of " + program.allowance + " checkins"
                                                    });
                                                }
                                            }

                                        }); //memberMonthlyCheckinsLocationProgram
                                    }); //findLocationProgram

                                } else {


                                    memberMonthlyCheckinsCompanyProgram(member_id, location.company_id, program_id, function(data) {

                                        if (data == null) {
                                            return res.json({
                                                code: 404,
                                                status: 'Program for location not found',
                                            });
                                        }

                                        member_chekins = parseInt(data);

                                        console.log(member_chekins);
                                        if (program.allowance == 0) {

                                            return res.json({
                                                code: 200,
                                                status: "You have checked in!",
                                            });

                                        } else if ((member_chekins + 1) > program.allowance) {
                                            // BAD
                                            return res.json({
                                                code: 204,
                                                status: "You have exceeded the allotted maximum visits this month at this location for your fitness offering. Talk to the front desk staff if you would like more visits at this club this month.",
                                            });
                                        } else {
                                            // GOOD


                                            if ((member_chekins + 1) == program.allowance) {
                                                return res.json({
                                                    code: 200,
                                                    status: "Congrats! You have met your maximum visits this month for your fitness offering. Talk to the front desk staff if you would like more visits at this club this month.",
                                                });

                                            } else {
                                                return res.json({
                                                    code: 200,
                                                    status: "You have used " + (member_chekins + 1) + " of " + program.allowance + " checkins"
                                                });
                                            }



                                        }

                                    }); //memberMonthlyCheckinsCompanyProgram    

                                }


                            }); //findLocationProgram




                        }); // findAllLocations

                    }); // findCompany
                }); // findLocation

            }); // findUser

        } else {

            console.log("update public.user set eligibility_status = 'Unknown' where id = " + member_id);
            ppool.query("update public.user set eligibility_status = 'Unknown' where id = " + member_id,
                function(err, apirows) {});
            var error = '';

            if (data.serviceSector == 'Medicare/Medicaid') {
                error = renewError;
            } else {
                error = onePassError;
            }

            return res.json({
                code: 204,
                status: error,
            });
        }
    });
}

function handle_mail_chimp(req, res) {
    var template_name = req.body.template_name;
    var email = req.body.email;
    var name = req.body.name;

    const run = async () => {
        const response = mailchimpClient.messages.sendTemplate({
            template_name: template_name,
            template_content: [{}],
            message: {
                "html": "",
                "text": "",
                "subject": "Welcome to Concierge Health!",
                "from_email": "support@conciergehealth.co",
                "from_name": "Concierge Health",
                "to": [{
                    "email": email,
                    "name": name
                }]
            }
        });

        res.json({
            code: 200,
            status: response,
        });
    };

    run();
}

function handle_hdn_echelon(req, res) {

    console.log(req.query);

    var client = "";

    client = "humana-echelon-go365";

    var newend = serverBase + "/auth/register?response_type=code&client_id=" + client;
    console.log(newend);

    res.writeHead(301, {
        Location: newend
    });
    res.end();
}

function handle_hdn_technogym(req, res) {

    console.log(req.query);

    var client = "";

    client = "humana-technogym-go365";

    var newend = serverBase + "/auth/register?response_type=code&client_id=" + client;
    console.log(newend);

    res.writeHead(301, {
        Location: newend
    });
    res.end();
}

function handle_hdn_lesmills(req, res) {

    console.log(req.query);

    if (
        req.query.product === undefined ||
        req.query.sector === undefined
    ) {
        return res.status(400).send(
            JSON.stringify({
                error: "invalid_request",
                error_description: "Required parameters are missing in the request.",
            })
        );
    }

    var product = req.query.product;
    var sector = req.query.sector;
    var client = "";

    if (product == "onepass" && sector == "government") {
        client = "optum-lessmills-onepassmedi";
    } else if (product == "onepass" && sector == "commercial") {
        client = "optum-lessmills-onepasscorp";
    } else if (product == "renewactive" && sector == "government") {
        client = "optum-lessmills-renewactive";
    }
    var newend = serverBase + "/auth/register?response_type=code&client_id=" + client;
    console.log(newend);

    res.writeHead(301, {
        Location: newend
    });
    res.end();
}

function handle_hdn_dailyburn(req, res) {

    console.log(req.query);

    if (
        req.query.product === undefined ||
        req.query.sector === undefined
    ) {
        return res.status(400).send(
            JSON.stringify({
                error: "invalid_request",
                error_description: "Required parameters are missing in the request.",
            })
        );
    }

    var product = req.query.product;
    var sector = req.query.sector;
    var client = "";

    if (product == "onepass" && sector == "government") {
        client = "optum-dailyburn-onepassmedi";
    } else if (product == "onepass" && sector == "commercial") {
        client = "optum-dailyburn-onepasscorp";
    } else if (product == "renewactive" && sector == "government") {
        client = "optum-dailyburn-renewactive";
    }

    var newend = serverBase + "/auth/register?response_type=code&client_id=" + client;
    console.log(newend);

    res.writeHead(301, {
        Location: newend
    });
    res.end();
}

function handle_hdn_openfit(req, res) {

    console.log(req.query);

    if (
        req.query.product === undefined ||
        req.query.sector === undefined
    ) {
        return res.status(400).send(
            JSON.stringify({
                error: "invalid_request",
                error_description: "Required parameters are missing in the request.",
            })
        );
    }

    var product = req.query.product;
    var sector = req.query.sector;
    var client = "";

    if (product == "onepass" && sector == "government") {
        client = "optum-openfit-onepassmedi";
    } else if (product == "onepass" && sector == "commercial") {
        client = "optum-openfit-onepasscorp";
    } else if (product == "renewactive" && sector == "government") {
        client = "optum-openfit-renewactive";
    }

    var newend = serverBase + "/auth/register?response_type=code&client_id=" + client;
    console.log(newend);

    res.writeHead(301, {
        Location: newend
    });
    res.end();
}

function handle_renewactive_code(req, res) {

    var code = req.body.code.toUpperCase();
    var sector = req.body.sector;

    // Prod
    var options = {
        'method': 'GET',
        'url': 'https://ogee.werally.com/rest/pass-edge/v1/members/code/' + code,
        'headers': {
            'X-OnePass-API-Key': 'HhTWL4vaCb1sftDvQkPJqAtc51pkH2rP',
            'X-OnePass-ClientKey': 'Partner-concierge_health',
            'Content-Type': 'application/json'
        }
    };

    // Dev
    // var options = {
    //     'method': 'GET',
    //     'url': 'https://ogee.int.werally.in/rest/pass-edge/v1/members/code/' + code,
    //     'headers': {
    //         'X-OnePass-API-Key': 'qAf36sfXEv7YzXmaWGmEe6s54wtmfe0k',
    //         'X-OnePass-ClientKey': 'Partner-concierge_health',
    //         'Content-Type': 'application/json'
    //     }
    // };

    // process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
    request(options, function(error, response) {

        var a = "insert into log (data) values ('" + response.body + "')";
        console.log(a);
        ppool.query(a, function(err, client_rows) {});

        var data = JSON.parse(response.body);

        if (sector) {

            if (sector == data.serviceSector && data.memberStatus == "active") {
                res.json({
                    statusCode: 200,
                    status: "Confirmation ID is eligible"
                });
            } else {
                if (data.memberStatus != "active") {
                    if (data.serviceSector == 'Medicare/Medicaid') {
                        error = renewError;
                    } else {
                        error = onePassError;
                    }

                    return res.json({
                        statusCode: 400,
                        status: error,
                    });
                }

                if (sector != data.serviceSector) {
                    if (data.serviceSector == 'Medicare/Medicaid') {
                        error = renewError;
                    } else {
                        error = onePassError;
                    }

                    return res.json({
                        statusCode: 400,
                        status: error,
                    });
                }


            }

        } else {
            res.json(data);
        }


    });

}

function validateRequest(req, res) {
    /*
          var appid = req.headers['x-api-key'];


              if (!appid) {

                  res.json({
                              "code": 404,
                              "status": "Invalid API Key"
                          });
              };



         pool.getConnection(function(err, connection) {

              if (err) {
                  res.json({
                      "code": 100,
                      "status": err
                  });

                  return;
              }

              var appid = req.body.appid;
              var userid = req.body.userid;
              var user = req.body.user;

              if (user) {
                  userid = user;
              }
              if (!userid) {
                  userid = 0;
              }

              // Check for first time member
              connection.query("select * from hdn_company where applicationID = '" + appid + "'", function(err, rows) {

                  if (rows.length == 0) {
                     res.json({
                              "code": 404,
                              "status": "Invalid API Key"
                          });

                     return;
                  }

              });


              connection.release();

              connection.on('error', function(err) {
                  connection.release();
                  res.json({
                      "code": 100,
                      "status": err
                  });

                  return;
              });
          });

          */
}

router.post("/user_class_rating", function(req, res) {
    validateRequest(req, res);
    handle_user_class_rating(req, res);
});

router.post("/user_analytics_add", function(req, res) {
    validateRequest(req, res);
    handle_user_analytics_add(req, res);
});

router.post("/user_information_add", function(req, res) {
    validateRequest(req, res);
    handle_user_information_add(req, res);
});

// Checkin
router.get("/user_information_checkin/:userid", function(req, res) {
    validateRequest(req, res);
    handle_user_information_checkin(req, res);
});

router.get("/user_demo_checkin", function(req, res) {
    validateRequest(req, res);
    handle_get_user_checkin_demo(req, res);
});

router.get("/user_checkin/:userid", function(req, res) {
    validateRequest(req, res);
    handle_get_user_checkin(req, res);
});

router.post("/user_checkin", function(req, res) {
    validateRequest(req, res);
    handle_post_user_checkin(req, res);
});

router.get("/user_information_booking/:userid", function(req, res) {
    validateRequest(req, res);
    handle_user_information_booking(req, res);
});

// Bookings
router.get("/user_information_classes/:userid", function(req, res) {
    validateRequest(req, res);
    handle_user_information_classes(req, res);
});

// Shows
router.get("/user_information_visits/:userid", function(req, res) {
    validateRequest(req, res);
    handle_user_information_visits(req, res);
});

router.get("/user_information_visits_v2/:userid", function(req, res) {
    validateRequest(req, res);
    handle_user_information_visits_v2(req, res);
});

router.get("/user_information_class_members", function(req, res) {
    validateRequest(req, res);
    handle_user_information_class_members(req, res);
});

router.get("/user_exrcices/:memberid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_exrcices(req, res);
});

router.post("/user_exrcices_status", function(req, res) {
    validateRequest(req, res);
    handle_hdn_exrcices_status(req, res);
});

router.get("/user_membership/:membershipid", function(req, res) {
    validateRequest(req, res);
    handle_user_membership(req, res);
});

router.get("/get_activation/:activationcode", function(req, res) {
    validateRequest(req, res);
    handle_get_activation(req, res);
});

router.post("/set_activation/:activationcode/:membershipid", function(
    req,
    res
) {
    validateRequest(req, res);
    handle_set_activation(req, res);
});

router.get("/user_analytics/:userid", function(req, res) {
    validateRequest(req, res);
    handle_user_analytics(req, res);
});

router.post("/user_analytics_update_stats", function(req, res) {
    validateRequest(req, res);
    handle_user_analytics_update_stats(req, res);
});

router.post("/user_analytics_update_usage", function(req, res) {
    validateRequest(req, res);
    handle_user_analytics_update_usage(req, res);
});

router.get("/all_new_user_total_analytics", function(req, res) {
    validateRequest(req, res);
    handle_all_new_user_total_analytics(req, res);
});

router.get("/user_consecutive_visits/:userid", function(req, res) {
    validateRequest(req, res);
    handle_user_consecutive_visits(req, res);
});

router.get("/user_consecutive_days/:userid/:days/", function(req, res) {
    validateRequest(req, res);
    handle_user_consecutive_days(req, res);
});

// GOOGLE HOME
router.post("/google_home", function(req, res) {
    validateRequest(req, res);
    handle_google_home(req, res);
});

// BEACON SPECIFIC ANALYTICS
router.post("/beacon_counter", function(req, res) {
    validateRequest(req, res);
    handle_update_beacon_counter(req, res);
});
router.post("/beacon_analytics_add", function(req, res) {
    validateRequest(req, res);
    handle_beacon_analytics_add(req, res);
});
router.post("/beacon_analytics", function(req, res) {
    validateRequest(req, res);
    handle_beacon_analytics(req, res);
});

router.post("/beacon_analytics_update_counter", function(req, res) {
    validateRequest(req, res);
    handle_beacon_analytics_update_usage(req, res);
});

router.post("/beacon_analytics_update_stats", function(req, res) {
    validateRequest(req, res);
    handle_beacon_analytics_update_stats(req, res);
});

router.get("/new_user_total_analytics/:appid", function(req, res) {
    validateRequest(req, res);
    handle_new_user_total_analytics(req, res);
});

router.get("/all_user_total_analytics/:appid", function(req, res) {
    validateRequest(req, res);
    handle_all_user_total_analytics(req, res);
});

// GENERAL BEACON ADMIN CALLS
router.post("/beacon_location", function(req, res) {
    validateRequest(req, res);
    handle_update_beacon_location(req, res);
});

router.post("/beacon_update_provision", function(req, res) {
    validateRequest(req, res);
    handle_beacon_update_provision(req, res);
});

router.get("/beacons/:appid", function(req, res) {
    validateRequest(req, res);
    handle_beacons(req, res);
});

// Validate their account is active
router.get("/beacons_provision/:appid", function(req, res) {
    validateRequest(req, res);
    handle_beacons_provision(req, res);
});

// Validate their account is active
router.get("/license/:appid", function(req, res) {
    validateRequest(req, res);
    handle_license(req, res);
});

// SYSTEM CALLS

router.get("/system_stats_add", function(req, res) {
    validateRequest(req, res);
    handle_system_stats_add(req, res);
});

// DEVICE CALLS
router.post("/device_type_add", function(req, res) {
    validateRequest(req, res);
    handle_device_type_add(req, res);
});

router.post("/device_get", function(req, res) {
    validateRequest(req, res);
    handle_device_get(req, res);
});

router.post("/all_device_get", function(req, res) {
    validateRequest(req, res);
    handle_all_device_get(req, res);
});
// REPORTING
router.get("/report_daily_usage/:userid", function(req, res) {
    validateRequest(req, res);
    handle_report_daily_usage(req, res);
});

router.get("/report_daily_active/:userid", function(req, res) {
    validateRequest(req, res);
    handle_report_daily_active(req, res);
});

router.get("/report_beacon_most_active/:userid", function(req, res) {
    validateRequest(req, res);
    handle_report_beacon_most_active(req, res);
});

router.get("/report_beacon_lat_lng/:userid", function(req, res) {
    validateRequest(req, res);
    handle_report_beacon_lat_lng(req, res);
});

router.get("/report_users_checkin/:userid", function(req, res) {
    validateRequest(req, res);
    handle_report_users_checkin(req, res);
});

router.get("/report_active_users/:userid", function(req, res) {
    validateRequest(req, res);
    handle_report_active_users(req, res);
});

router.get("/report_device_model/:userid", function(req, res) {
    validateRequest(req, res);
    handle_report_device_model(req, res);
});

router.get("/report_device_language/:userid", function(req, res) {
    validateRequest(req, res);
    handle_report_device_language(req, res);
});

router.get("/report_device_apps/:userid", function(req, res) {
    validateRequest(req, res);
    handle_report_device_apps(req, res);
});

router.get("/report_device_active/:userid", function(req, res) {
    validateRequest(req, res);
    handle_report_device_active(req, res);
});

router.get("/report_beacon_transactions/:userid", function(req, res) {
    validateRequest(req, res);
    handle_report_beacon_transactions(req, res);
});

router.get("/report_new_user_total_analytics/:userid", function(req, res) {
    validateRequest(req, res);
    handle_report_new_user_total_analytics(req, res);
});

router.get("/report_all_user_total_analytics/:userid", function(req, res) {
    validateRequest(req, res);
    handle_report_all_user_total_analytics(req, res);
});

router.get("/report_all_user_total_hourly_analytics/:userid", function(
    req,
    res
) {
    validateRequest(req, res);
    handle_report_all_user_total_hourly_analytics(req, res);
});

router.get("/report_gender_users/:userid", function(req, res) {
    validateRequest(req, res);
    handle_report_gender_users(req, res);
});

router.get("/report_monthly_transactions/:userid", function(req, res) {
    validateRequest(req, res);
    handle_report_monthly_transactions(req, res);
});

router.get("/report_monthly_total_users/:userid", function(req, res) {
    validateRequest(req, res);
    handle_report_monthly_total_users(req, res);
});

router.get("/report_average_daily_visits/:userid", function(req, res) {
    validateRequest(req, res);
    handle_report_average_daily_visits(req, res);
});

router.get("/report_day_retention_analytics/:day/:appid", function(req, res) {
    validateRequest(req, res);
    handle_report_day_retention_analytics(req, res);
});

router.post("/hdn_new_message", function(req, res) {
    validateRequest(req, res);
    handle_new_message(req, res);
});
router.post("/hdn_update_message", function(req, res) {
    validateRequest(req, res);
    handle_update_message(req, res);
});

router.get("/hdn_promotions/:appid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_promotions(req, res);
});

router.get("/hdn_videos/:appid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_videos(req, res);
});

router.get("/hdn_classes_v3/:locationid/:appid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_v3_classes(req, res);
});

router.get("/hdn_classes_v2/:locationid/:appid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_v2_classes(req, res);
});

router.get("/hdn_classes_v1/:appid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_v1_classes(req, res);
});

router.get("/hdn_classes/:locationid/:appid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_classes(req, res);
});
router.get("/hdn_locations/:appid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_locations(req, res);
});
router.get("/hdn_locations_v2/:appid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_v2_locations(req, res);
});

router.get("/hdn_all_locations_v3/", function(req, res) {
    validateRequest(req, res);
    handle_hdn_all_locations_v3(req, res);
});

router.get("/hdn_memberships/:appid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_memberships(req, res);
});
router.get("/hdn_pools/:locationid/:appid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_pools(req, res);
});

router.get("/hdn_food/:appid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_food(req, res);
});

router.get("/hdn_routines/:appid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_routines(req, res);
});

router.get("/hdn_phonebook/:appid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_phonebook(req, res);
});

router.get("/hdn_messages/:memberid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_messages(req, res);
});

router.get("/hdn_appgen/:memberid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_appgen(req, res);
});

router.get("/hdn_appgen_menu/:memberid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_appgen_menu(req, res);
});

router.get("/hdn_next_appgen", function(req, res) {
    validateRequest(req, res);
    handle_hdn_next_appgen(req, res);
});

router.get("/hdn_store_appgen/:companyid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_store_appgen(req, res);
});

router.get("/hdn_close_appgen/:memberid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_close_appgen(req, res);
});

router.post("/hdn_temperature", function(req, res) {
    validateRequest(req, res);
    handle_hdn_temperature(req, res);
});

router.get("/hdn_day_temperature/:appid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_day_temperature(req, res);
});

router.get("/tracker/:tempid/:userid", function(req, res) {
    validateRequest(req, res);
    handle_tracker(req, res);
});

router.get("/hdn_provider_credentials/:companyid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_provider_credentials(req, res);
});

router.get("/hdn_get_heartrate/:userid/:day", function(req, res) {
    validateRequest(req, res);
    handle_hdn_get_heartrate(req, res);
});

router.get("/hdn_provider_myzone_user/:guid/:company_id", function(req, res) {
    validateRequest(req, res);
    handle_hdn_provider_myzone_user(req, res);
});

router.get("/hdn_provider_myzone_biometrics/:guid/:company_id", function(
    req,
    res
) {
    validateRequest(req, res);
    handle_hdn_provider_myzone_biometrics(req, res);
});

router.get("/hdn_provider_myzone_heart/:guid/:day/:company_id", function(
    req,
    res
) {
    validateRequest(req, res);
    handle_hdn_provider_myzone_heart(req, res);
});

router.get("/hdn_provider_myzone_user_data/:guid/:day/:company_id", function(
    req,
    res
) {
    validateRequest(req, res);
    handle_hdn_provider_myzone_user_data(req, res);
});

router.get("/hdn_spin_class/:classid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_get_spin_class(req, res);
});

router.post("/hdn_delete_spin_class/:classid/:userid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_delete_spin_class(req, res);
});

router.post("/hdn_reserve_spin_class/:classid/:userid/:bikeid", function(
    req,
    res
) {
    validateRequest(req, res);
    handle_hdn_post_spin_class(req, res);
});

router.get("/hdn_class_reservations/:classid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_class_reservations(req, res);
});

router.get("/hdn_myschedule/:userid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_myschedule(req, res);
});

router.get("/v2/hdn_myschedule/:userid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_myschedule_v2(req, res);
});

router.get("/v3/hdn_myschedule/:userid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_myschedule_v3(req, res);
});

router.post(
    "/hdn_save_myschedule_v2/:classid/:userid/:date/:booking_id",
    function(req, res) {
        validateRequest(req, res);
        handle_hdn_save_myschedule_v2(req, res);
    }
);

router.post("/hdn_save_myschedule/:classid/:userid/:date", function(req, res) {
    validateRequest(req, res);
    handle_hdn_save_myschedule(req, res);
});

router.post("/hdn_remove_myschedule/:classid/:userid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_remove_myschedule(req, res);
});

router.get("/hdn_city_promotions/:company_id", function(req, res) {
    validateRequest(req, res);
    handle_hdn_city_promotions(req, res);
});

router.get("/hdn_get_family/:memnum/:company_id", function(req, res) {
    validateRequest(req, res);
    handle_hdn_get_family(req, res);
});

router.get("/hdn_get_friends/:userid/:company_id", function(req, res) {
    validateRequest(req, res);
    handle_hdn_get_friends(req, res);
});

router.post("/hdn_set_friends/:userid/:friend_userid/:company_id", function(
    req,
    res
) {
    validateRequest(req, res);
    handle_hdn_set_friends(req, res);
});

router.get("/hdn_get_timeline/:userid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_get_timeline(req, res);
});

router.get("/hdn_get_jwt/:userid/:name", function(req, res) {
    validateRequest(req, res);
    handle_hdn_get_jwt(req, res);
});

router.get("/hdn_get_jwt_certificate", function(req, res) {
    validateRequest(req, res);
    handle_hdn_get_jwt_cert(req, res);
});

router.get("/hdn_get_lf_month/:userid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_get_lf_month(req, res);
});

router.get("/hdn_get_lf_stats/:userid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_get_lf_stats(req, res);
});

router.get("/hdn_get_pc_stats/:userid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_get_pc_stats(req, res);
});

router.get("/hdn_get_pc_month/:userid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_get_pc_month(req, res);
});

router.get("/hdn_get_video/:companyid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_get_video(req, res);
});

router.get("/hdn_heart_rate/:userid/:day", function(req, res) {
    validateRequest(req, res);
    handle_hdn_heart_rate(req, res);
});

router.post("/hdn_reward_points/:userid/:points", function(req, res) {
    validateRequest(req, res);
    handle_hdn_reward_points(req, res);
});

router.get("/hdn_get_reward_points/:userid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_get_reward_points(req, res);
});

router.post("/hdn_set_complete_video/:userid/:videoid/:date/:points", function(
    req,
    res
) {
    validateRequest(req, res);
    handle_hdn_set_complete_video(req, res);
});

router.get("/tokenize/:memnum/:company_id", function(req, res) {
    validateRequest(req, res);
    handle_hdn_autheticate_tokenize_user(req, res);
});

router.get("/precor/:memnum/:company_id", function(req, res) {
    validateRequest(req, res);
    handle_hdn_autheticate_precor(req, res);
});

router.get("/precor/:memnum/:company_id/:rfid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_autheticate_precor(req, res);
});

router.post("/precor/workout", function(req, res) {
    validateRequest(req, res);
    handle_hdn_workout_precor(req, res);
});

router.get("/matrix/member/:memnum", function(req, res) {
    validateRequest(req, res);
    handle_hdn_autheticate_matrix(req, res);
});

router.post("/matrix/workout", function(req, res) {
    validateRequest(req, res);
    handle_hdn_workout_matrix(req, res);
});

router.get("/matrix/workout/:workoutid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_workout_detail_matrix(req, res);
});

router.post("/boxing/workout/", function(req, res) {
    validateRequest(req, res);
    handle_hdn_workout_boxing(req, res);
});

router.get("/bodifitapi/common/getTime", function(req, res) {
    validateRequest(req, res);
    handle_hdn_bodifitapi_time(req, res);
});

router.post("/bodifitapi/weight/weightWifi", function(req, res) {
    validateRequest(req, res);
    handle_hdn_bodifitapi(req, res);
});

router.post("/oauth/token", function(req, res) {
    validateRequest(req, res);
    handle_hdn_oauth_token(req, res);
});

router.post("/oauth/signin", function(req, res) {
    validateRequest(req, res);
    handle_hdn_oauth_signin(req, res);
});

router.post("/oauth/optum/register", function(req, res) {
    validateRequest(req, res);
    handle_hdn_oauth_optum_register(req, res);
});

router.post("/oauth/optum/stream/register", function(req, res) {
    validateRequest(req, res);
    handle_hdn_oauth_optum_stream_register(req, res);
});

router.post("/oauth/register", function(req, res) {
    validateRequest(req, res);
    handle_hdn_oauth_register(req, res);
});

router.get("/oauth/authorize", function(req, res) {
    validateRequest(req, res);
    handle_hdn_oauth_auth(req, res);
});

router.get("/api/v2/MemberActivity", function(req, res) {
    validateRequest(req, res);
    handle_hdn_member_activity(req, res);
});

router.post("/appletv/register2", function(req, res) {
    validateRequest(req, res);
    handle_hdn_apple_register2(req, res);
});

// Remove this after system updates
router.post("/appletv/register", function(req, res) {
    validateRequest(req, res);
    handle_hdn_apple_register(req, res);
});

router.get("/appletv/profile", function(req, res) {
    validateRequest(req, res);
    handle_hdn_apple(req, res);
});

router.get("/v2/appletv/profile", function(req, res) {
    validateRequest(req, res);
    handle_hdn_apple2(req, res);
});

router.get("/appletv/verify/:clubid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_apple_verify(req, res);
});

router.post("/origin/register", function(req, res) {
    validateRequest(req, res);
    handle_hdn_orgin_register(req, res);
});

router.post("/field/update", function(req, res) {
    validateRequest(req, res);
    handle_hdn_field_rupdate(req, res);
});

router.get("/heart/stats/:userid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_heart_stats(req, res);
});

router.get("/heart/stats/zone/:userid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_heart_zone_stats(req, res);
});

router.get("/heart/stats/topzone/:locationid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_heart_topzone_stats(req, res);
});

router.get("/heart/stats/topzone/club/:locationid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_heart_topzone_club_stats(req, res);
});

router.get("/v2/heart/stats/topzone/class/:locationid/:classid", function(
    req,
    res
) {
    validateRequest(req, res);
    handle_hdn_heart_topzone_class_stats_v2(req, res);
});

router.get("/heart/stats/topzone/class/:locationid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_heart_topzone_class_stats(req, res);
});

router.get("/heart/stats/topzone/company/:locationid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_heart_topzone_company_stats(req, res);
});

router.get("/heart/stats/total/club/:locationid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_heart_total_club_stats(req, res);
});

router.get("/heart/stats/total/company/:locationid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_heart_total_company_stats(req, res);
});

router.get("/heart/stats/class/:userid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_heart_class_stats(req, res);
});

router.get("/hdn_get_checkin_info/:userid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_get_checkin_info(req, res);
});

router.get("/updateclassstats/:classid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_update_class_stats(req, res);
});

router.get("/getActiveHRVideo/:exerciseid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_getHRVideo(req, res);
});

router.get("/getActiveHRExercise/:exerciseid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_getHRExercise(req, res);
});

router.get("/getActiveHRData", function(req, res) {
    validateRequest(req, res);
    handle_hdn_getHR(req, res);
});

router.get("/getActiveHRData/:clubid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_club_getHR(req, res);
});

router.get("/getTransactions/:userid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_transactions(req, res);
});

router.get("/getTransactionsDues/:userid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_transactions_dues(req, res);
});

router.get("/v1/ufc/getEmployees/:userid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_get_employees(req, res);
});

router.post("/v1/ufc/schedule/:userid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_put_schedule(req, res);
});

router.post("/session/purchase", function(req, res) {
    validateRequest(req, res);
    handle_hdn_session_purchase(req, res);
});

router.post("/session/cancel/:userid/:sessionid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_session_cancel(req, res);
});

router.post("/session/update/:userid/:sessionid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_session_update(req, res);
});

router.get("/getSessions/:companyid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_session(req, res);
});

router.get("/getSessions/:classid/:userid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_session_class(req, res);
});

router.get("/rc900/openapi/datas/:deviceNumbers", function(req, res) {
    validateRequest(req, res);
    handle_hdn_rc900(req, res);
});

router.post("/webhook", function(req, res) {
    validateRequest(req, res);
    handle_hdn_webhook2(req, res);
    // handle_hdn_webhook(req, res);
});

router.post("/webhooktg", function(req, res) {
    validateRequest(req, res);
    handle_hdn_webhooktg(req, res);
});

router.post("/webhookgympass", function(req, res) {
    validateRequest(req, res);
    handle_hdn_webhookgp(req, res);
});

router.post("/validate_employee", function(req, res) {
    validateRequest(req, res);
    handle_hdn_validate_employee(req, res);
});

router.post("/prospect", function(req, res) {
    validateRequest(req, res);
    handle_hdn_prospect(req, res);
});

router.post("/clubInfo", function(req, res) {
    validateRequest(req, res);
    handle_hdn_clubinfo(req, res);
});

router.get("/wellness/:wellnessid/:lat/:lng", function(req, res) {
    validateRequest(req, res);
    handle_hdn_wellness_company(req, res);
});

router.get("/wellnessmembership/:wellnessid", function(req, res) {
    validateRequest(req, res);
    handle_hdn_wellness_company_membership(req, res);
});

router.get("/wellnessemployers", function(req, res) {
    validateRequest(req, res);
    handle_hdn_wellness_employers(req, res);
});

router.get("/geocode/:address", function(req, res) {
    validateRequest(req, res);
    handle_hdn_geocode(req, res);
});

router.get("/geodistance/:lat/:lng", function(req, res) {
    validateRequest(req, res);
    handle_hdn_distance(req, res);
});

router.get("/geolocationdistance/:lat/:lng", function(req, res) {
    validateRequest(req, res);
    handle_hdn_locations_distance(req, res);
});

router.get("/accounts_types", function(req, res) {
    validateRequest(req, res);
    handle_hdn_get_account_types(req, res);
});

router.get("/accounts/:user_id", function(req, res) {
    validateRequest(req, res);
    handle_hdn_get_accounts(req, res);
});

router.post("/accounts", function(req, res) {
    validateRequest(req, res);
    handle_hdn_post_accounts(req, res);
});

router.post("/validate/member", function(req, res) {
    validateRequest(req, res);
    handle_hdn_member_validate_name(req, res);
});

router.post("/validate/member/token", function(req, res) {
    validateRequest(req, res);
    handle_hdn_member_validate_token(req, res);
});

router.post("/login", function(req, res) {
    validateRequest(req, res);
    handle_hdn_login(req, res);
});

router.post("/api/activityByToken", function(req, res) {
    handle_hdn_post_bytoken_activities2(req, res);
    // handle_hdn_post_bytoken_activities(req, res);
});

router.get("/api/activityByToken/:token", function(req, res) {
    handle_hdn_get_bytoken_activities(req, res);
});

router.post("/api/memberByToken", function(req, res) {
    handle_hdn_post_bytoken_member(req, res);
});

router.post("/api/activity", function(req, res) {
    handle_hdn_post_activities(req, res);
});

router.get("/api/activity/:user_id", function(req, res) {
    handle_hdn_get_activities(req, res);
});

router.get("/api/stats/:user_id/:date", function(req, res) {
    handle_hdn_get_statistic(req, res);
});

router.get("/api/member/:memnum", function(req, res) {
    handle_hdn_get_membership(req, res);
});

router.get("/api/equipment", function(req, res) {
    handle_hdn_get_equipment(req, res);
});

router.get("/api/locations", function(req, res) {
    handle_hdn_get_locations(req, res);
});

router.post('/plaid_exchange_token', function(req, res) {
    handle_plaid_exchange_token(req, res);
});

router.post('/plaid_create_customer', function(req, res) {
    handle_plaid_create_customer(req, res);
});

router.post('/plaid_create_linked_account', function(req, res) {
    handle_plaid_create_linked_account(req, res);
});

router.post('/plaid_account_balance', function(req, res) {
    handle_plaid_account_balance(req, res);
});
router.post('/plaid_account_transactions', function(req, res) {
    handle_plaid_account_transactions(req, res);
});

router.post('/plaid_processor_token', function(req, res) {
    handle_plaid_processor_token(req, res);
});

router.post('/stripe_create_bank_account', function(req, res) {
    handle_stripe_create_bank_account(req, res);
});

router.post('/stripe_create_external_bank_account', function(req, res) {
    handle_stripe_create_external_bank_account(req, res);
});

router.post('/stripe_create_customer', function(req, res) {
    handle_stripe_create_customer(req, res);
});

router.post('/stripe_create_payment_method', function(req, res) {
    handle_stripe_create_payment_method(req, res);
});

router.post('/stripe_create_invoice', function(req, res) {
    handle_stripe_create_invoice(req, res);
});

router.post("/api/activityByEmailHash", function(req, res) {
    handle_hdn_post_bytoken_activities2(req, res);
    // handle_hdn_post_byemail_activities(req, res);
});

router.post('/stripe_cancel_subscription', function(req, res) {
    handle_stripe_cancel_subscription(req, res);
});

router.post('/stripe_terms_and_conditions', function(req, res) {
    handle_stripe_terms_and_conditions(req, res);
});

router.get('/stripe_subscriptions', function(req, res) {
    handle_stripe_subscriptions(req, res);
});

router.post('/stripe_customer_subscriptions', function(req, res) {
    handle_stripe_customer_subscriptions(req, res);
});

router.post('/stripe_customer_payment_method', function(req, res) {
    handle_stripe_customer_payment_method(req, res);
});

router.get("/register/lesmills", function(req, res) {
    handle_hdn_lesmills(req, res);
});

router.get("/register/technogym", function(req, res) {
    handle_hdn_technogym(req, res);
});

router.get("/register/echelon", function(req, res) {
    handle_hdn_echelon(req, res);
});


router.get("/register/openfit", function(req, res) {
    handle_hdn_openfit(req, res);
});

router.get("/register/dailyburn", function(req, res) {
    handle_hdn_dailyburn(req, res);
});

router.post('/renewactive', function(req, res) {
    handle_renewactive_code(req, res);
});

router.post('/send_email', function(req, res) {
    handle_mail_chimp(req, res);
});

router.post('/verifyTivityEligibility', function(req, res) {
    handle_verify_tivity_eligibility(req, res);
});

router.post('/verifyOptumEligibility', function(req, res) {
    handle_verify_optum_eligibility(req, res);
});

router.post('/checkinOptumEligibility', function(req, res) {
    handle_checkin_optum_eligibility(req, res);
});

app.use("/", router);


function encrypt(value) {

    var algorithm = 'aes256'; // or any other algorithm supported by OpenSSL
    var key = 'DailyBurn';
    var text = value;

    var cipher = crypto.createCipher(algorithm, key);
    var encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');

    return encrypted;
}


app.listen(3000);