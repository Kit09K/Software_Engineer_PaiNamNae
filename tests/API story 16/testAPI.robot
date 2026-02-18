*** Settings ***
Library           RequestsLibrary
Library           Collections
Library           OperatingSystem

Suite Setup       Create API Session


*** Variables ***
${LOGIN_ENDPOINT}        /auth/login
${DELETE_ENDPOINT}       /delete/account
${BASE_URL}        http://localhost:3000/api
${EMAIL}           test@test.com
${PASSWORD}        tester555


*** Keywords ***
Create API Session
    Create Session    api    ${BASE_URL}    verify=True


*** Test Cases ***
User Can Delete Account Successfully

    Create Session    api    ${BASE_URL}

    ${login_body}=    Create Dictionary
    ...    email=test@test.com
    ...    password=123456

    ${login}=    POST On Session
    ...    api
    ...    /auth/login
    ...    json=${login_body}

    Should Be Equal As Integers    ${login.status_code}    200

    ${token}=    Set Variable    ${login.json()['data']['token']}

    ${headers}=    Create Dictionary
    ...    Authorization=Bearer ${token}

    ${delete_body}=    Create Dictionary
    ...    deleteAccount=${True}
    ...    deleteVehicles=${False}
    ...    deleteRoutes=${False}
    ...    deleteBookings=${False}
    ...    sendEmailCopy=${False}

    ${res}=    POST On Session
    ...    api
    ...    /delete/account
    ...    json=${delete_body}
    ...    headers=${headers}

    Should Be Equal As Integers    ${res.status_code}    201