*** Settings ***
Library           RequestsLibrary
Library           Collections
Library           String
Library           DateTime

Suite Setup       Create Session And Login
Suite Teardown    Delete All Sessions

*** Variables ***
${BASE_URL}           http://localhost:8080
${ADMIN_EMAIL}        admin@example.com
${ADMIN_PASSWORD}     123456789
${API_PREFIX}         /api/system-logs

${TOKEN}              ${EMPTY}
${SAMPLE_LOG_ID}      ${EMPTY}

*** Keywords ***
Create Session And Login
    [Documentation]    สร้าง Session และล็อกอินเพื่อรับ JWT Token
    Create Session    api    ${BASE_URL}    verify=False
    ${body}=          Create Dictionary    email=${ADMIN_EMAIL}    password=${ADMIN_PASSWORD}
    ${resp}=          POST On Session    api    /api/auth/login    json=${body}
    Should Be Equal As Integers    ${resp.status_code}    200
    ${token}=         Set Variable    ${resp.json()["data"]["token"]}
    Set Suite Variable    ${TOKEN}    ${token}
    Log    Login successful, token acquired.

Get Auth Headers
    ${headers}=    Create Dictionary
    ...    Authorization=Bearer ${TOKEN}
    ...    Content-Type=application/json
    RETURN    ${headers}

*** Test Cases ***

# ═══════════════════════════════════════════════════════════════
# GROUP 1 : GET /api/system-logs  (getLogs)
# ═══════════════════════════════════════════════════════════════

TC_GL_001 Get All Logs - Default Pagination
    [Documentation]    ดึง log ทั้งหมดโดยไม่ใส่ filter ตรวจโครงสร้าง response
    [Tags]    get_logs    smoke    positive
    ${headers}=    Get Auth Headers
    ${resp}=       GET On Session    api    ${API_PREFIX}    headers=${headers}
    Should Be Equal As Integers    ${resp.status_code}    200
    ${body}=       Set Variable    ${resp.json()}
    Should Be True    ${body["success"]}
    Dictionary Should Contain Key    ${body}    data
    Dictionary Should Contain Key    ${body}    pagination
    Dictionary Should Contain Key    ${body["pagination"]}    page
    Dictionary Should Contain Key    ${body["pagination"]}    limit
    Dictionary Should Contain Key    ${body["pagination"]}    totalPages
    Dictionary Should Contain Key    ${body["pagination"]}    totalResults
    ${logs}=    Set Variable    ${body["data"]}
    ${length}=    Get Length    ${logs}
    IF    ${length} > 0
        Set Suite Variable    ${SAMPLE_LOG_ID}    ${logs[0]["id"]}
    END

TC_GL_002 Get Logs - Custom Page And Limit
    [Documentation]    ทดสอบ pagination ด้วย page=1&limit=10
    [Tags]    get_logs    pagination    positive
    ${headers}=    Get Auth Headers
    ${params}=     Create Dictionary    page=1    limit=10
    ${resp}=       GET On Session    api    ${API_PREFIX}    headers=${headers}    params=${params}
    Should Be Equal As Integers    ${resp.status_code}    200
    ${pagination}=    Set Variable    ${resp.json()["pagination"]}
    Should Be Equal As Integers    ${pagination["page"]}     1
    Should Be Equal As Integers    ${pagination["limit"]}    10
    ${length}=    Get Length    ${resp.json()["data"]}
    Should Be True    ${length} <= 10

TC_GL_003 Get Logs - Filter By Level INFO
    [Documentation]    กรอง level=INFO ตรวจสอบทุก record ที่ได้รับ
    [Tags]    get_logs    filter    positive
    ${headers}=    Get Auth Headers
    ${params}=     Create Dictionary    level=INFO
    ${resp}=       GET On Session    api    ${API_PREFIX}    headers=${headers}    params=${params}
    Should Be Equal As Integers    ${resp.status_code}    200
    FOR    ${log}    IN    @{resp.json()["data"]}
        Should Be Equal    ${log["level"]}    INFO
    END

TC_GL_004 Get Logs - Filter By Level WARNING
    [Tags]    get_logs    filter    positive
    ${headers}=    Get Auth Headers
    ${params}=     Create Dictionary    level=WARNING
    ${resp}=       GET On Session    api    ${API_PREFIX}    headers=${headers}    params=${params}
    Should Be Equal As Integers    ${resp.status_code}    200
    FOR    ${log}    IN    @{resp.json()["data"]}
        Should Be Equal    ${log["level"]}    WARNING
    END

