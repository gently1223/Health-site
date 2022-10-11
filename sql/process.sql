delete from ledger;
delete from ledger_detail;
delete from ledger_member;

delete from ledger_activity_member;

delete from ledger_activity_detail;

update public.user set token = MD5(LOWER(TRIM(email)));

update locations set veritap_id = id;
update public."user" set age  = case when (birthday IS NULL) then 21 else (date_part('year', age(birthday))) end;
update public.user set alias =  CONCAT(LOWER(TRIM(fname)) , '.' , LOWER(TRIM(lname))) where alias IS NULL;
        
delete from checkin_history where location_id = 9999;

DROP TABLE IF EXISTS _ledger_detail;

CREATE TABLE _ledger_detail AS
select null as confirmation_id, count(*), user_id as member_id,checkin::date ,location_id,program_id,0.0 as reimbursement,company_id,parent_id, 0 as visit_process_count from (select user_id,TO_CHAR(checkin_history.timestamp,'YYYY-MM-DD') as checkin,location_id,program_id,company_id,parent_id from checkin_history left join locations on locations.id =  checkin_history.location_id where location_id != 9999  ) as checkin_history group by user_id,checkin,location_id,program_id,company_id,parent_id;

update _ledger_detail set confirmation_id = member_program.membership from (select DISTINCT(member_id), membership, member_program.program_id from _ledger_detail join member_program on member_program.user_id = member_id and member_program.program_id = _ledger_detail.program_id) member_program where member_program.member_id = _ledger_detail.member_id and member_program.program_id = _ledger_detail.program_id;

update _ledger_detail set reimbursement = company_program.rate from (select DISTINCT(_ledger_detail.company_id),rate, _ledger_detail.program_id from _ledger_detail join company_program on company_program.company_id = _ledger_detail.company_id and company_program.program_id = _ledger_detail.program_id) company_program where company_program.company_id = _ledger_detail.company_id and company_program.program_id = _ledger_detail.program_id;

delete from _ledger_detail where confirmation_id IS NULL;
delete from ledger_member where total = 0;
delete from ledger_member where total = 0;

insert into ledger_detail(confirmation_id,visit_count,member_id,active_date,location_id,program_id,reimbursement,company_id,parent_id) select confirmation_id,count,member_id,checkin,location_id,program_id,reimbursement,company_id,parent_id from _ledger_detail
ON CONFLICT (confirmation_id,active_date,location_id,member_id,program_id,parent_id) DO UPDATE SET visit_count = EXCLUDED.visit_count, reimbursement = EXCLUDED.reimbursement;


insert into ledger_member (active_date,visit_count,location_id,reimbursement,total,company_id,guid,member_id,program_id,parent_id)
select TO_CHAR(active_date,'YYYY-MM-01')::date  as active_date,sum(visit_count) as visit_count,location_id, reimbursement,
0.0 as total,company_id,TO_CHAR(active_date,'YYYY-MM-01') as guid ,member_id,program_id,parent_id from ledger_detail  group by location_id,reimbursement,company_id,TO_CHAR(active_date,'YYYY-MM-01'),member_id,program_id,parent_id
ON CONFLICT (active_date,location_id,member_id,program_id,parent_id) DO UPDATE SET visit_count = EXCLUDED.visit_count;


update ledger_member set total  =
case 
     when (visit_count > 4 and company_id = 16 and program_id = 34) then 60.00
     when (visit_count > 10 and company_id = 16  and program_id = 35) then 150.00

     when (visit_count > 1 and company_id = 27) then 0.00
     when (visit_count > 1 and company_id = 23) then 24.00
     when (visit_count > 1 and company_id = 35) then 0.00

else (visit_count * reimbursement) end;

update ledger_member set visit_process_count  =
case 
     when (visit_count > 4 and company_id = 16 and program_id = 34) then  4
     when (visit_count > 10 and company_id = 16  and program_id = 35) then  10

     when (visit_count > 1 and company_id = 27) then  1
     when (visit_count > 1 and company_id = 23) then  1
     when (visit_count > 1 and company_id = 35) then 1
     else visit_count

end;



