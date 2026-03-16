*** Settings ***
Library    SeleniumLibrary

*** Variables ***
# --- System Variables ---
${HOMEPAGE}          http://www.google.com
${BROWSER}           Chrome
${URL_FRONTEND}      http://localhost:3000

# --- Test Data ---
${USER_NORMAL}       tester3
${PWD_NORMAL}        tester555
${USER_ADMIN}        tester2
${PWD_ADMIN}         tester555

# --- Locators: Global & Navigation ---
${BTN_LOGIN_PAGE}    //a[normalize-space()="เข้าสู่ระบบ"]
${INPUT_LOGIN_ID}    //*[@id="identifier"]
${INPUT_LOGIN_PWD}   //*[@id="password"]
${BTN_LOGIN_SUBMIT}  //button[normalize-space()="เข้าสู่ระบบ"]
${MENU_PROFILE}      //*[@id="__nuxt"]/div/div[1]/header/div/div[1]/nav/div[4]/div[1]
${MENU_DASHBOARD}    //*[@id="__nuxt"]/div/div[1]/header/div/div[1]/nav/div[4]/div[2]/a[2]
${MENU_SIDE_LOGS}    //*[@id="sidebar"]/div/nav/a[6]

# --- Locators: System Logs Page ---
${INPUT_SEARCH}      //*[@id="main-content"]/div/div/div[1]/div[2]/div[1]/input
${DROPDOWN_ACTION}   //select[option[@value="VIEW_DATA"]]
${INPUT_DATE_START}  //*[@id="main-content"]/div/div/div[1]/div[2]/div[3]/div/input[1]
${INPUT_DATE_END}    //*[@id="main-content"]/div/div/div[1]/div[2]/div[3]/div/input[2]
${BTN_SEARCH}        //*[@id="main-content"]/div/div/div[1]/div[2]/div[5]/button[1]
${BTN_OPEN_EXPORT}   //*[@id="main-content"]/div/div/div[1]/div[2]/div[5]/button[2]

# --- Locators: Export Modal ---
${BTN_SELECT_ALL}    //*[@id="__nuxt"]/div/div[1]/main/div/div/div[2]/div[2]/div[1]/button
${CHK_EXPORT_1}      //*[@id="__nuxt"]/div/div[1]/main/div/div/div[2]/div[2]/div[2]/label[1]/input
${CHK_EXPORT_2}      //*[@id="__nuxt"]/div/div[1]/main/div/div/div[2]/div[2]/div[2]/label[2]/input
${BTN_CONFIRM_EXP}   //*[@id="__nuxt"]/div/div[1]/main/div/div/div[2]/div[3]/button[2]


*** Test Cases ***
Open Systemlogs
    [Setup]    Setup Admin And Go To Logs
    Page Should Contain    System Logs (บันทึกกิจกรรมระบบ)
    [Teardown]    Close Browser

Non admin cannot access
    [Setup]    Setup Normal User And Go To Home
    Mouse Over    xpath=${MENU_PROFILE}
    Wait Until Element Is Visible    xpath=//div[contains(@class, 'dropdown')]    timeout=5s    # รอให้ Dropdown กางออก
    Page Should Not Contain    Dashboard
    [Teardown]    Close Browser

Correct Logs
    [Setup]    Setup Admin And Go To Logs
    Input Text      xpath=${INPUT_DATE_START}    03032026
    Input Text      xpath=${INPUT_DATE_END}      03032026
    Click Button    xpath=${BTN_SEARCH}
    Sleep    2s     # รอ API โหลดข้อมูลตาราง
    Page Should Contain    03 มี.ค. 2569
    [Teardown]    Close Browser

Date range filter
    [Setup]    Setup Admin And Go To Logs
    Input Text      xpath=${INPUT_DATE_START}    03032026
    Input Text      xpath=${INPUT_DATE_END}      03032026
    Click Button    xpath=${BTN_SEARCH}
    Sleep    2s     # รอ API โหลดข้อมูลตาราง
    Page Should Not Contain    04 มี.ค. 2569
    [Teardown]    Close Browser

