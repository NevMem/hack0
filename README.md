# std::Queue

## API methods of application server

Every method can be made by POST-request to `server-address/<methodName>?<params>`

### join
   Joins room with specified pin. It is possible to specify a token obtained earlier.
   
  `join([token], pin)`
  
   Returns 'token' (if it was not given, one is created), using which user can interact with specified room. If request failed returns 'err' - error description.

### leave
   Leves room with specified pin.
   
  `leave(token, pin)`
  
   If request was successful, returns empty object, otherwise returns 'err' -- error description

### myposition
	
   Returns user's position in the queue and some extra information

   `myposition(token, pin)`

   If request was successful, returns 'position' - number of people left in the queue before user, 'served' - person in the front of the queue, 'next' - the next user after 'served', 'qid' -- unique number assigned to current user when he joined the line.

### getname
   
   Returns the name of the line by it's pin

   `getname(pin)`

   If request was successful, returns 'name' - name of the line