insert into ledger (active_date,visit_count,visit_process_count,location_id,reimbursement,total,company_id,guid,program_id,parent_id)
select TO_CHAR(active_date,'YYYY-MM-01')::date  as active_date, sum(visit_count) as visit_count, sum(visit_process_count) as visit_process_count,location_id, reimbursement, sum(total) as total,company_id,TO_CHAR(active_date,'YYYY-MM-01') as guid,program_id,parent_id from ledger_member  group by location_id,reimbursement,company_id,TO_CHAR(active_date,'YYYY-MM-01'),program_id,parent_id
ON CONFLICT (active_date,location_id, guid, program_id, parent_id,parent_id) DO UPDATE SET visit_count = EXCLUDED.visit_count, reimbursement = EXCLUDED.reimbursement, total = EXCLUDED.total;

insert into company_program (company_id,program_id,allowance,location_id,rate,status,sector_id,tier_id) 
select 16 as company_id, 35 as program_id, 10 as allowance, id as location_id, 15 as rate,1 as status, 2 as sector_id , 6 as tier_id from locations where company_id = 16
ON CONFLICT (company_id,program_id,rate,allowance,location_id,sector_id,tier_id) DO NOTHING;

insert into company_program (company_id,program_id,allowance,location_id,rate,status,sector_id,tier_id) 
select 16 as company_id, 34 as program_id, 4 as allowance, id as location_id, 15 as rate,1 as status, 1 as sector_id,1 as tier_id from locations where company_id = 16
ON CONFLICT (company_id,program_id,rate,allowance,location_id,sector_id,tier_id) DO NOTHING;

---

insert into company_program (company_id,program_id,allowance,location_id,rate,status,sector_id,tier_id) 
select 27 as company_id, 34 as program_id, 0 as allowance, id as location_id, 0 as rate,1 as status, 1 as sector_id,1 as tier_id from locations where company_id = 27
ON CONFLICT (company_id,program_id,rate,allowance,location_id,sector_id,tier_id) DO NOTHING;

insert into company_program (company_id,program_id,allowance,location_id,rate,status,sector_id,tier_id) 
select 27 as company_id, 34 as program_id, 0 as allowance, id as location_id, 0 as rate,1 as status, 1 as sector_id,2 as tier_id from locations where company_id = 27
ON CONFLICT (company_id,program_id,rate,allowance,location_id,sector_id,tier_id) DO NOTHING;

---

insert into company_program (company_id,program_id,allowance,location_id,rate,status,sector_id,tier_id) 
select 23 as company_id, 35 as program_id, 0 as allowance, id as location_id, 24 as rate,1 as status, 2 as sector_id,3 as tier_id from locations where company_id = 23
ON CONFLICT (company_id,program_id,rate,allowance,location_id,sector_id,tier_id) DO NOTHING;

insert into company_program (company_id,program_id,allowance,location_id,rate,status,sector_id,tier_id) 
select 23 as company_id, 35 as program_id, 0 as allowance, id as location_id, 24 as rate,1 as status, 2 as sector_id,4 as tier_id from locations where company_id = 23
ON CONFLICT (company_id,program_id,rate,allowance,location_id,sector_id,tier_id) DO NOTHING;

insert into company_program (company_id,program_id,allowance,location_id,rate,status,sector_id,tier_id) 
select 23 as company_id, 35 as program_id, 0 as allowance, id as location_id, 24 as rate,1 as status, 2 as sector_id,5 as tier_id from locations where company_id = 23
ON CONFLICT (company_id,program_id,rate,allowance,location_id,sector_id,tier_id) DO NOTHING;

insert into company_program (company_id,program_id,allowance,location_id,rate,status,sector_id,tier_id) 
select 23 as company_id, 35 as program_id, 0 as allowance, id as location_id, 24 as rate,1 as status, 2 as sector_id,6 as tier_id from locations where company_id = 23
ON CONFLICT (company_id,program_id,rate,allowance,location_id,sector_id,tier_id) DO NOTHING;

insert into company_program (company_id,program_id,allowance,location_id,rate,status,sector_id,tier_id) 
select 23 as company_id, 34 as program_id, 0 as allowance, id as location_id, 24 as rate,1 as status, 1 as sector_id,1 as tier_id from locations where company_id = 23
ON CONFLICT (company_id,program_id,rate,allowance,location_id,sector_id,tier_id) DO NOTHING;

insert into company_program (company_id,program_id,allowance,location_id,rate,status,sector_id,tier_id) 
select 23 as company_id, 34 as program_id, 0 as allowance, id as location_id, 24 as rate,1 as status, 1 as sector_id,2 as tier_id from locations where company_id = 23
ON CONFLICT (company_id,program_id,rate,allowance,location_id,sector_id,tier_id) DO NOTHING;