TC_GL_005 Get Logs - Filter By Level ERROR
    [Tags]    get_logs    filter    positive
    ${headers}=    Get Auth Headers
    ${params}=     Create Dictionary    level=ERROR
    ${resp}=       GET On Session    api    ${API_PREFIX}    headers=${headers}    params=${params}
    Should Be Equal As Integers    ${resp.status_code}    200
    FOR    ${log}    IN    @{resp.json()["data"]}
        Should Be Equal    ${log["level"]}    ERROR
    END

TC_GL_006 Get Logs - Filter By Action
    [Documentation]    กรอง action=LOGIN
    [Tags]    get_logs    filter    positive
    ${headers}=    Get Auth Headers
    ${params}=     Create Dictionary    action=LOGIN
    ${resp}=       GET On Session    api    ${API_PREFIX}    headers=${headers}    params=${params}
    Should Be Equal As Integers    ${resp.status_code}    200
    FOR    ${log}    IN    @{resp.json()["data"]}
        Should Be Equal    ${log["action"]}    LOGIN
    END

TC_GL_007 Get Logs - Filter By Resource
    [Documentation]    กรอง resource=User
    [Tags]    get_logs    filter    positive
    ${headers}=    Get Auth Headers
    ${params}=     Create Dictionary    resource=User
    ${resp}=       GET On Session    api    ${API_PREFIX}    headers=${headers}    params=${params}
    Should Be Equal As Integers    ${resp.status_code}    200
    Should Be True    ${resp.json()["success"]}

TC_GL_008 Get Logs - Filter By Date Range
    [Documentation]    กรอง startDate/endDate ด้วยวันนี้
    [Tags]    get_logs    filter    positive
    ${headers}=    Get Auth Headers
    ${today}=      Get Current Date    result_format=%Y-%m-%d
    ${params}=     Create Dictionary    startDate=${today}    endDate=${today}
    ${resp}=       GET On Session    api    ${API_PREFIX}    headers=${headers}    params=${params}
    Should Be Equal As Integers    ${resp.status_code}    200
    Should Be True    ${resp.json()["success"]}

TC_GL_009 Get Logs - Filter By Date And Time Range
    [Documentation]    กรอง startDate+startTime และ endDate+endTime
    [Tags]    get_logs    filter    positive
    ${headers}=    Get Auth Headers
    ${today}=      Get Current Date    result_format=%Y-%m-%d
    ${params}=     Create Dictionary
    ...    startDate=${today}    startTime=00:00
    ...    endDate=${today}      endTime=23:59
    ${resp}=       GET On Session    api    ${API_PREFIX}    headers=${headers}    params=${params}
    Should Be Equal As Integers    ${resp.status_code}    200
    Should Be True    ${resp.json()["success"]}

TC_GL_010 Get Logs - Search By IP Address
    [Tags]    get_logs    search    positive
    ${headers}=    Get Auth Headers
    ${params}=     Create Dictionary    search=127.0.0.1
    ${resp}=       GET On Session    api    ${API_PREFIX}    headers=${headers}    params=${params}
    Should Be Equal As Integers    ${resp.status_code}    200
    Should Be True    ${resp.json()["success"]}

TC_GL_011 Get Logs - Search By Username
    [Tags]    get_logs    search    positive
    ${headers}=    Get Auth Headers
    ${params}=     Create Dictionary    search=admin
    ${resp}=       GET On Session    api    ${API_PREFIX}    headers=${headers}    params=${params}
    Should Be Equal As Integers    ${resp.status_code}    200
    Should Be True    ${resp.json()["success"]}

TC_GL_012 Get Logs - Search Whitespace Only (Edge Case)
    [Documentation]    search=" " ระบบต้อง trim แล้วไม่ crash
    [Tags]    get_logs    search    edge_case
    ${headers}=    Get Auth Headers
    ${params}=     Create Dictionary    search=${SPACE}
    ${resp}=       GET On Session    api    ${API_PREFIX}    headers=${headers}    params=${params}
    Should Be Equal As Integers    ${resp.status_code}    200
    Should Be True    ${resp.json()["success"]}

TC_GL_013 Get Logs - No Auth Token (Negative)
    [Documentation]    ไม่ส่ง token → ต้องได้ 401
    [Tags]    get_logs    auth    negative
    ${resp}=    GET On Session    api    ${API_PREFIX}    expected_status=any
    Should Be Equal As Integers    ${resp.status_code}    401

