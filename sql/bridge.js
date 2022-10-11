require("events").EventEmitter.defaultMaxListeners = Infinity;

const { Pool, Client } = require('pg')
var mysql = require("mysql");
const stripe = require('stripe')('sk_test_nLokeSl0PKT8NO9DFvk688Ta0082qAyqcJ');

var dateFormat = require('dateformat');

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

// const connectionString = 'postgresql://doadmin:u3ue7itosyz79gqt@db-postgresql-sfo3-67017-do-user-441183-0.a.db.ondigitalocean.com:25060/defaultdb?sslmode=require?sslmode=require&ssl=true&rejectUnauthorized: false'
const connectionString = 'postgresql://doadmin:tjoeiuwtzqalk7y0@db-postgresql-sfo2-82165-test-do-user-441183-0.b.db.ondigitalocean.com:25060/defaultdb?sslmode=require&ssl=true&rejectUnauthorized: false'

var db = mysql.createConnection({
    host: '104.131.80.77',
    user: 'alonehealthdata',
    password: '4tqYFLTdXdksTQC',
    database: 'hdn',
    debug: false
});

db.connect(function (err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
});

var allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    next();
}

const pool = new Pool({
    connectionString: connectionString,
    ssl: false,
})


function processUserRequest(id, fname, lname, email, scancode, memnum, callback) {

    console.log("insert ignore into users(id, fname, lname, email, scancode,memnum,password,salt) VALUES(" + id + ",'" + fname + "','" + lname + "','" + email + "',MD5('" + scancode + "'),MD5('" + memnum + "'),'','')");

    db.query("insert ignore into users(id, fname, lname, email, scancode,memnum,password,salt) VALUES(" + id + ",'" + fname + "','" + lname + "','" + email + "',MD5('" + scancode + "'),MD5('" + memnum + "'),'','')", function (err, rows) {
        result = rows;

        if (err != null) {
            console.log(err);
        }

        callback(result);
    });
}

function processActivityRequest(checkin, timestamp, user_id, score, calories, minutes, steps, distance, heart, checkout, duration, watts, water, weight, active, feeling, bmi, equipment_id, name, client_id, callback) {

    console.log("insert into activity(checkin,timestamp,user_id,score,calories,minutes, steps,distance, heart,checkout,duration,watts,water,weight,active,feeling,bmi,equipment_id,name,client_id,location_id) VALUES(" + checkin + ",'" + timestamp + "'," + user_id + "," + score + "," + calories + "," + minutes + "," + steps + "," + distance + "," + heart + "," + checkout + "," + duration + "," + watts + "," + water + "," + weight + "," + active + "," + feeling + "," + bmi + "," + equipment_id + ",'" + name + "'," + client_id + ",9999) ON CONFLICT (user_id, location_id, equipment_id, client_id, name, timestamp) DO UPDATE SET steps = " + steps + ", calories = " + calories + ", minutes = " + minutes + ", distance = " + distance + ", heart = " + heart + ", water = " + water + ", duration = " + duration + ";");

    pool.query("insert into activity(checkin,timestamp,user_id,score,calories,minutes, steps,distance, heart,checkout,duration,watts,water,weight,active,feeling,bmi,equipment_id,name,client_id,location_id) VALUES(" + checkin + ",'" + timestamp + "'," + user_id + "," + score + "," + calories + "," + minutes + "," + steps + "," + distance + "," + heart + "," + checkout + "," + duration + "," + watts + "," + water + "," + weight + "," + active + "," + feeling + "," + bmi + "," + equipment_id + ",'" + name + "'," + client_id + ",9999) ON CONFLICT (user_id, location_id, equipment_id, client_id, name, timestamp) DO UPDATE SET steps = " + steps + ", calories = " + calories + ", minutes = " + minutes + ", distance = " + distance + ", heart = " + heart + ", water = " + water + ", duration = " + duration + ";", function (err, rows, fields) {
        result = rows;

        if (err != null) {
            console.log(err);
        }

        callback(result);
    });
}


