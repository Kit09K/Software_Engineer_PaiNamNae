*** Settings ***
Library    RequestsLibrary
Library    Collections
Library    OperatingSystem
Library    SeleniumLibrary

*** Variables ***
${homepage}    http://www.google.com
${browser}     Chrome
${URL}    http://localhost:8080
${URL_FRONTEND}    http://localhost:3000
${ENDPOINT}    /api/users
${NATIONAL_ID_PHOTO}    ${CURDIR}/../../img/id.png
${SELFIE_PHOTO}         ${CURDIR}/../../img/selfie.png
${USER_ID}				NONE
${OTP_CODE}				NONE
${ACCESS_TOKEN}         NONE

${username}				   tester
${email}                   tester1@gmail.com
${password}               tester555

${username2}				tester2
${password2}                tester555

${username3}				tester3
${password3}                tester555

${ADMIN_TOKEN}			NONE




*** Test Cases ***
Cannot delete when have route
	Open website
	Login 2

	Go to Profile
	Click delete button
	
	Page Should Contain    ไม่สามารถลบข้อมูลบัญชีได้เนื่องจาก:
	Close Browser

Cancel Delete
	Register

	Open website
	Login
	Get Login Token From Cookie

	Go to Profile
	Click delete button
	
	Sleep    2s
	Click Element    xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div/main/div/div[2]/div/div[4]/label/span
	Click Button    xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div/main/div/div[2]/div/div[5]/button
	
	Get OTP
	
	Sleep    2s
	Input Text    xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div[2]/div/input    ${OTP_CODE}
	Click Button    xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div[2]/div/div[2]/button[1]
	
	Page Should Not Contain    ระบบได้ส่งรหัส OTP ไปยังอีเมลของคุณแล้ว
	Close Browser

	Delete Created User
	Sleep    2s

Delete and Login
	Register

	Open website
	Login
	Get Login Token From Cookie

	Go to Profile
	Click delete button
	
	Sleep    2s
	Click Element    xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div/main/div/div[2]/div/div[4]/label/span
	Click Button    xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div/main/div/div[2]/div/div[5]/button
	
	Get OTP
	
	Sleep    2s
	Input Text    xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div[2]/div/input    ${OTP_CODE}
	Click Button    xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div[2]/div/div[2]/button[2]
	Sleep    4s
	
	Handle Alert    ACCEPT
	
	Login
	Page Should Contain    เข้าสู่ระบบไม่สำเร็จ
	Close Browser

	Delete Created User
	Sleep    2s

Wrong OTP
	Register

	Open website
	Login
	Get Login Token From Cookie

	Go to Profile
	Click delete button
	
	Sleep    2s
	Click Element    xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div/main/div/div[2]/div/div[4]/label/span
	Click Button    xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div/main/div/div[2]/div/div[5]/button
	
	Sleep    2s
	Input Text    xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div[2]/div/input    123456
	Click Button    xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div[2]/div/div[2]/button[2]
	Sleep    5s
	
	Handle Alert    ACCEPT
	
	Close Browser
	
	Delete Created User
	Sleep    2s
	
Delete Success
	Register

	Open website
	Login
	Get Login Token From Cookie

	Go to Profile
	Click delete button
	
	Sleep    2s
	Click Element    xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div/main/div/div[2]/div/div[4]/label/span
	Click Button    xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div/main/div/div[2]/div/div[5]/button
	
	Get OTP
	
	Sleep    2s
	Input Text    xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div[2]/div/input    ${OTP_CODE}
	Click Button    xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div[2]/div/div[2]/button[2]
	Sleep    4s
	
	Handle Alert    ACCEPT
	
	Close Browser

	Delete Created User
	Sleep    2s
	
Expire OTP
	Register

	Open website
	Login
	Get Login Token From Cookie

	Go to Profile
	Click delete button
	
	Sleep    2s
	Click Element    xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div/main/div/div[2]/div/div[4]/label/span
	Click Button    xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div/main/div/div[2]/div/div[5]/button
	
	Get OTP
	
	Sleep    301s
	Input Text    xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div[2]/div/input    ${OTP_CODE}
	Click Button    xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div[2]/div/div[2]/button[2]
	Sleep    4s
	
	Handle Alert    ACCEPT
	
	Close Browser

	Delete Created User
	Sleep    2s	




*** Keywords ***
Get Login Token From Cookie
    ${cookie}=    Get Cookie    token
    Set Test Variable    ${ACCESS_TOKEN}    ${cookie.value}