TC_GL_014 Get Logs - Combined Filters
    [Documentation]    level + resource + date ใช้พร้อมกัน
    [Tags]    get_logs    filter    positive
    ${headers}=    Get Auth Headers
    ${today}=      Get Current Date    result_format=%Y-%m-%d
    ${params}=     Create Dictionary
    ...    level=INFO    resource=SystemLog
    ...    startDate=${today}    endDate=${today}
    ${resp}=       GET On Session    api    ${API_PREFIX}    headers=${headers}    params=${params}
    Should Be Equal As Integers    ${resp.status_code}    200
    Should Be True    ${resp.json()["success"]}

# ═══════════════════════════════════════════════════════════════
# GROUP 2 : GET /api/system-logs/:id  (getLogById)
# ═══════════════════════════════════════════════════════════════

TC_GI_001 Get Log By ID - Valid ID
    [Documentation]    ดึง log รายการเดียว ตรวจ fields สำคัญ
    [Tags]    get_log_by_id    positive
    Skip If    '${SAMPLE_LOG_ID}' == ''    No log ID captured — run TC_GL_001 first
    ${headers}=    Get Auth Headers
    ${resp}=       GET On Session    api    ${API_PREFIX}/${SAMPLE_LOG_ID}    headers=${headers}
    Should Be Equal As Integers    ${resp.status_code}    200
    ${body}=       Set Variable    ${resp.json()}
    Should Be True    ${body["success"]}
    Should Be Equal    ${body["data"]["id"]}    ${SAMPLE_LOG_ID}
    Dictionary Should Contain Key    ${body["data"]}    action
    Dictionary Should Contain Key    ${body["data"]}    level
    Dictionary Should Contain Key    ${body["data"]}    resource
    Dictionary Should Contain Key    ${body["data"]}    timestamp

TC_GI_002 Get Log By ID - Non-Existent ID (Negative)
    [Documentation]    ID ไม่มีในระบบ → ต้องได้ 404
    [Tags]    get_log_by_id    negative
    ${headers}=    Get Auth Headers
    ${resp}=       GET On Session    api    ${API_PREFIX}/clxxxxxxxxxxxxxxxxxxxxx
    ...    headers=${headers}    expected_status=any
    Should Be Equal As Integers    ${resp.status_code}    404

TC_GI_003 Get Log By ID - No Auth Token (Negative)
    [Tags]    get_log_by_id    auth    negative
    ${resp}=    GET On Session    api    ${API_PREFIX}/some-id    expected_status=any
    Should Be Equal As Integers    ${resp.status_code}    401

# ═══════════════════════════════════════════════════════════════
# GROUP 3 : GET /api/system-logs/export  (exportLogs)
# ═══════════════════════════════════════════════════════════════

TC_EX_001 Export Logs - No Filter Full Export
    [Documentation]    ตรวจ Content-Type, X-File-SHA256 (64 hex chars), โครงสร้าง JSON
    [Tags]    export    smoke    positive
    ${headers}=    Get Auth Headers
    ${resp}=       GET On Session    api    ${API_PREFIX}/export    headers=${headers}
    Should Be Equal As Integers    ${resp.status_code}    200
    Should Contain    ${resp.headers["Content-Type"]}    application/json
    Dictionary Should Contain Key    ${resp.headers}    X-File-SHA256
    ${hash}=    Set Variable    ${resp.headers["X-File-SHA256"]}
    Should Not Be Empty    ${hash}
    ${length}=    Get Length    ${hash}
    Should Be Equal As Integers    ${length}    64
    ${body}=    Set Variable    ${resp.json()}
    Dictionary Should Contain Key    ${body}    metadata
    Dictionary Should Contain Key    ${body}    data
    Dictionary Should Contain Key    ${body["metadata"]}    exportedAt
    Dictionary Should Contain Key    ${body["metadata"]}    recordCount
    Dictionary Should Contain Key    ${body["metadata"]}    filtersApplied
    Dictionary Should Contain Key    ${body["metadata"]}    info

TC_EX_002 Export Logs - Filter By Level WARNING
    [Tags]    export    filter    positive
    ${headers}=    Get Auth Headers
    ${params}=     Create Dictionary    level=WARNING
    ${resp}=       GET On Session    api    ${API_PREFIX}/export    headers=${headers}    params=${params}
    Should Be Equal As Integers    ${resp.status_code}    200
    FOR    ${log}    IN    @{resp.json()["data"]}
        Should Be Equal    ${log["level"]}    WARNING
    END

TC_EX_003 Export Logs - Filter By Date Range
    [Tags]    export    filter    positive
    ${headers}=    Get Auth Headers
    ${today}=      Get Current Date    result_format=%Y-%m-%d
    ${params}=     Create Dictionary    startDate=${today}    endDate=${today}
    ${resp}=       GET On Session    api    ${API_PREFIX}/export    headers=${headers}    params=${params}
    Should Be Equal As Integers    ${resp.status_code}    200
    Should Be True    ${resp.json()["metadata"]["recordCount"]} >= 0

