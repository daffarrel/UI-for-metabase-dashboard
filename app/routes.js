var dbconfig = require('../config/database');
var mysql = require('mysql');
var connection = mysql.createConnection(dbconfig.connection); 
var bcrypt = require('bcrypt-nodejs');
var bodyParser = require('body-parser');
var urlencodedparser = bodyParser.urlencoded({extended:false})
var Intercom = require('intercom-client');
var client = new Intercom.Client({ token: process.env.TOKEN });

module.exports = function(app,passport) {



      app.get('/',isLoggedIn,function(req,res){
        res.render('index.ejs'); 
    });


    app.get('/community', function(req, res) {
        var row = [];
        var row2=[];
        var row3=[];

        connection.query('select * from client where client_id = ?',[req.user.client_id], function (err, rows) {
            if (err) {
                console.log(err);
            } else {
                if (rows.length) {
                    for (var i = 0, len = rows.length; i < len; i++) {  //query den gelen bütün parametreleri rows sınıfına ekliyoruz .
                        row[i] = rows[i];
                        
                    }  
                }
                        
            }

            
         connection.query('select * from client inner join post on client.client_id = post.client_id', function (err, rows2) {
                if (err) {
                    console.log(err);
                } else {
                    if (rows2.length) {
                        for (var i = 0, len = rows2.length; i < len; i++) {  //query den gelen bütün parametreleri rows sınıfına ekliyoruz .
                            row3[i] = rows2[i];
                        }  
                    }            
                }
        res.render('community.ejs', {rows : row,rows3:row3});     
            }); 
        });
    });



    // Get all campaigns
     app.get('/api/campaigns',isLoggedIn,function(req,res){
        var row = [];
        connection.query('select * from campaign where client_id = ?',[req.user.client_id], function (err, rows) {
            
            res.json(rows);
        });
      
    });

         // Get all campaigns
     app.get('/api/intercom',isLoggedIn,function(req,res){
 
        // client.users.list(function (d) {
            client.admins.list(function (d) {
         // d is the response from the server
            console.log(d);
            res.json(d);
        });
    });

           // Get row for the logged in user (i.e. client)
    app.get('/api/user',isLoggedIn,function(req,res){
        var row = [];
        connection.query('select * from client where client_id = ?',[req.user.client_id], function (err, rows) {
            
            res.json(rows);
        });
      
    });

     // Get all LinkedIn Users of the logged in client

     app.get('/api/users',isLoggedIn,function(req,res){
        var row = [];
        connection.query("select concat(user_first_name, ' ', user_last_name) as fullname from user where client_id = ?",[req.user.client_id], function (err, rows) {
            
            res.json(rows);
        });
      
    });


    // Get all campaigns
     app.get('/api/messageStats',isLoggedIn,function(req,res){
        connection.query("select DATE_FORMAT(message.message_sent_date, '%M %d, %Y') as message_date, count(case when message_type = 'invite' then 1 else null end) as invites, count(case when message_type = 'message' then 1 else null end) as followups, count(case when message_type = 'second_message' then 1 else null end) as second_followups, count(case when message_type = 'response' then 1 else null end) as responses from client cl inner join campaign c on (c.client_id = cl.client_id) inner join user u on (u.client_id = c.client_id) inner join campaign_user cu on (u.user_id = cu.user_id and cu.campaign_id = c.campaign_id) inner join message as message on (u.user_id = message.user_id and message.campaign_id = cu.campaign_id) inner join receiver r on (r.receiver_id = message.receiver_id) where cl.client_analytics_code = ? and cl.client_analytics_code is not null group by date(message.message_sent_date)",[req.user.client_analytics_code], function (err, rows) {
            
            res.json(rows);
        });
      
    });
  

    app.get('/api/todos',function(req,res){
        var row = [];
      connection.query('select * from client inner join post on client.client_id = post.client_id', function (err, rows) {
            if (err) {
                console.log(err);
            } else {
                if (rows.length) {
                    for (var i = 0, len = rows.length; i < len; i++) {  //query den gelen bütün parametreleri rows sınıfına ekliyoruz .
                        row[i] = rows[i];
                    }  
                }
                console.log(row);
                
            }
            res.json(rows);
            
        });
    });

    app.get('/api/viewcomments/:postID',function(req,res){
        var postID = req.params.postID;
        var row = [];
        console.log(postID);
        connection.query('select client.client_email as u ,t1.y as t,t1.idsi as idsi1 from (select comment.comment_id as k,comment.text as y,comment.client_id as x,post.post_id as idsi from comment inner join post on post.post_id = comment.post_id where post.post_id= "'+postID+'" ) as t1 , client where client.client_id = t1.x  order by k desc limit 4 ', function (err, rows) {
            if (err) {
                console.log(err);
            } else {
                if (rows.length) {
                    for (var i = 0, len = rows.length; i < len; i++) {  //query den gelen bütün parametreleri rows sınıfına ekliyoruz .
                        row[i] = rows[i];
                    }  
                }
                console.log(row);
                
            }
            res.json(rows);
            
        });
    });

    app.post('/api/todos',function(req,res){
        var row = [];
        var row2=[];
        connection.query('select * from client where client_id = ?',[req.user.client_id], function (err, rows) {
            if (err) {
                console.log(err);
            } else {
                if (rows.length) {
                    for (var i = 0, len = rows.length; i < len; i++) {  //query den gelen bütün parametreleri rows sınıfına ekliyoruz .
                        row[i] = rows[i];  
                    }  
                }
                console.log(row);
            }
            connection.query('insert into post(text,client_id,likes) values("'+req.body.gonderi_icerik+'","'+req.user.client_id+'",0)');
            connection.query('select * from client inner join post on client.client_id = post.client_id',function(err,rows2){
                if(err){
                    console.log(err);
                }else{
                    res.json(rows2);
                }
                
            })
        });
  });


    app.post('/api/comments/:postID',isLoggedIn,function(req,res){
        var postID = req.params.postID;
        var comment = req.body.commenttext;
        connection.query('insert into comment(text,client_id,post_id) values("'+comment+'","'+req.user.client_id+'","'+postID+'")')


    });


    app.get('/api/viewlikes/:postID',isLoggedIn,function(req,res){
        var postID = req.params.postID;
        var row = [];
      connection.query('select likes from post where post_id=?',[postID], function (err, rows) {
            if (err) {
                console.log(err);
            } else {
                if (rows.length) {
                    for (var i = 0, len = rows.length; i < len; i++) {  //query den gelen bütün parametreleri rows sınıfına ekliyoruz .
                        row[i] = rows[i];
                    }  
                }
                console.log(row);
                
            }
            res.json(rows);
            
        });
    });

    app.get('/api/like/:postID',isLoggedIn,function(req,res){
        console.log("like post");
        var postID = req.params.postID;
        connection.query("update post set likes=likes+1 where post_id='"+postID+"'")
      
    });



    app.get('/error',function(req,res){

        res.render("error.ejs");

    });

    app.get('/login', function(req, res) {
        
        res.render('login.ejs',{ message: req.flash('loginMessage') });

    });

    app.get('/signup', function(req, res){
        res.render('signup.ejs',{message: req.flash('message')});
      });

    app.post('/signup', passport.authenticate('local-signup', {
            successRedirect: '/',
            failureRedirect: '/signup',
            failureFlash : true 
    }));

    app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/', 
            failureRedirect : '/login',
            failureFlash : true 
        }),
        function(req, res) {
            console.log("hello");

            if (req.body.remember) {
              req.session.cookie.maxAge = 1000 * 60 * 3;
            } else {
              req.session.cookie.expires = false;
            }
        res.redirect('/');
    });
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });


};


function isLoggedIn(req,res,next){
	if(req.isAuthenticated())
		return next();
	res.redirect('/login');
}