function synch1() {
    console.log("select * from ch_activities where timestamp >= DATE(NOW()  - INTERVAL 7 DAY)");
    db.query("select * from ch_activities where timestamp >= DATE(NOW()  - INTERVAL 7 DAY)", function (err, rows) {

        if (err != null) {
            console.log(err);
            process.exit();
        }

        if (rows.length > 0) {
            var looper = 0;
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                looper++;

                var date = row.timestamp;
                var dateString = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();
                dateString = dateString.toString().replace("Z", "");

                var nameString = row.name.replace("\'", "`");

                console.log(row.checkin, dateString, row.user_id, row.score, row.calories, row.minutes, row.steps, row.distance, row.heart, row.checkout, row.duration, row.watts, row.water, row.weight, row.active, row.feeling, row.bmi, row.equipment_id, nameString, row.client_id);

                processActivityRequest(row.checkin, dateString, row.user_id, row.score, row.calories, row.minutes, row.steps, row.distance, row.heart, row.checkout, row.duration, row.watts, row.water, row.weight, row.active, row.feeling, row.bmi, row.equipment_id, nameString, row.client_id, function (res) {

                    looper--;
                    console.log("Looper " + looper);

                    if (looper == 0) {
                        process.exit();
                    }

                });
            }

        }
    });
}


function synch2() {
    console.log("select * from public.user where role_id >= 7 and role_id < 9999 and \"createdAt\" <= now() - INTERVAL \'3 DAYS\'");
    pool.query("select * from public.user where role_id >= 7 and role_id < 9999 and \"createdAt\" <= now() - INTERVAL \'3 DAYS\'", function (err, res) {


        if (err != null) {
            console.log(err);
            process.exit();
        }


        var looper = 0;

        for (let row of res.rows) {

            // console.log(row);
            looper++;

            console.log(row.id, row.fname, row.lname, row.email, row.email, row.email);
            processUserRequest(row.id, row.fname, row.lname, row.email, row.email, row.email, function (res) {

                looper--;
                console.log("Looper " + looper);

                if (looper == 0) {
                    process.exit();
                }
            });
        }
    });
}


function synch3() {
    console.log("update challenge_members set distance = b.distance, steps = b.steps,duration = b.duration, calorie = b.calories from (select sum(distance) as distance , sum(steps) as steps , sum(calories) as calories  , sum(duration) as duration  , challenge_id,user_id from (select challenge_id,activity.user_id,activity.distance,activity.steps,activity.calories,activity.duration  from challenge_members join challenge on challenge.id = challenge_members.challenge_id join activity on activity.user_id = challenge_members.user_id where activity.client_id in (12, 17, 18,15,19,20) and activity.timestamp between challenge.start_date  and challenge.end_date  AND activity.timestamp > challenge_members.entry_date ) a group by challenge_id,user_id) b where b.challenge_id = challenge_members.challenge_id and b.user_id = challenge_members.user_id");
    pool.query("update challenge_members set distance = b.distance, steps = b.steps,duration = b.duration, calorie = b.calories from (select sum(distance) as distance , sum(steps) as steps , sum(calories) as calories  , sum(duration) as duration  , challenge_id,user_id from (select challenge_id,activity.user_id,activity.distance,activity.steps,activity.calories,activity.duration  from challenge_members join challenge on challenge.id = challenge_members.challenge_id join activity on activity.user_id = challenge_members.user_id where activity.client_id in (12, 17, 18,15,19,20) and activity.timestamp between challenge.start_date  and challenge.end_date  AND activity.timestamp > challenge_members.entry_date ) a group by challenge_id,user_id) b where b.challenge_id = challenge_members.challenge_id and b.user_id = challenge_members.user_id", function (err, res) {
        process.exit();
    });
}

