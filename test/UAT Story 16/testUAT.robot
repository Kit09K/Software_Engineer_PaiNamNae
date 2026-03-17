*** Settings ***
Library    RequestsLibrary
Library    Collections
Library    OperatingSystem
Library    SeleniumLibrary

*** Variables ***
# --- System Variables ---
${HOMEPAGE}          http://www.google.com
${BROWSER}           Chrome
${URL}               http://localhost:8080
${URL_FRONTEND}      http://localhost:3000
${ENDPOINT}          /api/users
${NATIONAL_ID_PHOTO}	${CURDIR}/../../img/id.png
${SELFIE_PHOTO}      ${CURDIR}/../../img/selfie.png

# --- Test Data ---
${USER_ID}           NONE
${OTP_CODE}          NONE
${ACCESS_TOKEN}      NONE
${ADMIN_TOKEN}       NONE

# Test Data For Create
${USERNAME}          tester
${EMAIL}             tester1@gmail.com
${PASSWORD}          tester555

${USERNAME2}         ADMIN_USERNAME
${PASSWORD2}         ADMIN_PASSWORD

${USERNAME3}         USER_THAT_HAVE_ROUTE
${PASSWORD3}         USER_THAT_HAVE_ROUTE

# --- UI Locators ---
${MENU_PROFILE}           //a[normalize-space()="บัญชีของฉัน"]
${MENU_DEL_ACC}           //*[@id="__nuxt"]/div/div[1]/main/div/div/div/aside/nav/div[4]/a/div/span
${BTN_LOGIN_PAGE}         //a[normalize-space()="เข้าสู่ระบบ"]
${INPUT_LOGIN_ID}         //*[@id="identifier"]
${INPUT_LOGIN_PWD}        //*[@id="password"]
${BTN_LOGIN_SUBMIT}       //button[normalize-space()="เข้าสู่ระบบ"]

# Checkboxes for backup data
${CHK_BACKUP_PROFILE}     //*[@id="__nuxt"]/div/div[1]/main/div/div/div/main/div/div[2]/div/div[2]/div/label[1]/input
${CHK_BACKUP_CAR}         //*[@id="__nuxt"]/div/div[1]/main/div/div/div/main/div/div[2]/div/div[2]/div/label[2]/input
${CHK_BACKUP_ROUTE}       //*[@id="__nuxt"]/div/div[1]/main/div/div/div/main/div/div[2]/div/div[2]/div/label[3]/input
${CHK_BACKUP_RESERVE}     //*[@id="__nuxt"]/div/div[1]/main/div/div/div/main/div/div[2]/div/div[2]/div/label[4]/input

# Agreement & Actions
${LBL_AGREEMENT}          //*[@id="__nuxt"]/div/div[1]/main/div/div/div/main/div/div[2]/div/div[5]/label
${CHK_AGREEMENT_INPUT}    //*[@id="__nuxt"]/div/div[1]/main/div/div/div/main/div/div[2]/div/div[5]/label/div/input
${BTN_REQ_DEL}            //*[@id="__nuxt"]/div/div[1]/main/div/div/div/main/div/div[2]/div/div[6]/button

# OTP Modal
${INPUT_OTP}              //*[@id="__nuxt"]/div/div[1]/main/div/div/div[2]/div/input
${BTN_CANCEL_OTP}         //*[@id="__nuxt"]/div/div[1]/main/div/div/div[2]/div/div[2]/button[1]
${BTN_CONFIRM_OTP}        //*[@id="__nuxt"]/div/div[1]/main/div/div/div[2]/div/div[2]/button[2]


*** Test Cases ***
Cancel Delete
    [Setup]    Setup New User And Login
    Go to Delete Account Page
    Request OTP For Deletion
    Cancel OTP Prompt
    Page Should Not Contain    ระบบได้ส่งรหัส OTP ไปยังอีเมลของคุณแล้ว
    [Teardown]    Teardown Test

Cannot delete when have route
    [Setup]    Setup User 2 And Login
    Go to Delete Account Page
	Sleep    2s
    Page Should Contain    ไม่สามารถลบข้อมูลบัญชีได้เนื่องจาก:
    [Teardown]    Close Browser

Delete and login
    [Setup]    Setup New User And Login
    Go to Delete Account Page
    Request OTP For Deletion
    Submit OTP    ${OTP_CODE}
    Handle Alert    ACCEPT
    Login Flow    ${USERNAME}    ${PASSWORD}
    Page Should Contain    เข้าสู่ระบบไม่สำเร็จ
    [Teardown]    Teardown Test

