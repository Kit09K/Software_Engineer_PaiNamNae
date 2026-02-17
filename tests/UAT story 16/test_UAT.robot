*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${homepage}    http://www.google.com
${browser}     Chrome
${pnnUrl}      http://localhost:3000/

${username}				   tester
${email}                   thesun1145@gmail.com
${password}                tester555

${firstname}               John
${lastname}                Doe
${phone}                   0123456789
${gender}				   male

${idCard}    			   ${CURDIR}/testdata/idcard.jpg
${idnumber}				   1234567891234
${expirydate}			   01012580

*** Test Cases ***
Create Account:
	Open PNN website
	
	Go to Register page
	Register step 1
	Register step 2
	Register step 3
	Register success
	
	Close Browser
	
Cancel Delete Account:
	Open PNN website
	
	Login
	Go to Home page
	Go to Profile
	Cancel Delete
	
	Close Browser

Delete Account Success:
	Open PNN website
	
	Login
	Go to Home page
	Go to Profile
	Delete Account
	
	Close Browser

*** Keywords ***
Open PNN website
    Open Browser    ${homepage}    ${browser}
	Maximize Browser Window
    Go To    ${pnnUrl}
	
Go to Register page
	Sleep    5s
	Wait Until Page Contains    เดินทางร่วมกัน อย่างมั่นใจ ด้วยความปลอดภัยเป็นอันดับหนึ่ง    timeout=10s
	Click Element    xpath=//a[normalize-space()="สมัครสมาชิก"]

Register step 1
	Wait Until Page Contains    ข้อมูลบัญชีผู้ใช้    timeout=10s
    Input Text    id=username    		${username}
    Input Text    id=email    			${email}
    Input Text    id=password    		${password}
    Input Text    id=confirmPassword    ${password}
	Sleep    5s
	Click Button    xpath=//button[normalize-space()="ถัดไป"]
	
Register step 2
	Wait Until Page Contains    ข้อมูลส่วนตัว    timeout=10s
	Input Text    id=firstName       	${firstname}
    Input Text    id=lastName          	${lastname}
    Input Text    id=phoneNumber   		${phone}
    Click Element    xpath=//input[@name="gender" and @value="female"]
	Sleep    5s
	Click Button    xpath=//button[normalize-space()="ถัดไป"]
	
Register step 3
	Wait Until Page Contains    ยืนยันตัวตน    timeout=10s
	Choose File    id=idCardFile    ${idCard}
	Input Text    id=idNumber       	${idnumber}
	Input Text    id=expiryDate       	${expirydate}
	Choose File    id=selfieFile    ${idCard}
	Select Checkbox    xpath:(//input[@type='checkbox'])[1]
	Sleep    5s
	Click Button    xpath=//button[normalize-space()="สมัครสมาชิก"]
	
Register success
	Wait Until Page Contains    สมัครสมาชิกเรียบร้อยแล้ว    timeout=10s
	Sleep    7s
	
Login
	Sleep    5s
	Wait Until Page Contains    เดินทางร่วมกัน อย่างมั่นใจ ด้วยความปลอดภัยเป็นอันดับหนึ่ง    timeout=10s
	Click Element    xpath=//a[normalize-space()="เข้าสู่ระบบ"]
	Input Text    id=identifier       	${email}
	Input Text    id=password    		${password}
	Sleep    5s
	Click Button    xpath=//button[normalize-space()="เข้าสู่ระบบ"]
	
Login after Register
	Wait Until Page Contains    เข้าสู่ระบบ    timeout=10s
	Input Text    id=identifier       	${email}
	Input Text    id=password    		${password}
	Sleep    5s
	Click Button    xpath=//button[normalize-space()="เข้าสู่ระบบ"]
	
Go to Home page
    Sleep    2s
	Wait Until Page Contains    เดินทางร่วมกัน อย่างมั่นใจ ด้วยความปลอดภัยเป็นอันดับหนึ่ง    timeout=10s
	Wait Until Page Contains    ${firstname}    timeout=10s
	
Go to Profile
	Sleep    5s
	#hover mouse to profile settings
	Mouse Over    xpath=//*[@id="__nuxt"]/div/div[1]/header/div/div[1]/nav/div[4]/div[1]
	 Sleep    5s
	  Click Element    xpath=//a[normalize-space()="บัญชีของฉัน"]
	Wait Until Page Contains    โปรไฟล์ของฉัน    timeout=10s
	
Cancel Delete
	Sleep    5s
	Click Button    xpath=//button[normalize-space()="ลบบัญชีของฉัน"]
	Wait Until Page Contains    ยืนยันการลบบัญชีผู้ใช้    timeout=10s
	Input Text    id=deletePassword    		${password}
	Sleep    5s
	Click Button    xpath=//button[normalize-space()="ยืนยันการลบ"]
	Sleep    5s
	
Delete Account
	Sleep    5s
	Click Button    xpath=//button[normalize-space()="ลบบัญชีของฉัน"]
	Wait Until Page Contains    ยืนยันการลบบัญชีผู้ใช้    timeout=10s
	Input Text    id=deletePassword    		${password}
	Sleep    5s
	Click Button    xpath=//button[normalize-space()="ยกเลิก"]
	Sleep    5s