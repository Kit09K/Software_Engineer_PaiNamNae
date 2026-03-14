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
Export file success
	Open website
	Login 2
	
	Go to Dashboard
	
	Click Element    xpath=//*[@id="sidebar"]/div/nav/a[6]
	Sleep    2s
	
	Input Text    xpath=//*[@id="main-content"]/div/div/div[1]/div[2]/div[1]/input    tester2
	Click Button    xpath=//*[@id="main-content"]/div/div/div[1]/div[2]/div[5]/button[1]
	Sleep    2s
	
	Click Button    xpath=//*[@id="main-content"]/div/div/div[1]/div[2]/div[5]/button[2]  
	Wait Until Page Contains    ตั้งค่าการ Export ข้อมูล    timeout=10s
	
	Click Button    xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div[2]/div[2]/div[1]/button
	Click Button    xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div[2]/div[3]/button[2]
	Sleep    2s
	
	Handle Alert    ACCEPT
	
	Close Browser

Action Filter
	Open website
	Login 2
	
	Go to Dashboard
	
	Click Element    xpath=//*[@id="sidebar"]/div/nav/a[6]
	Sleep    2s
	
	Select From List By Value    xpath://select[option[@value="VIEW_DATA"]]    VIEW_DATA
	Click Button    xpath=//*[@id="main-content"]/div/div/div[1]/div[2]/div[5]/button[1]
	Sleep    2s
	
	Page Should Contain    VIEW_DATA
	Page Should Not Contain    message: User logged in successfully
	
	Close Browser

Date range filter
	Open website
	Login 2
	
	Go to Dashboard
	
	Click Element    xpath=//*[@id="sidebar"]/div/nav/a[6]
	Sleep    2s
	
	Input Text    xpath=//*[@id="main-content"]/div/div/div[1]/div[2]/div[3]/div/input[1]    03032026
	Input Text    xpath=//*[@id="main-content"]/div/div/div[1]/div[2]/div[3]/div/input[2]    03032026
	Sleep    1s
	
	Click Button    xpath=//*[@id="main-content"]/div/div/div[1]/div[2]/div[5]/button[1]
	Sleep    1s
	
	Page Should Not Contain    04 มี.ค. 2569
	Close Browser

Correct Logs
	Open website
	Login 2
	
	Go to Dashboard
	
	Click Element    xpath=//*[@id="sidebar"]/div/nav/a[6]
	Sleep    2s
	
	Page Should Contain    03 มี.ค. 2569
	Close Browser

Non admin cannot access
	Open website
	Login
	
	Mouse Over    xpath=//*[@id="__nuxt"]/div/div[1]/header/div/div[1]/nav/div[4]/div[1]
	Page Should Not Contain    Dashboard
	Close Browser
	
Open Systemlogs
	Open website
	Login 2
	
	Go to Dashboard
	
	Click Element    xpath=//*[@id="sidebar"]/div/nav/a[6]
	Sleep    2s
	
	Page Should Contain    System Logs (บันทึกกิจกรรมระบบ)
	Close Browser
	

	


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

Go to Dashboard
	Sleep    2s
	Mouse Over    xpath=//*[@id="__nuxt"]/div/div[1]/header/div/div[1]/nav/div[4]/div[1]
	 Sleep    2s
	  Click Element    xpath=//*[@id="__nuxt"]/div/div[1]/header/div/div[1]/nav/div[4]/div[2]/a[2]
	Wait Until Page Contains    User Management    timeout=10s

Login
	Sleep    3s
	Click Element    xpath=//a[normalize-space()="เข้าสู่ระบบ"] 
	
	Sleep    3s
	Input Text    id=identifier       	${username3}
	Input Text    id=password    		${password3}
	Sleep    2s
	Click Button    xpath=//button[normalize-space()="เข้าสู่ระบบ"]
	Sleep    2s
	
Login 2
	Sleep    3s
	Click Element    xpath=//a[normalize-space()="เข้าสู่ระบบ"] 
	
	Sleep    3s
	Input Text    id=identifier       	${username2}
	Input Text    id=password    		${password2}
	Sleep    2s
	Click Button    xpath=//button[normalize-space()="เข้าสู่ระบบ"]
	Sleep    2s

Open website
    Open Browser    ${homepage}    ${browser}
	Maximize Browser Window
    Go To    ${URL_FRONTEND}
	