---

insert into company_program (company_id,program_id,allowance,location_id,rate,status,sector_id,tier_id) 
select 35 as company_id, 35 as program_id, 0 as allowance, id as location_id, 24 as rate,1 as status, 2 as sector_id,3 as tier_id from locations where company_id = 35
ON CONFLICT (company_id,program_id,rate,allowance,location_id,sector_id,tier_id) DO NOTHING;

insert into company_program (company_id,program_id,allowance,location_id,rate,status,sector_id,tier_id) 
select 35 as company_id, 35 as program_id, 0 as allowance, id as location_id, 24 as rate,1 as status, 2 as sector_id,4 as tier_id from locations where company_id = 35
ON CONFLICT (company_id,program_id,rate,allowance,location_id,sector_id,tier_id) DO NOTHING;

insert into company_program (company_id,program_id,allowance,location_id,rate,status,sector_id,tier_id) 
select 35 as company_id, 35 as program_id, 0 as allowance, id as location_id, 24 as rate,1 as status, 2 as sector_id,5 as tier_id from locations where company_id = 35
ON CONFLICT (company_id,program_id,rate,allowance,location_id,sector_id,tier_id) DO NOTHING;

insert into company_program (company_id,program_id,allowance,location_id,rate,status,sector_id,tier_id) 
select 35 as company_id, 35 as program_id, 0 as allowance, id as location_id, 24 as rate,1 as status, 2 as sector_id,6 as tier_id from locations where company_id = 35
ON CONFLICT (company_id,program_id,rate,allowance,location_id,sector_id,tier_id) DO NOTHING;

insert into company_program (company_id,program_id,allowance,location_id,rate,status,sector_id,tier_id) 
select 35 as company_id, 34 as program_id, 0 as allowance, id as location_id, 24 as rate,1 as status, 1 as sector_id,1 as tier_id from locations where company_id = 35
ON CONFLICT (company_id,program_id,rate,allowance,location_id,sector_id,tier_id) DO NOTHING;

insert into company_program (company_id,program_id,allowance,location_id,rate,status,sector_id,tier_id) 
select 35 as company_id, 34 as program_id, 0 as allowance, id as location_id, 24 as rate,1 as status, 1 as sector_id,2 as tier_id from locations where company_id = 35
ON CONFLICT (company_id,program_id,rate,allowance,location_id,sector_id,tier_id) DO NOTHING;


DROP TABLE IF EXISTS _report_detail;
DROP TABLE IF EXISTS _report_group_detail;
DROP TABLE IF EXISTS _amenities_location;
DROP TABLE IF EXISTS _report_amenities_detail;
DROP TABLE IF EXISTS _report_amenities;


CREATE TABLE _report_detail as 
select locations.id as ch_id,locations.club_id,company.name as brand ,locations.name as brand_location,locations.address as brand_address,locations.city as brand_city,locations.state as brand_state,locations.postal as brand_postal,locations.phone as brand_phone,programs.name as program_name, 

payment_required,

TO_CHAR(locations."createdAt",'YYYY-MM-DD') as enrolled, 
 
 
CASE WHEN locations.is_register_fee_not_required THEN false ELSE true END as credit_card_required,

CASE WHEN locations.amenities_required THEN false ELSE true END as amenities_waived,
public.user.fname,public.user.lname,public.user.email,public.user.phone,role.name as role_name,parent_id
  
 from company
left JOIN locations on locations.company_id = company.id
join company_program on company_program.location_id = locations.id and company_program.company_id = locations.company_id
 left join programs on programs.id = company_program.program_id
left join public.user on public.user.location_id = locations.id and public.user.role_id IN (1,3)
left join role on role.id = public.user.role_id
where company.id IN (16,23,27,35)
 -- and locations.status = 1

order by locations.id;


CREATE TABLE _report_group_detail as 
select * from _report_detail
group by ch_id,club_id,brand,brand_location,brand_address,brand_city,brand_state,brand_postal,brand_phone,program_name,credit_card_required,enrolled,fname,lname,email,phone,role_name,payment_required,amenities_waived,parent_id;


