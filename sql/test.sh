curl --location --request POST 'https://partner-uat.b2b.dailyburnapis.com/v1/organizations/optum-dailyburn-renewactive/users:addOrganizationUser' \
--header 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjlkZjU4NmQxZGM0NDQxOTYyYTdmY2E5OGEwNWZmOTI5N2YzZWUxNWMifQ.eyJpc3MiOiJvcHR1bTJAdWFwaS1zdGFnaW5nLmlhbS5nc2VydmljZWFjY291bnQuY29tIiwiYXVkIjoiaHR0cHM6Ly9wYXJ0bmVyLmIyYi5kYWlseWJ1cm5hcGlzLmNvbS8iLCJleHAiOjE2NDAwNDMyMTYsImlhdCI6MTY0MDAzOTYxNiwic3ViIjoib3B0dW0yQHVhcGktc3RhZ2luZy5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSJ9.xJ8wob8bZdQMxBOxOKW2lqVOPes0vMg919QnPl_BiW3Cj_zsff18qujqVvZg3IDTf0EjzzDCBdXmZJpmc_WMLYWNUUTwheS9I_0rryyO9gOWTE2_wgJILGEhklAw-enWMuxYIE59rb_4ffw3lIOLOfQL0bg73_wvtyZ5wzZ09l2MV0RH4ExddBtX2EcG1jRodP5f6_sQOBM65mc4lxCYOntIYOFFoVnARldI5VUlOCHi0By0mJ0XliZlVy0FWrUICefMa0D7uKzAljO5zBT3MjmWQcdahWUpbi_Pcn_8Jg7Wzl6eu8WrSA6exEFXQL0Ek4iN2rvIiVnPO9sgQKeAjg' \
--header 'Content-Type: application/json' \
--data-raw '{
  "user": {
    "email": "john.doe@partner-domain.com",
    "password": "UserPassword",
    "given_name": "John",
    "family_name": "Doe"
  }
}'