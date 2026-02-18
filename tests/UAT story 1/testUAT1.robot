*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${homepage}    http://www.google.com
${browser}     Chrome
${Url}      http://localhost:3000/

${username}				   tester
${password}                tester555


*** Test Cases ***
Open System Logs
    Open website
	
	Login
	
	Go to Dashboard
	Sleep    3s
	
	Click System Logs Button
	
	Close Browser


Check for login logs
	Open website
	
	Login
	
	Go to Dashboard
	Sleep    3s
	
	Click System Logs Button
	
	Page Should Contain    loginMethod: username
	
	Close Browser

	
Search for specific User
	Open website
	
	Login
	
	Go to Dashboard
	Sleep    3s
	
	Click System Logs Button
	
	Input Text    xpath=//*[@id="main-content"]/div/div/div[1]/div[2]/div[1]/input    		admin123
	Page Should Not Contain    tester
	
	Close Browser
	
Filter for specific Logs
	Open website
	
	Login
	
	Go to Dashboard
	Sleep    3s
	
	Click System Logs Button
	
	Wait Until Element Is Visible    xpath=//select[contains(@class,"bg-white")]    10s
	Select From List By Value        xpath=//select[contains(@class,"bg-white")]    UPDATE_DATA
	Sleep    2s
	
	Page Should Contain    UPDATE_DATA
	
	Close Browser
	


*** Keywords ***
Login
	Sleep    3s
	Wait Until Page Contains    เดินทางร่วมกัน อย่างมั่นใจ ด้วยความปลอดภัยเป็นอันดับหนึ่ง    timeout=10s
	Click Element    xpath=//a[normalize-space()="เข้าสู่ระบบ"] 
	
	Sleep    3s
	Input Text    id=identifier       	${username}
	Input Text    id=password    		${password}
	Sleep    5s
	Click Button    xpath=//button[normalize-space()="เข้าสู่ระบบ"]
	
Open website
    Open Browser    ${homepage}    ${browser}
	Maximize Browser Window
    Go To    ${Url}
	
Go to Dashboard
	Sleep    5s
	Mouse Over    xpath=//*[@id="__nuxt"]/div/div[1]/header/div/div[1]/nav/div[4]/div[1]
	 Sleep    5s
	  Click Element    xpath=//*[@id="__nuxt"]/div/div[1]/header/div/div[1]/nav/div[4]/div[2]/a[2]
	Wait Until Page Contains    User Management    timeout=10s

Click System Logs Button
    Click Element    xpath=//*[@id="sidebar"]/div/nav/a[6]
	Wait Until Page Contains    System Logs (บันทึกกิจกรรมระบบ)    timeout=10s   
	Sleep    2s