CREATE TABLE _amenities_location as
select location_id,created,updated from (
select location_id, coalesce(to_char( created, 'YYYY-mm-dd'),' ') as created,coalesce(to_char( updated, 'YYYY-mm-dd'),' ') as updated from amenities_location
left join _report_group_detail on _report_group_detail.ch_id = amenities_location.location_id
) a group by location_id,created,updated;

CREATE TABLE _report_amenities_detail as 
select _report_group_detail.*,_amenities_location.created,_amenities_location.updated,
  CASE WHEN _amenities_location.location_id IS NULL THEN false ELSE true END as completed_amenities,
  CASE WHEN stripe_payout_customers.stripe_customer_id IS NULL THEN false ELSE true END as card_on_file,
  CASE WHEN stripe_payout_customers.stripe_payout_method_id IS NULL THEN false ELSE true END as bank_on_file
from _report_group_detail
left join _amenities_location on _amenities_location.location_id = _report_group_detail.ch_id
left join stripe_payout_customers on stripe_payout_customers.location_id = _report_group_detail.ch_id;

update _report_amenities_detail set payment_required = a.payment_required,credit_card_required = a.credit_card_required,amenities_waived = a.amenities_waived, card_on_file = a.card_on_file,bank_on_file = a.bank_on_file  FROM 
(
select ch_id,email,payment_required,credit_card_required,amenities_waived,card_on_file,bank_on_file from _report_amenities_detail where ch_id IN (
    select parent_id from _report_group_detail where parent_id != -1 and role_name = 'Admin' group by parent_id
) group by ch_id,email,payment_required,credit_card_required,amenities_waived,card_on_file,bank_on_file
) a
where a.ch_id = _report_amenities_detail.parent_id;


update _report_amenities_detail set email = REPLACE (email, '+1', '');
update _report_amenities_detail set email = REPLACE (email, '+2', '');
update _report_amenities_detail set email = REPLACE (email, '+3', '');
update _report_amenities_detail set email = REPLACE (email, '+4', '');
update _report_amenities_detail set email = REPLACE (email, '+5', '');
update _report_amenities_detail set email = REPLACE (email, '+6', '');
update _report_amenities_detail set email = REPLACE (email, '+7', '');
update _report_amenities_detail set email = REPLACE (email, '+8', '');
update _report_amenities_detail set email = REPLACE (email, '+9', '');

DROP TABLE IF EXISTS _ledger_activity_detail;

CREATE TABLE _ledger_activity_detail AS

select cast(user_id as varchar) as confirmation_id, count(location_id), user_id as member_id,checkin::date ,location_id,program_id,0.0 as reimbursement,company_id,parent_id from (
select  "user".id as user_id,

case when activity.timestamp IS NULL THEN TO_CHAR("user"."timeStamp",'YYYY-MM-DD')
else TO_CHAR(activity.timestamp,'YYYY-MM-DD') 
end as checkin,

case when "user".source = 7 THEN 10238
 when "user".source = 8 THEN 10239
 when "user".source = 22 THEN 10240
 when "user".promocode IS NOT NULL THEN 10239
else api.location_id 
end as location_id,


case when "user".program_id IS NULL THEN 0
else  "user".program_id
end,

case when "user".source = 7 THEN 30
 when "user".source = 8 THEN 31
 when "user".source = 22 THEN 32
 when "user".promocode IS NOT NULL THEN 31

else api.company_id 
end as company_id,

-1 as parent_id from "user" 

left join activity on activity.user_id = "user".id
left join api on api.id = activity.client_id 

where  "user".program_id IN (34,35)

group by  "user".id,activity.timestamp,api.location_id,"user".program_id,api.company_id,parent_id

) as checkin_history group by user_id,checkin,location_id,program_id,company_id,parent_id;

update _ledger_activity_detail set count = 0 where location_id IS NULL;

-- update _ledger_activity_detail set reimbursement = 1 where count > 0 and location_id = 10240;
-- update _ledger_activity_detail set reimbursement = 1.25 where count > 0 and location_id = 10239;
-- update _ledger_activity_detail set reimbursement = 5.50 where count > 0 and location_id = 10238;

update _ledger_activity_detail set reimbursement = 0 where count > 0 and location_id = 10240;
update _ledger_activity_detail set reimbursement = 0 where count > 0 and location_id = 10239;
update _ledger_activity_detail set reimbursement = 0 where count > 0 and location_id = 10238;