Delete Success
    [Setup]    Setup New User And Login
    Go to Delete Account Page
    Request OTP For Deletion
    Submit OTP    ${OTP_CODE}
    Handle Alert    ACCEPT
    [Teardown]    Teardown Test

Wrong OTP
    [Setup]    Setup New User And Login
    Go to Delete Account Page
    Request OTP For Deletion    select_backup=${FALSE}
    Submit OTP    123456
    Handle Alert    ACCEPT
    [Teardown]    Teardown Test

Able to press delete button
    [Setup]    Setup New User And Login
    Go to Delete Account Page
	Wait Until Element Is Visible    xpath=${LBL_AGREEMENT}    timeout=5s
    Click Element    xpath=${LBL_AGREEMENT}
	Wait Until Element Is Visible    xpath=${CHK_AGREEMENT_INPUT}    timeout=5s
    Checkbox Should Be Selected    xpath=${CHK_AGREEMENT_INPUT}
    Element Should Be Enabled      xpath=${BTN_REQ_DEL}
    [Teardown]    Teardown Test

Can't delete if didn't select agreement
    [Setup]    Setup New User And Login
    Go to Delete Account Page
	Wait Until Element Is Visible    xpath=${CHK_AGREEMENT_INPUT}    timeout=5s
    Checkbox Should Not Be Selected    xpath=${CHK_AGREEMENT_INPUT}
    Element Should Be Disabled         xpath=${BTN_REQ_DEL}
    [Teardown]    Teardown Test

All Checkbox Should be able to select and deselect
    [Setup]    Setup User 2 And Login
    Go to Delete Account Page
    
	Wait Until Element Is Visible    xpath=${CHK_BACKUP_PROFILE}    timeout=5s
    Select Checkbox    xpath=${CHK_BACKUP_PROFILE}
    Select Checkbox    xpath=${CHK_BACKUP_CAR}
    Select Checkbox    xpath=${CHK_BACKUP_ROUTE}
    Select Checkbox    xpath=${CHK_BACKUP_RESERVE}
    
    Checkbox Should Be Selected    xpath=${CHK_BACKUP_PROFILE}
    Checkbox Should Be Selected    xpath=${CHK_BACKUP_CAR}
    Checkbox Should Be Selected    xpath=${CHK_BACKUP_ROUTE}
    Checkbox Should Be Selected    xpath=${CHK_BACKUP_RESERVE}
    
    Unselect Checkbox    xpath=${CHK_BACKUP_PROFILE}
    Unselect Checkbox    xpath=${CHK_BACKUP_CAR}
    Unselect Checkbox    xpath=${CHK_BACKUP_ROUTE}
    Unselect Checkbox    xpath=${CHK_BACKUP_RESERVE}
    
    Checkbox Should Not Be Selected    xpath=${CHK_BACKUP_PROFILE}
    Checkbox Should Not Be Selected    xpath=${CHK_BACKUP_CAR}
    Checkbox Should Not Be Selected    xpath=${CHK_BACKUP_ROUTE}
    Checkbox Should Not Be Selected    xpath=${CHK_BACKUP_RESERVE}
    [Teardown]    Close Browser

Checkbox Should be disable
    [Setup]    Setup New User And Login
    Go to Delete Account Page
	Wait Until Element Is Visible    xpath=${CHK_BACKUP_CAR}    timeout=5s
    Element Should Be Disabled         xpath=${CHK_BACKUP_CAR}
    Checkbox Should Not Be Selected    xpath=${CHK_BACKUP_CAR}
    [Teardown]    Teardown Test

Expire OTP
    [Setup]    Setup New User And Login
    Go to Delete Account Page
    Request OTP For Deletion
    Sleep    301s    # Note: Long explicit waits should ideally be mocked at API level if possible
    Submit OTP    ${OTP_CODE}
    Handle Alert    ACCEPT
    [Teardown]    Teardown Test


*** Keywords ***
# --- Test Setup & Teardown ---
Setup New User And Login
    Register API
    Open website
    Login Flow    ${USERNAME}    ${PASSWORD}
    Get Login Token From Cookie

Setup User 2 And Login
    Open website
    Login Flow    ${USERNAME3}    ${PASSWORD3}

Teardown Test
    Close Browser
    Delete Created User API

# --- High-Level UI Actions ---
Go to Delete Account Page
    Mouse Over                       //*[@id="__nuxt"]/div/div[1]/header/div/div[1]/nav/div[4]/div[1]
    Wait Until Element Is Visible    xpath=${MENU_PROFILE}    timeout=5s
    Click Element                    xpath=${MENU_PROFILE}
    Wait Until Page Contains         โปรไฟล์ของฉัน           timeout=10s
    
    Wait Until Element Is Visible    xpath=${MENU_DEL_ACC}    timeout=5s
    Click Element                    xpath=${MENU_DEL_ACC}
    Wait Until Page Contains         ลบข้อมูลบัญชี           timeout=5s

