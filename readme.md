##RestApi with MySQL DB and JWT AUTH

All logic in index.js file

All config info in app/config/app.js

Controller DB in app/controllers/db.js

Generation token in app/helpers/authHelpers.js

Token verify and refresh in app/middelware/authHeaders.js


where you may set a 

    - db host, 
        port, 
        username, 
        password, 
        database, 
        sock
    - appPort server port
    - saltRounds user password salt Number,
    - jwtString solt of from JWT
    - jwtToken expires time and
    - uploadsFolder

#####PLEASE REMEMBER add mysql db configuration in path ./app/config/app.js file 
install node dependencies

    -npm i

To start the app use this command

    -npm start  
    or
    -mpm run start

 by default server start in 3333 port
 
 routes you will can use
 

    -/signin
    -/signin/new_token
    -/logout
    -/signup
    -/info
    -/file/upload
    -/file/list/
    -/file/:id 
    -/file/delete/:id 
    -/file/download/:id 
    -/file/update/:id 
    -/latency