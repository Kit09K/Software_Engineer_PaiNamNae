*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${homepage}    http://www.google.com
${browser}     Chrome
${Url}      http://localhost:3000/

${username}				   tester
${email}                   thesun1145@gmail.com
${password}                tester555

${username2}				tester2
${password2}                tester555

${firstname}               John
${lastname}                Doe
${phone}                   0123456789
${gender}				   male

${idCard}    			   ${CURDIR}/testdata/IDCard.jpg
${selfie}    			   ${CURDIR}/testdata/RealFace.jpg
${idnumber}				   1234567891234
${expirydate}			   01012580

*** Test Cases ***
Delete and get email
	Open website
	
	Login
	Go to Profile
	Sleep    3s
	
	Click delete button
	
	Click Element    xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div/main/div/div[1]/div/label[1]/span
	Click Element    xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div/main/div/div[1]/label[2]/span
	Click Button    xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div/main/div/div[2]/button
	Sleep    2s
	
	Input Text    xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div[2]/div/input    confirm
	Click Button    xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div[2]/div/div/button[2]
	Sleep    2s
	
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
	
Login tester2
	Sleep    3s
	Input Text    id=identifier       	${username2}
	Input Text    id=password    		${password2}
	Sleep    5s
	Click Button    xpath=//button[normalize-space()="เข้าสู่ระบบ"]
	
Open website
    Open Browser    ${homepage}    ${browser}
	Maximize Browser Window
    Go To    ${Url}
	
Go to Profile
	Sleep    5s
	Mouse Over    xpath=//*[@id="__nuxt"]/div/div[1]/header/div/div[1]/nav/div[4]/div[1]
	 Sleep    5s
	  Click Element    xpath=//a[normalize-space()="บัญชีของฉัน"]
	Wait Until Page Contains    โปรไฟล์ของฉัน    timeout=10s
	
Go to Register page
	Sleep    3s
	Wait Until Page Contains    เดินทางร่วมกัน อย่างมั่นใจ ด้วยความปลอดภัยเป็นอันดับหนึ่ง    timeout=10s
	Click Element    xpath=//a[normalize-space()="สมัครสมาชิก"]

Register step 1
	Wait Until Page Contains    ข้อมูลบัญชีผู้ใช้    timeout=10s
    Input Text    id=username    		${username}
    Input Text    id=email    			${email}
    Input Text    id=password    		${password}
    Input Text    id=confirmPassword    ${password}
	Sleep    3s
	Click Button    xpath=//button[normalize-space()="ถัดไป"]
	
Register step 2
	Wait Until Page Contains    ข้อมูลส่วนตัว    timeout=10s
	Input Text    id=firstName       	${firstname}
    Input Text    id=lastName          	${lastname}
    Input Text    id=phoneNumber   		${phone}
    Click Element    xpath=//input[@name="gender" and @value="male"]
	Sleep    3s
	Click Button    xpath=//button[normalize-space()="ถัดไป"]
	
Register step 3
	Wait Until Page Contains    ยืนยันตัวตน    timeout=10s
	Choose File    id=idCardFile    ${idCard}
	Input Text    id=idNumber       	${idnumber}
	Input Text    id=expiryDate       	${expirydate}
	Choose File    id=selfieFile    ${selfie}
	Select Checkbox    xpath:(//input[@type='checkbox'])[1]
	Sleep    5s
	Click Button    xpath=//button[normalize-space()="สมัครสมาชิก"]
	
Register success
	Wait Until Page Contains    สมัครสมาชิกเรียบร้อยแล้ว    timeout=10s
	Sleep    5s
	
Click delete button
    Click Element    xpath=//*[@id="__nuxt"]/div/div[1]/main/div/div/div/aside/nav/div[4]/a/div/span
	Sleep    2s
	Page Should Contain    เลือกข้อมูลที่คุณต้องการจะลบ
	Sleep    2s