Request OTP For Deletion
    [Arguments]    ${select_backup}=${TRUE}
	Wait Until Element Is Visible    xpath=${CHK_BACKUP_PROFILE}    timeout=5s
    Run Keyword If    ${select_backup}    Select Checkbox    xpath=${CHK_BACKUP_PROFILE}
    Wait Until Element Is Visible    xpath=${LBL_AGREEMENT}    timeout=5s
    Click Element                    xpath=${LBL_AGREEMENT}
    Wait Until Element Is Enabled    xpath=${BTN_REQ_DEL}      timeout=5s
    Click Button                     xpath=${BTN_REQ_DEL}
    Get OTP API

Submit OTP
    [Arguments]    ${otp_val}
    Wait Until Element Is Visible    xpath=${INPUT_OTP}    timeout=10s
    Input Text                       xpath=${INPUT_OTP}    ${otp_val}
    Click Button                     xpath=${BTN_CONFIRM_OTP}
    Sleep    2s    # Wait for API process (Consider replacing with Wait Until Page Contains/Does Not Contain)

Cancel OTP Prompt
    Wait Until Element Is Visible    xpath=${INPUT_OTP}    timeout=10s
    Input Text                       xpath=${INPUT_OTP}    ${OTP_CODE}
    Click Button                     xpath=${BTN_CANCEL_OTP}

Login Flow
    [Arguments]    ${usr}    ${pwd}
    Wait Until Element Is Visible    xpath=${BTN_LOGIN_PAGE}    timeout=10s
    Click Element                    xpath=${BTN_LOGIN_PAGE}
    Wait Until Element Is Visible    xpath=${INPUT_LOGIN_ID}    timeout=5s
    Input Text                       xpath=${INPUT_LOGIN_ID}    ${usr}
    Input Text                       xpath=${INPUT_LOGIN_PWD}   ${pwd}
    Click Button                     xpath=${BTN_LOGIN_SUBMIT}
    Sleep    2s    # Wait for login process

Open website
    Open Browser               ${HOMEPAGE}    ${BROWSER}
    Maximize Browser Window
    Go To                      ${URL_FRONTEND}

Get Login Token From Cookie
    ${cookie}=    Get Cookie    token
    Set Test Variable    ${ACCESS_TOKEN}    ${cookie.value}

# --- API Actions ---
Register API
    Create Session    mysession    ${URL}
    ${form_data}=    Create Dictionary    email=${EMAIL}    username=${USERNAME}    password=${PASSWORD}    firstName=John    lastName=Doe    phoneNumber=0123456789    gender=MALE    nationalIdNumber=1234567891232    nationalIdExpiryDate=2547-06-06T00:00:00.000Z    role=PASSENGER
    ${file1}=    Evaluate    ("id.png", open(r"${NATIONAL_ID_PHOTO}", "rb"), "image/png")
    ${file2}=    Evaluate    ("selfie.png", open(r"${SELFIE_PHOTO}", "rb"), "image/png")
    ${files}=    Create Dictionary    nationalIdPhotoUrl=${file1}    selfiePhotoUrl=${file2}
    
    ${response}=    POST On Session    mysession    ${ENDPOINT}    data=${form_data}    files=${files}
    Status Should Be    201    ${response}
    ${body}=    Set Variable    ${response.json()}
    Set Test Variable    ${USER_ID}    ${body["data"]["id"]}

Get OTP API
    Create Session    mysession    ${URL}
    ${headers}=    Create Dictionary    Authorization=Bearer ${ACCESS_TOKEN}
    ${otp_response}=    GET On Session    mysession    /api/otp/get-for-testing    headers=${headers}
    ${body}=    Set Variable    ${otp_response.json()}
    Set Test Variable    ${OTP_CODE}    ${body["otpCode"]}

Delete Created User API
    Create Session    mysession    ${URL}
    ${login_payload}=    Create Dictionary    username=${USERNAME2}    password=${PASSWORD2}
    ${login_response}=    POST On Session    mysession    /api/auth/login    json=${login_payload}
    ${body}=    Set Variable    ${login_response.json()}
    Set Test Variable    ${ADMIN_TOKEN}    ${body["data"]["token"]}
    
    ${headers}=    Create Dictionary    Authorization=Bearer ${ADMIN_TOKEN}
    Run Keyword And Ignore Error    DELETE On Session    mysession    /api/users/admin/${USER_ID}    headers=${headers}