Background login
	Create Session    mysession    ${URL}
	
	${login_payload}=    Create Dictionary
	...    username=${username}
	...    password=${password}
	
	${login_response}=    POST On Session
	...    mysession
	...    /api/auth/login
	...    json=${login_payload}
	
	${login_body}=    Set Variable    ${login_response.json()}
	Set Test Variable    ${ACCESS_TOKEN}    ${login_body["data"]["token"]}

Get OTP
	Create Session    mysession    ${URL}
	
	${headers}=    Create Dictionary
    ...    Authorization=Bearer ${ACCESS_TOKEN}
	
	${otp_response}=    GET On Session
    ...    mysession
    ...    /api/otp/get-for-testing
	...    headers=${headers}
	
	${otp_body}=    Set Variable    ${otp_response.json()}
	${otp_code}=    Set Variable    ${otp_body["otpCode"]}
	
	Set Test Variable    ${OTP_CODE}    ${otp_code}

Click delete button
    Click Element    xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div/aside/nav/div[4]/a/div/span
	Sleep    2s
	Page Should Contain    ลบข้อมูลบัญชี
	Sleep    2s

Go to Profile
	Sleep    2s
	Mouse Over    xpath=//*[@id="__nuxt"]/div/div[1]/header/div/div[1]/nav/div[4]/div[1]
	 Sleep    2s
	  Click Element    xpath=//a[normalize-space()="บัญชีของฉัน"]
	Wait Until Page Contains    โปรไฟล์ของฉัน    timeout=10s
	
Login
	Sleep    3s
	Click Element    xpath=//a[normalize-space()="เข้าสู่ระบบ"] 
	
	Sleep    3s
	Input Text    id=identifier       	${username}
	Input Text    id=password    		${password}
	Sleep    2s
	Click Button    xpath=//button[normalize-space()="เข้าสู่ระบบ"]
	Sleep    2s
	
Login 2
	Sleep    3s
	Click Element    xpath=//a[normalize-space()="เข้าสู่ระบบ"] 
	
	Sleep    3s
	Input Text    id=identifier       	${username3}
	Input Text    id=password    		${password3}
	Sleep    2s
	Click Button    xpath=//button[normalize-space()="เข้าสู่ระบบ"]
	Sleep    2s

Open website
    Open Browser    ${homepage}    ${browser}
	Maximize Browser Window
    Go To    ${URL_FRONTEND}
	
Register
	Create Session    mysession    ${URL}
	
    ${form_data}=    Create Dictionary
    ...    email=${email}
    ...    username=${username}
    ...    password=${password}
    ...    firstName=John
    ...    lastName=Doe
    ...    phoneNumber=0123456789
    ...    gender=MALE
    ...    nationalIdNumber=1234567891232
    ...    nationalIdExpiryDate=2547-06-06T00:00:00.000Z
    ...    role=PASSENGER

	${file1}=    Evaluate    ("id.png", open(r"${NATIONAL_ID_PHOTO}", "rb"), "image/png")
	${file2}=    Evaluate    ("selfie.png", open(r"${SELFIE_PHOTO}", "rb"), "image/png")

	${files}=    Create Dictionary
	...    nationalIdPhotoUrl=${file1}
	...    selfiePhotoUrl=${file2}
	
    ${response}=    POST On Session
    ...    mysession
    ...    ${ENDPOINT}
    ...    data=${form_data}
    ...    files=${files}
	
	${body}=    Set Variable    ${response.json()}
	${user_id}=    Set Variable    ${body["data"]["id"]}
	
	Set Test Variable    ${USER_ID}    ${user_id}
	
    Status Should Be    201    ${response}
    Log    ${response.text}

Delete Created User
	Create Session    mysession    ${URL}
	
	${login_payload}=    Create Dictionary
	...    username=${username2}
	...    password=${password2}
	
	${login_response}=    POST On Session
	...    mysession
	...    /api/auth/login
	...    json=${login_payload}
	
	${login_body}=    Set Variable    ${login_response.json()}
	Set Test Variable    ${ADMIN_TOKEN}    ${login_body["data"]["token"]}

	${headers}=    Create Dictionary
    ...    Authorization=Bearer ${ADMIN_TOKEN}
	
    Run Keyword And Ignore Error
    ...    DELETE On Session
    ...    mysession
    ...    /api/users/admin/${USER_ID}
	...    headers=${headers}