*** Settings ***
Library    RequestsLibrary
Library    Collections

*** Variables ***
${LOG_ENDPOINT}    /logs
${BASE_URL}     http://localhost:8080/api/admin
${ADMIN_TOKEN}  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWxxemdldzgwMDAwaDVrYzMwdGNkdjgyIiwicm9sZSI6IkFETUlOIiwiZW1haWwiOiJ0aGVzdW4xMTQ1QGdtYWlsLmNvbSIsImlhdCI6MTc3MTM5ODczOSwiZXhwIjoxNzcxNDAyMzM5fQ.hA0kSOA8dfC7_j7BA3mrGAPqT2FfIhJON6oHFNQwNtw

*** Test Cases ***

Get System Logs Successfully
    Create Session    api    ${BASE_URL}
    ${headers}=    Create Dictionary
    ...    Authorization=Bearer ${ADMIN_TOKEN}

    ${response}=    GET On Session
    ...    api
    ...    ${LOG_ENDPOINT}
    ...    headers=${headers}

    Status Should Be    200    ${response}
    Should Be Equal    ${response.json()['status']}    success
    Dictionary Should Contain Key    ${response.json()}    data
    Dictionary Should Contain Key    ${response.json()}    pagination


Get System Logs With Pagination
    Create Session    api    ${BASE_URL}
    ${headers}=    Create Dictionary
    ...    Authorization=Bearer ${ADMIN_TOKEN}

    ${params}=    Create Dictionary    page=1    limit=5

    ${response}=    GET On Session
    ...    api
    ...    ${LOG_ENDPOINT}
    ...    headers=${headers}
    ...    params=${params}

    Status Should Be    200    ${response}
    Should Be True    ${response.json()['pagination']['limit']} == 5


Filter Logs By Action
    Create Session    api    ${BASE_URL}
    ${headers}=    Create Dictionary
    ...    Authorization=Bearer ${ADMIN_TOKEN}

    ${params}=    Create Dictionary    action=LOGIN

    ${response}=    GET On Session
    ...    api
    ...    ${LOG_ENDPOINT}
    ...    headers=${headers}
    ...    params=${params}

    Status Should Be    200    ${response}
    Should Be Equal    ${response.json()['status']}    success


Search Logs By Keyword
    Create Session    api    ${BASE_URL}
    ${headers}=    Create Dictionary
    ...    Authorization=Bearer ${ADMIN_TOKEN}

    ${params}=    Create Dictionary    search=127.0.0.1

    ${response}=    GET On Session
    ...    api
    ...    ${LOG_ENDPOINT}
    ...    headers=${headers}
    ...    params=${params}

    Status Should Be    200    ${response}


Filter Logs By Date
    Create Session    api    ${BASE_URL}
    ${headers}=    Create Dictionary
    ...    Authorization=Bearer ${ADMIN_TOKEN}

    ${params}=    Create Dictionary    date=2026-02-18

    ${response}=    GET On Session
    ...    api
    ...    ${LOG_ENDPOINT}
    ...    headers=${headers}
    ...    params=${params}

    Status Should Be    200    ${response}


Export Logs CSV Successfully
    Create Session    api    ${BASE_URL}
    ${headers}=    Create Dictionary
    ...    Authorization=Bearer ${ADMIN_TOKEN}

    ${response}=    GET On Session
    ...    api
    ...    ${LOG_ENDPOINT}/export
    ...    headers=${headers}

    Status Should Be    200    ${response}
    Should Contain    ${response.headers['Content-Type']}    text/csv