TC_EX_004 Export Logs - Content-Disposition Has Correct Filename
    [Documentation]    ตรวจ attachment; filename=painamnae_logs_<timestamp>.json
    [Tags]    export    positive
    ${headers}=    Get Auth Headers
    ${resp}=       GET On Session    api    ${API_PREFIX}/export    headers=${headers}
    Should Be Equal As Integers    ${resp.status_code}    200
    ${cd}=    Set Variable    ${resp.headers["Content-Disposition"]}
    Should Contain    ${cd}    attachment
    Should Contain    ${cd}    painamnae_logs_
    Should Contain    ${cd}    .json

TC_EX_005 Export Logs - No Auth Token (Negative)
    [Tags]    export    auth    negative
    ${resp}=    GET On Session    api    ${API_PREFIX}/export    expected_status=any
    Should Be Equal As Integers    ${resp.status_code}    401

TC_EX_006 Export Logs - Record Count Matches Data Array Length
    [Documentation]    metadata.recordCount == len(data)
    [Tags]    export    positive
    ${headers}=    Get Auth Headers
    ${resp}=       GET On Session    api    ${API_PREFIX}/export    headers=${headers}
    Should Be Equal As Integers    ${resp.status_code}    200
    ${body}=          Set Variable    ${resp.json()}
    ${declared}=      Set Variable    ${body["metadata"]["recordCount"]}
    ${actual}=        Get Length    ${body["data"]}
    Should Be Equal As Integers    ${declared}    ${actual}

TC_EX_007 Export Logs - Filter Reflected In Metadata
    [Documentation]    filter ที่ส่งต้องปรากฏใน metadata.filtersApplied
    [Tags]    export    positive
    ${headers}=    Get Auth Headers
    ${params}=     Create Dictionary    level=ERROR    resource=User
    ${resp}=       GET On Session    api    ${API_PREFIX}/export    headers=${headers}    params=${params}
    Should Be Equal As Integers    ${resp.status_code}    200
    ${filters}=    Set Variable    ${resp.json()["metadata"]["filtersApplied"]}
    Should Be Equal    ${filters["level"]}       ERROR
    Should Be Equal    ${filters["resource"]}    User

# ═══════════════════════════════════════════════════════════════
# GROUP 4 : DELETE /api/system-logs/old-logs  (deleteOldLogs)
# ═══════════════════════════════════════════════════════════════

TC_DL_001 Delete Old Logs - Successful Response Structure
    [Documentation]    ลบ log > 90 วัน ตรวจ success, message, data.count
    [Tags]    delete    positive
    ${headers}=    Get Auth Headers
    ${resp}=       DELETE On Session    api    ${API_PREFIX}/old-logs    headers=${headers}
    Should Be Equal As Integers    ${resp.status_code}    200
    ${body}=    Set Variable    ${resp.json()}
    Should Be True    ${body["success"]}
    Should Contain    ${body["message"]}    90 days
    Dictionary Should Contain Key    ${body["data"]}    count

TC_DL_002 Delete Old Logs - Count Is Non-Negative Integer
    [Tags]    delete    positive
    ${headers}=    Get Auth Headers
    ${resp}=       DELETE On Session    api    ${API_PREFIX}/old-logs    headers=${headers}
    Should Be Equal As Integers    ${resp.status_code}    200
    ${count}=    Set Variable    ${resp.json()["data"]["count"]}
    Should Be True    ${count} >= 0

TC_DL_003 Delete Old Logs - No Auth Token (Negative)
    [Tags]    delete    auth    negative
    ${resp}=    DELETE On Session    api    ${API_PREFIX}/old-logs    expected_status=any
    Should Be Equal As Integers    ${resp.status_code}    401

TC_DL_004 Delete Old Logs - Non-Admin Token (Negative)
    [Documentation]    user ธรรมดาต้องได้ 403
    [Tags]    delete    auth    negative
    ${body}=        Create Dictionary    email=Kittayot.m@kkumail.com   password=12345678
    ${login_resp}=  POST On Session    api    /api/auth/login    json=${body}    expected_status=any
    Skip If    ${login_resp.status_code} != 200    Non-admin user not available — skipping
    ${user_token}=  Set Variable    ${login_resp.json()["data"]["token"]}
    ${headers}=     Create Dictionary    Authorization=Bearer ${user_token}
    ${resp}=        DELETE On Session    api    ${API_PREFIX}/old-logs
    ...    headers=${headers}    expected_status=any
    Should Be Equal As Integers    ${resp.status_code}    403