function synch4() {
    console.log("update challenge_members set completed = a.completed, percentage = a.percentage, target = a.target from (select challenge_members.id, case when challenge_members.distance > challenge.distance then 1 else 0 end completed,  case when (challenge_members.distance/challenge.distance * 100) > 100 then 100 else (challenge_members.distance/challenge.distance * 100) end  as percentage,challenge.distance as target from challenge_members join challenge on challenge.id = challenge_members.challenge_id) a where a.id = challenge_members.id");
    pool.query("update challenge_members set completed = a.completed, percentage = a.percentage, target = a.target from (select challenge_members.id, case when challenge_members.distance > challenge.distance then 1 else 0 end completed,  case when (challenge_members.distance/challenge.distance * 100) > 100 then 100 else (challenge_members.distance/challenge.distance * 100) end  as percentage,challenge.distance as target from challenge_members join challenge on challenge.id = challenge_members.challenge_id) a where a.id = challenge_members.id", function (err, res) {

        console.log("1");
        pool.query("insert into rewards (user_id,count) select user_id, count(*) as count from(SELECT DISTINCT date_trunc('day', timestamp) as timestamp,user_id FROM activity group by user_id,date_trunc('day', timestamp)) a group by user_id order by user_id ON CONFLICT (user_id) DO UPDATE SET count = rewards.count;", function (err, res) {
            console.log("2");
            pool.query("insert into rewards (user_id,count) select * from (select user_id,count(*) as count from activity  where client_id IN (12,15,16,17,18,219,20) group by user_id ) a where count >= 1 ON CONFLICT (user_id) DO UPDATE SET r1 = 1;", function (err, res) {
                console.log("3");
                pool.query("insert into rewards (user_id,count) select * from (select user_id,count(*) as count from activity  where client_id IN (12,15,16,17,18,219,20) group by user_id ) a where count >= 5 ON CONFLICT (user_id) DO UPDATE SET r5 = 1;", function (err, res) {
                    console.log("4");
                    pool.query("insert into rewards (user_id,count) select * from (select user_id,count(*) as count from activity  where client_id IN (12,15,16,17,18,219,20) group by user_id ) a where count >= 10 ON CONFLICT (user_id) DO UPDATE SET r10 = 1;", function (err, res) {
                        console.log("5");
                        pool.query("insert into rewards (user_id,count) select * from (select user_id,count(*) as count from activity  where client_id IN (12,15,16,17,18,219,20) group by user_id ) a where count >= 25 ON CONFLICT (user_id) DO UPDATE SET r25 = 1;", function (err, res) {
                            console.log("6");
                            pool.query("insert into rewards (user_id,count) select * from (select user_id,count(*) as count from activity  where client_id IN (12,15,16,17,18,219,20) group by user_id ) a where count >= 50 ON CONFLICT (user_id) DO UPDATE SET r50 = 1;", function (err, res) {
                                console.log("7");
                                pool.query("insert into rewards (user_id,count) select * from (select user_id,count(*) as count from activity  where client_id IN (12,15,16,17,18,219,20) group by user_id ) a where count >= 75 ON CONFLICT (user_id) DO UPDATE SET r75 = 1;", function (err, res) {
                                    console.log("8");
                                    pool.query("insert into rewards (user_id,count) select * from (select user_id,count(*) as count from activity  where client_id IN (12,15,16,17,18,219,20) group by user_id ) a where count >= 100 ON CONFLICT (user_id) DO UPDATE SET r100 = 1;", function (err, res) {
                                        console.log("9");
                                        pool.query("insert into rewards (s3,user_id) select * from (SELECT  COUNT(*) AS days_streak,user_id FROM ( SELECT DISTINCT date_trunc('day', timestamp) as timestamp,user_id FROM activity where timestamp > (CURRENT_DATE - INTERVAL '7 days')  and date_trunc('month', CURRENT_DATE) = date_trunc('month', timestamp) and client_id IN (12,15,16,17,18,219,20) ) a GROUP BY user_id) b where days_streak = 3 ON CONFLICT (user_id) DO UPDATE SET s3 = 1;", function (err, res) {
                                            console.log("10");
                                            pool.query("insert into rewards (s5,user_id) select * from (SELECT  COUNT(*) AS days_streak,user_id FROM ( SELECT DISTINCT date_trunc('day', timestamp) as timestamp,user_id FROM activity where timestamp > (CURRENT_DATE - INTERVAL '7 days')  and date_trunc('month', CURRENT_DATE) = date_trunc('month', timestamp) and client_id IN (12,15,16,17,18,219,20) ) a GROUP BY user_id) b where days_streak = 5 ON CONFLICT (user_id) DO UPDATE SET s5 = 1;", function (err, res) {
                                                console.log("11");
                                                pool.query("insert into rewards (s7,user_id) select * from (SELECT  COUNT(*) AS days_streak,user_id FROM ( SELECT DISTINCT date_trunc('day', timestamp) as timestamp,user_id FROM activity where timestamp > (CURRENT_DATE - INTERVAL '7 days')  and date_trunc('month', CURRENT_DATE) = date_trunc('month', timestamp) and client_id IN (12,15,16,17,18,219,20) ) a GROUP BY user_id) b where days_streak = 7 ON CONFLICT (user_id) DO UPDATE SET s7 = 1;", function (err, res) {
                                                    console.log("12");
                                                    pool.query("insert into rewards (s30,user_id) select * from (SELECT  COUNT(*) AS days_streak,user_id FROM ( SELECT DISTINCT date_trunc('day', timestamp) as timestamp,user_id FROM activity where timestamp > (CURRENT_DATE - INTERVAL '31 days')  and date_trunc('month', CURRENT_DATE) = date_trunc('month', timestamp) and client_id IN (12,15,16,17,18,219,20) ) a GROUP BY user_id) b where days_streak = 30 ON CONFLICT (user_id) DO UPDATE SET s30 = 1;", function (err, res) {
                                                        process.exit();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}



function randomDate2(start, end, startHour, endHour) {
    var date = new Date(+start + Math.random() * (end - start));
    var hour = startHour + Math.random() * (endHour - startHour) | 0;
    date.setHours(hour);
    return date;
}

function randomDate(date1, date2) {
    function randomValueBetween(min, max) {
        return Math.random() * (max - min) + min;
    }
    var date1 = date1 || '01-01-1970'
    var date2 = date2 || new Date().toLocaleDateString()
    date1 = new Date(date1).getTime()
    date2 = new Date(date2).getTime()
    if (date1 > date2) {
        return dateFormat(new Date(randomValueBetween(date2, date1)), "yyyy-mm-dd h:MM:ss")
    } else {
        return dateFormat(new Date(randomValueBetween(date1, date2)), "yyyy-mm-dd h:MM:ss")

    }
}

function testCheckins() {
    console.log("SELECT * FROM public.user OFFSET floor(random() * ( SELECT COUNT(*) FROM public.user)) LIMIT 1");

    pool.query("SELECT * FROM public.user OFFSET floor(random() * ( SELECT COUNT(*) FROM public.user)) LIMIT 1", function (err, res) {

        if (err != null) {
            console.log(err);
            process.exit();
        }

        if (res.rows.length == 0) {
            console.log("No user found");
            process.exit();
        }

        var iid = res.rows[0].id;

        console.log(iid);

        var items = Array(35,34);
        // var items = Array(35, 3, 4, 34, 23, 2);
        //  var items = Array(2,2,2);

        console.log("insert into checkin_history (timestamp,user_id,location_id,checkin,program_id,type) values('" + randomDate(new Date("2021-01-01"), new Date("2021-08-31")) + "'," + iid + ",10121,1," + items[Math.floor(Math.random() * items.length)] + ",1)");
        pool.query("insert into checkin_history (timestamp,user_id,location_id,checkin,program_id,type) values('" + randomDate(new Date("2021-01-01"), new Date("2021-08-31")) + "'," + iid + ",10121,1," + items[Math.floor(Math.random() * items.length)] + ",1)", function (err, res) {
            process.exit();
        });



    });
}

function processledger() {
    console.log("insert into ledger (active_date,visit_count,location_id,reimbursement,total,guid) select active_date,sum(visit_count) as visit_count,location_id, reimbursement, sum(visit_count) * reimbursement as total,CAST(active_date + location_id As varchar(50)) from ledger_detail where return_code = 21 group by active_date,location_id,reimbursement ON CONFLICT (guid) DO NOTHING");
    pool.query("insert into ledger (active_date,visit_count,location_id,reimbursement,total,guid) select active_date,sum(visit_count) as visit_count,location_id, reimbursement, sum(visit_count) * reimbursement as total,CAST(active_date + location_id As varchar(50)) from ledger_detail where return_code = 21 group by active_date,location_id,reimbursement ON CONFLICT (guid) DO NOTHING", function (err, res) {

        if (err != null) {
            console.log(err);
            process.exit();
        }
        process.exit();
    });
}
function processledgerDetail() {
    console.log("insert into ledger_detail (visit_count,member_id,active_date,location_id,program_id) select count(*), user_id,checkin::date ,location_id,program_id from (select user_id,TO_CHAR(checkin_history.timestamp,'YYYY-MM-DD') as checkin,location_id,program_id from checkin_history where location_id != 9999  ) as checkin_history group by user_id,checkin,location_id,program_id ON CONFLICT (confirmation_id,active_date,location_id,member_id,return_code) DO NOTHING; ");
    pool.query("insert into ledger_detail (visit_count,member_id,active_date,location_id,program_id) select count(*), user_id,checkin::date ,location_id,program_id from (select user_id,TO_CHAR(checkin_history.timestamp,'YYYY-MM-DD') as checkin,location_id,program_id from checkin_history where location_id != 9999  ) as checkin_history group by user_id,checkin,location_id,program_id ON CONFLICT (confirmation_id,active_date,location_id,member_id) DO NOTHING; ", function (err, res) {

        // if (err != null) {
        //     console.log(err);
        //     process.exit();
        // }

        processledgerDetailUpdate();
    });
}
function processledgerDetailUpdate() {
    console.log("update ledger_detail set confirmation_id = member_program.membership from (select DISTINCT(member_id), membership, member_program.program_id from ledger_detail join member_program on member_program.user_id = member_id and member_program.program_id = ledger_detail.program_id) member_program where member_program.member_id = ledger_detail.member_id and member_program.program_id = ledger_detail.program_id;");
    pool.query("update ledger_detail set confirmation_id = member_program.membership from (select DISTINCT(member_id), membership, member_program.program_id from ledger_detail join member_program on member_program.user_id = member_id and member_program.program_id = ledger_detail.program_id) member_program where member_program.member_id = ledger_detail.member_id and member_program.program_id = ledger_detail.program_id;", function (err, res) {

        // if (err != null) {
        //     console.log(err);
        //     processledgerDetailDelete();
        // }

        processledgerDetailDelete();
    });
}

function processledgerDetailDelete() {
    console.log("delete from ledger_detail where confirmation_id IS NULL;");
    pool.query("delete from ledger_detail where confirmation_id IS NULL;", function (err, res) {

        if (err != null) {
            console.log(err);
            process.exit();
        }

        process.exit();
    });
}



function processPayments() {
    console.log("select ledger.id,active_date,TO_CHAR(active_date,'YYYY-MM') as desc,locations.id as location_id,locations.name,locations.address,total as reimbursement,stripe_payout_customers.stripe_customer_id,programs.name as program_name, ledger.parent_id from ledger join locations on locations.id = ledger.location_id or locations.id = ledger.parent_id join stripe_payout_customers on stripe_payout_customers.location_id = locations.id join programs on programs.id = ledger.program_id where date_trunc('month', active_date)= date_trunc('month', current_date - interval '1' month)  and processed = false and stripe_payout_customers.deleted_at IS NULL and total > 0 limit 1");
    pool.query("select ledger.id,active_date,TO_CHAR(active_date,'YYYY-MM') as desc,locations.id as location_id,locations.name,locations.address,total as reimbursement,stripe_payout_customers.stripe_customer_id,programs.name as program_name, ledger.parent_id from ledger join locations on locations.id = ledger.location_id or locations.id = ledger.parent_id join stripe_payout_customers on stripe_payout_customers.location_id = locations.id join programs on programs.id = ledger.program_id where date_trunc('month', active_date)= date_trunc('month', current_date - interval '1' month)  and processed = false and stripe_payout_customers.deleted_at IS NULL  and total > 0 limit 1", function (err, res) {


        if (err != null) {
            console.log(err);
            process.exit();
        }


        if (res.rows.length == 0) {
            console.log("No more transactions");
            process.exit();
        }

        for (let row of res.rows) {
            var iid = row.id;

            stripe.transfers.create(
                {
                    amount: row.reimbursement * 100,
                    currency: 'usd',
                    destination: row.stripe_customer_id,
                    // source_type: bank_account,
                    transfer_group: row.active_date,
                    description: "Monthly processing - " + row.program_name + " : " + row.desc
                })
                .then((data) => {

                    console.log("update ledger set stripe_status = 1, processed = true , stripe_transaction = '" + data["id"] + "' where id = " + iid);
                    pool.query("update ledger set stripe_status = 1, processed = true, stripe_transaction = '" + data["id"] + "' where id = " + iid, function (err, res) {

                        if (!err) {
                            console.log(data);
                            process.exit();
                        } else {
                            console.log(err);
                        }
                    });


                })
                .catch((error) => {
                    console.log(error);
                    process.exit();

                })
        }

    });
}


var myArgs = process.argv.slice(2);
console.log('myArgs: ', myArgs[0]);

if (myArgs[0] == 1) {
    synch1();
} else if (myArgs[0] == 2) {
    synch2();
} else if (myArgs[0] == 3) {
    synch3();
} else if (myArgs[0] == 4) {
    synch4();
} else if (myArgs[0] == 5) {
    processPayments();
} else if (myArgs[0] == 6) {
    processledgerDetail();
} else if (myArgs[0] == 7) {
    processledger();
} else if (myArgs[0] == 999) {
    testCheckins();
} else {
    process.exit();
}
