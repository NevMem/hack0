# std::Queue

## API methods of application server

Every method can be made by POST-request to `server-adress/<methodName>?<params>`

### join
   Joins room with specified pin. It is possible to specify a token obtained earlier.
  `join([token], pin)`
   Returns 'token' (if it was not given, one is created), using which user can ineract with specified room. If request failed returns 'err' - error description.

### leave
   Leves room with specified pin.
  `leave(token, pin)`
   If request was successfull, returns empty object, otherwise returns 'err' -- error description
