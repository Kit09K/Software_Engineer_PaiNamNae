*** Settings ***
Library    RequestsLibrary
Library    Collections

*** Variables ***
${BASE_URL}          http://localhost:8080
${DRIVER_TOKEN}      DRIVER_TOKEN   # ใส่ Token จำลองของคนขับที่นี่
${PASSENGER_TOKEN}   PASSENGER_TOKEN   # ใส่ Token จำลองของผู้โดยสารที่นี่

# --- Test Data ---
${VALID_USER_ID}     USER_ID_THAT_HAVE_BOOKING
${INVALID_USER_ID}   invalid_user_999
${VALID_BOOKING_ID}  VALID_BOOKING_ID
${OTHER_BOOKING_ID}  OTHER__VALID_BOOKING_ID

*** Test Cases ***
# ==========================================
# 1. SUBSCRIBE API TESTS
# ==========================================
Subscribe Success
    [Documentation]    Save Subscription Success (201)
    ${payload}=    Create Valid Subscription Payload
    ${headers}=    Create Auth Header    ${PASSENGER_TOKEN}
    
    ${response}=    POST    url=${BASE_URL}/api/push-notifications/subscribe    json=${payload}    headers=${headers}    expected_status=201
    Dictionary Should Contain Key    ${response.json()}    success
    Should Be True                   ${response.json()["success"]}

Subscribe Unauthorized
    [Documentation]    Send API Subscribe Without Token (401)
    ${payload}=    Create Valid Subscription Payload
    ${headers}=    Create Dictionary    Content-Type=application/json
    
    ${response}=    POST    url=${BASE_URL}/api/push-notifications/subscribe    json=${payload}    headers=${headers}    expected_status=401
    Should Be Equal As Strings       ${response.json()["message"]}    Not authorized, no token

Subscribe Bad Request
    [Documentation]    Send API Subscribe With Lack Of Data (400)
    ${payload}=    Create Dictionary    subscription=${EMPTY}
    ${headers}=    Create Auth Header    ${PASSENGER_TOKEN}
    
    ${response}=    POST    url=${BASE_URL}/api/push-notifications/subscribe    json=${payload}    headers=${headers}    expected_status=400
    Should Be Equal As Strings       ${response.json()["error"]}    Invalid subscription data

# ==========================================
# 2. SEND PUSH NOTIFICATION API TESTS
# ==========================================
Send Push Success
    [Documentation]    Test Push Notification Success (200)
    ${payload}=    Create Dictionary    targetUserId=${VALID_USER_ID}    title=Test Title    body=Test Body    url=/
    ${headers}=    Create Auth Header    ${DRIVER_TOKEN}
    
    ${response}=    POST    url=${BASE_URL}/api/push-notifications/send    json=${payload}    headers=${headers}    expected_status=200
    Should Be True                   ${response.json()["success"]}

Send Push Missing Fields
    [Documentation]    Test Push Without title (400)
    ${payload}=    Create Dictionary    targetUserId=${VALID_USER_ID}    body=Test Body
    ${headers}=    Create Auth Header    ${DRIVER_TOKEN}
    
    ${response}=    POST    url=${BASE_URL}/api/push-notifications/send    json=${payload}    headers=${headers}    expected_status=400
    Should Be Equal As Strings       ${response.json()["error"]}    Missing targetUserId or title

Send Push User Not Found
    [Documentation]    Test Push to None Subscribe User (404)
    ${payload}=    Create Dictionary    targetUserId=${INVALID_USER_ID}    title=Hello
    ${headers}=    Create Auth Header    ${DRIVER_TOKEN}
    
    ${response}=    POST    url=${BASE_URL}/api/push-notifications/send    json=${payload}    headers=${headers}    expected_status=404
    Should Be Equal As Strings       ${response.json()["message"]}    No subscriptions found for this user

# ==========================================
# 3. NOTIFY PICKUP API TESTS
# ==========================================
Notify Pickup Success
    [Documentation]    Driver Send Notification Success (200)
    ${payload}=    Create Dictionary    bookingId=${VALID_BOOKING_ID}
    ${headers}=    Create Auth Header    ${DRIVER_TOKEN}
    
    ${response}=    POST    url=${BASE_URL}/api/push-notifications/notify-pickup    json=${payload}    headers=${headers}    expected_status=200
    Should Be True                   ${response.json()["success"]}
    Dictionary Should Contain Key    ${response.json()["data"]}    id
    Should Be Equal As Strings       ${response.json()["data"]["type"]}    BOOKING

Notify Pickup Forbidden
    [Documentation]    Driver Notify Other Booking (403)
    ${payload}=    Create Dictionary    bookingId=${OTHER_BOOKING_ID}
    ${headers}=    Create Auth Header    ${DRIVER_TOKEN}
    
    ${response}=    POST    url=${BASE_URL}/api/push-notifications/notify-pickup    json=${payload}    headers=${headers}    expected_status=403
    Should Contain                   ${response.json()["error"]}    Unauthorized: You are not the driver for this route

Notify Pickup Booking Not Found
    [Documentation]    Driver Notify Fake Booking (404)
    ${payload}=    Create Dictionary    bookingId=invalid_booking_999
    ${headers}=    Create Auth Header    ${DRIVER_TOKEN}
    
    ${response}=    POST    url=${BASE_URL}/api/push-notifications/notify-pickup    json=${payload}    headers=${headers}    expected_status=404
    Should Be Equal As Strings       ${response.json()["error"]}    Booking not found


*** Keywords ***
Create Auth Header
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    RETURN         ${headers}

Create Valid Subscription Payload
    ${keys}=            Create Dictionary    p256dh=BGM_fake_key    auth=rmwk_fake_auth
    ${subscription}=    Create Dictionary    endpoint=https://fcm.googleapis.com/fcm/send/fake    expirationTime=${None}    keys=${keys}
    ${payload}=         Create Dictionary    subscription=${subscription}
    RETURN              ${payload}