Action Filter
    [Setup]    Setup Admin And Go To Logs
    Select From List By Value    xpath=${DROPDOWN_ACTION}    VIEW_DATA
    Click Button                 xpath=${BTN_SEARCH}
    Sleep    2s     # รอ API โหลดข้อมูลตาราง
    Page Should Contain          VIEW_DATA
    Page Should Not Contain      message: User logged in successfully
    [Teardown]    Close Browser

Verify select all
    [Setup]    Setup Admin And Go To Logs
    Click Button                     xpath=${BTN_OPEN_EXPORT}
    Wait Until Page Contains         ตั้งค่าการ Export ข้อมูล    timeout=10s
    Click Button                     xpath=${BTN_SELECT_ALL}
    Page Should Contain              ยืนยันการ Export (9)
    [Teardown]    Close Browser

Verify number of export data
    [Setup]    Setup Admin And Go To Logs
    Click Button                     xpath=${BTN_OPEN_EXPORT}
    Wait Until Page Contains         ตั้งค่าการ Export ข้อมูล    timeout=10s
    Select Checkbox                  xpath=${CHK_EXPORT_1}
    Select Checkbox                  xpath=${CHK_EXPORT_2}
    Page Should Contain              ยืนยันการ Export (2)
    [Teardown]    Close Browser

Export file success
    [Setup]    Setup Admin And Go To Logs
    Input Text                       xpath=${INPUT_SEARCH}    tester2
    Click Button                     xpath=${BTN_SEARCH}
    Sleep    2s
    
    Click Button                     xpath=${BTN_OPEN_EXPORT}
    Wait Until Page Contains         ตั้งค่าการ Export ข้อมูล    timeout=10s
    
    Click Button                     xpath=${BTN_SELECT_ALL}
    Click Button                     xpath=${BTN_CONFIRM_EXP}
    
    # กรณีที่มี Alert เด้งขึ้นมายืนยันการดาวน์โหลด
    Wait Until Keyword Succeeds      5s    1s    Handle Alert    ACCEPT
    [Teardown]    Close Browser


*** Keywords ***
# --- Setup Actions ---
Setup Admin And Go To Logs
    Open website
    Login Flow    ${USER_ADMIN}    ${PWD_ADMIN}
    Go to Dashboard
    Click Element                    xpath=${MENU_SIDE_LOGS}
    Wait Until Page Contains         System Logs (บันทึกกิจกรรมระบบ)    timeout=10s

Setup Normal User And Go To Home
    Open website
    Login Flow    ${USER_NORMAL}    ${PWD_NORMAL}
    Wait Until Page Contains         บัญชีของฉัน    timeout=10s    # รอให้เข้าสู่ระบบสำเร็จ

# --- Reusable UI Actions ---
Open website
    Open Browser               ${HOMEPAGE}    ${BROWSER}
    Maximize Browser Window
    Go To                      ${URL_FRONTEND}

Login Flow
    [Arguments]    ${usr}    ${pwd}
    Wait Until Element Is Visible    xpath=${BTN_LOGIN_PAGE}    timeout=10s
    Click Element                    xpath=${BTN_LOGIN_PAGE}
    Wait Until Element Is Visible    xpath=${INPUT_LOGIN_ID}    timeout=5s
    Input Text                       xpath=${INPUT_LOGIN_ID}    ${usr}
    Input Text                       xpath=${INPUT_LOGIN_PWD}   ${pwd}
    Click Button                     xpath=${BTN_LOGIN_SUBMIT}

Go to Dashboard
    Wait Until Element Is Visible    xpath=${MENU_PROFILE}      timeout=10s
    Mouse Over                       xpath=${MENU_PROFILE}
    Wait Until Element Is Visible    xpath=${MENU_DASHBOARD}    timeout=5s
    Click Element                    xpath=${MENU_DASHBOARD}
    Wait Until Page Contains         User Management            timeout=10s