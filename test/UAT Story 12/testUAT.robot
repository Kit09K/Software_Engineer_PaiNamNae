*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL_FRONTEND}          http://localhost:3000
${BROWSER}               Chrome

# --- Users ---
${DRIVER_USER}           tester2
${DRIVER_PWD}            tester555
${PASSENGER_USER}        tester3
${PASSENGER_PWD}         tester555

# --- Locators: Driver ---
${BTN_NOTIFY_PASSENGER}    //button[normalize-space()="แจ้งเตือนผู้โดยสาร"]
${BTN_TEXT_FOR_NOTIFY}     //*[@id="__nuxt"]/div/div[1]/main/div/div[2]/div/div[1]/button[4]
${SEND_BTN}				   //*[@id="__nuxt"]/div/div[1]/main/div/div[2]/div/div[3]/button[2]
${TOAST_SUCCESS}           //*[@id="__nuxt"]/div/div[2]/div/div
${DRIVER_INBOX}            //div[@id="driver-messages"]

# --- Locators: Passenger ---
${WEB_NOTIFICATION}       //*[@id="__nuxt"]/div/div[1]/header/div/div[1]/nav/div[3]/button
${MSG_DRIVER_ARRIVING}    กำลังหาที่จอดรถครับ
${CHAT_ELEMENT}			  //*[@id="__nuxt"]/div/div[1]/div
${BTN_ACKNOWLEDGE}        //*[@id="__nuxt"]/div/div[1]/div/div[2]/button[2]
${SEND_BACK_MSG_BTN}      //*[@id="__nuxt"]/div/div[1]/div/div[3]/button[2]

*** Test Cases ***
TC-UAT-06: Passenger Blocked Notification Permission
    ${options}=    Evaluate    sys.modules['selenium.webdriver'].ChromeOptions()    sys, selenium.webdriver
    Call Method    ${options}    add_argument    --disable-notifications
    Open Browser   ${URL_FRONTEND}    ${BROWSER}    alias=Passenger_No_Notif    options=${options}
	Maximize Browser Window
    Login Flow     ${PASSENGER_USER}    ${PASSENGER_PWD}
    
    Open Browser   ${URL_FRONTEND}    ${BROWSER}    alias=Driver_Browser
	Maximize Browser Window
    Login Flow     ${DRIVER_USER}       ${DRIVER_PWD}
    Go To Driver Route Page
    Click Button      xpath=${BTN_NOTIFY_PASSENGER}
	Click Button      xpath=${BTN_TEXT_FOR_NOTIFY}
	Click Button	  xpath=${SEND_BTN}
    
    Switch Browser    Passenger_No_Notif
	Sleep    5s
    Click Button    ${WEB_NOTIFICATION}
	Wait Until Page Contains    Notification    timeout=5s
	Sleep    10s
    Page Should Contain     just now
	[Teardown]    Close All Browsers
	
TC-UAT-05: Driver Get Response
	[Setup]    Open Driver And Passenger Browsers
    Switch Browser    Driver_Browser
	Sleep    2s
	Go To Driver Route Page
    Click Button      xpath=${BTN_NOTIFY_PASSENGER}
	Click Button      xpath=${BTN_TEXT_FOR_NOTIFY}
	Click Button	  xpath=${SEND_BTN}
    Wait Until Page Contains Element    xpath=${TOAST_SUCCESS}    timeout=5s
    Page Should Contain    ส่งข้อความสำเร็จ

    Switch Browser    Passenger_Browser
	Sleep    2s
	Wait Until Page Contains Element    xpath=${CHAT_ELEMENT}
	Click Button    xpath=${BTN_ACKNOWLEDGE}
	Click Button    xpath=${SEND_BACK_MSG_BTN}
	
	Switch Browser    Driver_Browser
	Sleep    2s
	Click Button    ${WEB_NOTIFICATION}
	Wait Until Page Contains    Notification    timeout=5s
    Page Should Contain     โอเคครับ
	[Teardown]    Close All Browsers

TC-UAT-04: Passenger Response
	[Setup]    Open Driver And Passenger Browsers
    Switch Browser    Driver_Browser
	Sleep    2s
	Go To Driver Route Page
    Click Button      xpath=${BTN_NOTIFY_PASSENGER}
	Click Button      xpath=${BTN_TEXT_FOR_NOTIFY}
	Click Button	  xpath=${SEND_BTN}
    Wait Until Page Contains Element    xpath=${TOAST_SUCCESS}    timeout=5s
    Page Should Contain    ส่งข้อความสำเร็จ

    Switch Browser    Passenger_Browser
	Sleep    2s
	Wait Until Page Contains Element    xpath=${CHAT_ELEMENT}
	Click Button    xpath=${BTN_ACKNOWLEDGE}
	Click Button    xpath=${SEND_BACK_MSG_BTN}
	[Teardown]    Close All Browsers