update _ledger_activity_detail set confirmation_id = member_program.membership from member_program where member_program.user_id = _ledger_activity_detail.member_id;

update _ledger_activity_detail set reimbursement = company_program.rate from (select DISTINCT(_ledger_activity_detail.company_id),rate, _ledger_activity_detail.program_id from _ledger_activity_detail join company_program on company_program.company_id = _ledger_activity_detail.company_id and company_program.program_id = _ledger_activity_detail.program_id) company_program where company_program.company_id = _ledger_activity_detail.company_id and company_program.program_id = _ledger_activity_detail.program_id;

-- Les Mills
update _ledger_activity_detail set location_id = 10238
where _ledger_activity_detail.location_id IS NULL and _ledger_activity_detail.member_id IN (select id from public.user where source = 7);

 
-- Openfit
update _ledger_activity_detail set location_id = 10239
where _ledger_activity_detail.location_id IS NULL and _ledger_activity_detail.member_id IN (select id from public.user where source = 8);

-- Les Mills
update _ledger_activity_detail set location_id = 10240
where _ledger_activity_detail.location_id IS NULL and _ledger_activity_detail.member_id IN (select id from public.user where source = 22);
 


insert into ledger_activity_detail(confirmation_id,count,visit_count,member_id,active_date,location_id,program_id,reimbursement,company_id,parent_id) 
select confirmation_id,count,count,member_id,checkin,location_id,program_id,reimbursement,company_id,parent_id from _ledger_activity_detail
ON CONFLICT (confirmation_id,active_date,location_id,member_id,program_id,parent_id) DO UPDATE SET visit_count = EXCLUDED.visit_count,count = EXCLUDED.count, reimbursement = EXCLUDED.reimbursement;


insert into ledger_activity_member (active_date,visit_count,visit_process_count,location_id,reimbursement,total,company_id,guid,member_id,program_id,parent_id)
select TO_CHAR(active_date,'YYYY-MM-01')::date  as active_date,sum(visit_count) as visit_count,sum(visit_process_count) as visit_process_count,location_id, reimbursement,
0.0 as total,company_id,TO_CHAR(active_date,'YYYY-MM-01') as guid ,member_id,
case when program_id IS NULL THEN 0
else  program_id
end,parent_id from ledger_activity_detail 
 group by location_id,reimbursement,company_id,TO_CHAR(active_date,'YYYY-MM-01'),member_id,program_id,parent_id
ON CONFLICT (active_date,location_id,member_id,program_id,parent_id) DO UPDATE SET visit_process_count = EXCLUDED.visit_process_count,visit_count = EXCLUDED.visit_count;

update ledger_activity_member set visit_process_count  =
case when (visit_count > 4 and location_id = 10239) then 4
     when (visit_count > 1 and location_id = 10238) then 1
     when (visit_count > 1 and location_id = 10240) then 1
else (visit_count) end;


-- update ledger_activity_member set total  =
-- case when (visit_count > 4 and location_id = 10239) then 5.00
--      when (visit_count > 1 and location_id = 10238) then 5.50
--      when (visit_count > 1 and location_id = 10240) then 1.00
-- else (visit_count * reimbursement) end;


update ledger_activity_member set total  =
case when (visit_count > 4 and location_id = 10239) then 0
     when (visit_count > 1 and location_id = 10238) then 0
     when (visit_count > 1 and location_id = 10240) then 0
else (visit_count * reimbursement) end;


insert into ledger (active_date,visit_count,visit_process_count,location_id,reimbursement,total,company_id,guid,program_id,parent_id)
select TO_CHAR(active_date,'YYYY-MM-01')::date  as active_date, sum(visit_count) as visit_count,sum(visit_process_count) as visit_process_count,location_id, reimbursement, sum(total) as total,company_id,TO_CHAR(active_date,'YYYY-MM-01') as guid,program_id,parent_id from ledger_activity_member  where company_id IS NOT NULL and (location_id > 0 AND location_id IS NOT NULL) group by location_id,reimbursement,company_id,TO_CHAR(active_date,'YYYY-MM-01'),program_id,parent_id 
ON CONFLICT (active_date,location_id,guid,program_id,parent_id,parent_id) DO UPDATE SET visit_process_count = EXCLUDED.visit_process_count, visit_count = EXCLUDED.visit_count, reimbursement = EXCLUDED.reimbursement, total = EXCLUDED.total;