TC-UAT-03: Right Notification
	[Setup]    Open Driver And Passenger Browsers
    Switch Browser    Driver_Browser
	Sleep    2s
	Go To Driver Route Page
    Click Button      xpath=${BTN_NOTIFY_PASSENGER}
	Click Button      xpath=${BTN_TEXT_FOR_NOTIFY}
	Click Button	  xpath=${SEND_BTN}
    Wait Until Page Contains Element    xpath=${TOAST_SUCCESS}    timeout=5s
    Page Should Contain    ส่งข้อความสำเร็จ

    Switch Browser    Passenger_Browser
	Sleep    2s
	Click Button    ${WEB_NOTIFICATION}
	Wait Until Page Contains    Notification    timeout=5s
	Page Should Contain              ${MSG_DRIVER_ARRIVING}
    Page Should Contain              Jane Doe
	[Teardown]    Close All Browsers

TC-UAT-02: Passenger Get Notification
	[Setup]    Open Driver And Passenger Browsers
    Switch Browser    Driver_Browser
	Sleep    2s
	Go To Driver Route Page
    Click Button      xpath=${BTN_NOTIFY_PASSENGER}
	Click Button      xpath=${BTN_TEXT_FOR_NOTIFY}
	Click Button	  xpath=${SEND_BTN}
    Wait Until Page Contains Element    xpath=${TOAST_SUCCESS}    timeout=5s
    Page Should Contain    ส่งข้อความสำเร็จ

    Switch Browser    Passenger_Browser
	Sleep    2s
	Click Button    ${WEB_NOTIFICATION}
	Wait Until Page Contains    Notification    timeout=5s
    Page Should Contain     just now
	[Teardown]    Close All Browsers
	
TC-UAT-01: Driver Send Notification
	[Setup]    Open Driver And Passenger Browsers
    Switch Browser    Driver_Browser
	Sleep    2s
	Go To Driver Route Page
    Click Button      xpath=${BTN_NOTIFY_PASSENGER}
	Click Button      xpath=${BTN_TEXT_FOR_NOTIFY}
	Click Button	  xpath=${SEND_BTN}
    Wait Until Page Contains Element    xpath=${TOAST_SUCCESS}    timeout=5s
    Page Should Contain    ส่งข้อความสำเร็จ
	[Teardown]    Close All Browsers

*** Keywords ***
Open Driver And Passenger Browsers
	${prefs}=      Create Dictionary    profile.default_content_setting_values.notifications=1
    ${options}=    Evaluate    sys.modules['selenium.webdriver'].ChromeOptions()    sys, selenium.webdriver
    
    Open Browser    ${URL_FRONTEND}    ${BROWSER}    options=${options}    alias=Passenger_Browser     
    Maximize Browser Window
    Login Flow      ${PASSENGER_USER}  ${PASSENGER_PWD}
	
	Open Browser    ${URL_FRONTEND}    ${BROWSER}    options=${options}    alias=Driver_Browser        
    Maximize Browser Window
    Login Flow      ${DRIVER_USER}     ${DRIVER_PWD}

Open Browser And Login Driver Only
	${prefs}=      Create Dictionary    profile.default_content_setting_values.notifications=1
    ${options}=    Evaluate    sys.modules['selenium.webdriver'].ChromeOptions()    sys, selenium.webdriver
	
    Open Browser    ${URL_FRONTEND}    ${BROWSER}    options=${options    alias=Driver_Browser
    Maximize Browser Window
    Login Flow      ${DRIVER_USER}     ${DRIVER_PWD}

Login Flow
    [Arguments]    ${usr}    ${pwd}
    Wait Until Page Contains Element    //a[normalize-space()="เข้าสู่ระบบ"]    timeout=5s
    Click Element    //a[normalize-space()="เข้าสู่ระบบ"]
    Wait Until Element Is Visible    id=identifier    timeout=5s
    Input Text       id=identifier    ${usr}
    Input Text       id=password      ${pwd}
    Click Button     //button[normalize-space()="เข้าสู่ระบบ"]
    Sleep    2s
	
Go To Driver Route Page
	Wait Until Page Contains Element    xpath=//*[@id="__nuxt"]/div/div[1]/header/div/div[1]/nav/div[2]/div/a    timeout=5s
	Mouse Over                       xpath=//*[@id="__nuxt"]/div/div[1]/header/div/div[1]/nav/div[2]/div/a
    Wait Until Element Is Visible    xpath=//*[@id="__nuxt"]/div/div[1]/header/div/div[1]/nav/div[2]/div/div/a[2]    timeout=5s
    Click Element                    xpath=//*[@id="__nuxt"]/div/div[1]/header/div/div[1]/nav/div[2]/div/div/a[2]
	Wait Until Page Contains    	 คำขอจองเส้นทางของฉัน    timeout=5s
	Sleep    2s
	Click Button					 xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div[2]/div/button[5]

Auto Allow Notification
    ${prefs}=      Create Dictionary    profile.default_content_setting_values.notifications=1
    ${options}=    Evaluate    sys.modules['selenium.webdriver'].ChromeOptions()    sys, selenium.webdriver
    Call Method    ${options}    add_experimental_option    prefs    ${prefs}
    Open Browser   ${URL_FRONTEND}    ${BROWSER}    options=${options}
    Maximize Browser Window