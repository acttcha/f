# 물류 공정 관리 시스템

## 1. 개요
풀필먼트 물류센터의 시스템을 최적화 하기 위한 물류 공정을 관리하고 작업할 수 있는 웹 시스템을 만든다. 

## 2. 주요기능
### 1) 회원가입 및 로그인 - passport 세션 구현
![로그인테스트](https://github.com/acttcha/fulfillment/assets/128893836/ec2d429c-cc75-4fb9-a91c-42232d138f24)

![세션](https://github.com/acttcha/fulfillment/assets/128893836/9e8a25bb-9146-4b0a-851c-e3f04b0cd5db)

### 2) 관리자 페이지 - 재고관리 CRUD 구현 및 AWS Bucket 연동 이미지 업로드
![재고관리](https://github.com/acttcha/fulfillment/assets/128893836/d07e4a0d-ee4a-48da-81bc-752e727d667b)

![사과입고](https://github.com/acttcha/fulfillment/assets/128893836/23bfbe92-d7d2-4331-96d2-48c6020c1684)


### 3) 관리자 페이지 - 주문관리 / 토트관리 / 작업자관리 / 통계차트 / 송장조회 기능구현
![관리자페이지주요기능](https://github.com/acttcha/fulfillment/assets/128893836/a1bfd212-5aa0-4c7f-a087-925e7205b4df)

### 4) 작업자 페이지 - 진열작업
![진열작업](https://github.com/acttcha/fulfillment/assets/128893836/0ba90ba5-0635-486c-971b-220dfb017d8c)

### 5) 작업자 페이지 - 집품작업
![집품작업](https://github.com/acttcha/fulfillment/assets/128893836/6d8932db-bfe8-4f76-a913-0f777d1bb448)


### 6) 작업자 페이지 - 리빈작업 (다중포장의 경우 배송지마다 분류하는 작업)
![리빈1](https://github.com/acttcha/fulfillment/assets/128893836/d4fa740c-bc03-4c68-9d55-456b3d6c1de7)
![리빈2](https://github.com/acttcha/fulfillment/assets/128893836/3f4f4f24-2792-4f72-a3e6-7e8d86f96ead)
![리빈3](https://github.com/acttcha/fulfillment/assets/128893836/76bea4e9-6d3b-4634-bd6f-5f62efa12634)


### 7) 작업자 페이지 - 포장작업
![포장작업](https://github.com/acttcha/fulfillment/assets/128893836/a419957e-f48d-4700-a5b7-501d9c6ef5ce)



# 개발자 가이드

## 1. 시스템 구성도

![image](https://github.com/acttcha/fulfillment/assets/128893836/486510eb-4f9e-4c35-b0d1-7fa679b02b33)

## 2. ERD
![image](https://github.com/acttcha/fulfillment/assets/128893836/c3a68c73-c11c-445a-9a4b-e269ad851562)

## 3. <a name="_toc152711244"></a>설치 환경/구성
"dependencies": {

`    `"@aws-sdk/client-s3": "^3.454.0",

`    `"bcrypt": "^5.1.1",

`    `"dotenv": "^16.3.1",

`    `"ejs": "^3.1.9",

`    `"express": "^4.18.2",

`    `"express-mysql-session": "^3.0.0",

`    `"express-session": "^1.17.3",

`    `"method-override": "^3.0.0",

`    `"multer": "^1.4.5-lts.1",

`    `"multer-s3": "^3.0.1",

`    `"mysql2": "^3.6.5",

`    `"passport": "^0.6.0",

`    `"passport-local": "^1.0.0",

`    `"pdfkit": "^0.14.0"

`  `}
## 4. 개발 환경

<table><tr><th><b>구분</b></th><th><b>이름</b></th><th><b>버전</b></th></tr>
<tr><td>개발 언어</td><td>JavaScript</td><td>- 19.0.2</td></tr>
<tr><td rowspan="2">프레임워크</td><td>express</td><td>- 4.18.2</td></tr>
<tr><td>Bootstrap</td><td>- 5.3.1</td></tr>
<tr><td>데이터베이스</td><td>MySQL</td><td>- 8.0.32</td></tr>
<tr><td>템플릿엔진</td><td>EJS</td><td>- 3.1.9</td></tr>
<tr><td>IDE</td><td>VSCode</td><td>- 2022.3.3</td></tr>
<tr><td>서버 환경</td><td>nodejs</td><td>- 18.17.1</td></tr>
<tr><td>운영체제</td><td>Windows</td><td>- 10</td></tr>
</table>


## 5. 폴더 구조
![image](https://github.com/acttcha/fulfillment/assets/128893836/89dcba95-137e-4179-97ef-d513fcb77cf8)
![image](https://github.com/acttcha/fulfillment/assets/128893836/a264a1bc-862a-455a-9eef-6d4cc71bcb9d)
![image](https://github.com/acttcha/fulfillment/assets/128893836/72cf3dc8-0ac2-449c-b03c-b7309851976f)

## 6. 개발환경 설정
### 데이터 베이스 연결
host를 구글 클라우드 SQL에 호스팅 되어있는 db의 공개IP로 설정.
### db.js

```javascript
require('dotenv').config();
const mysql = require('mysql2');

// gcp db 연결 코드
const db = mysql.createConnection({
  host: '34.22.67.125',
  port: 3306,
  user: 'user',
  password: process.env.DB_PASSWORD,
  database: 'fulfillment'
});

module.exports = db;

```

### 사용자 인증
Passport 라이브러리 사용하여 인증

```javascript
// passport 라이브러리 셋팅
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local')
var MySQLStore = require('express-mysql-session')(session);

app.use(passport.initialize())
app.use(session({
  secret: process.env.COOKIE_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60 * 60 * 1000 }, //세션 1시간 유지
  store: new MySQLStore({ // 세션 db에 저장
    host: '34.22.67.125',
    port: 3306,
    user: 'user',
    password: process.env.DB_PASSWORD,
    database: 'fulfillment'
  })
}))

app.use(passport.session())

// Passport 초기화 및 설정
passport.use(new LocalStrategy(async (username, password, done) => {
  // 사용자 인증 및 비밀번호 확인을 수행
  db.query('SELECT * FROM user WHERE login_id = ?', [username], async (err, rows) => {
    if (err) return done(err);

    if (!rows.length) {
      return done(null, false, { message: 'Incorrect ID.' });
    }

    const user = rows[0];

    // bcrypt.compare를 사용하여 비밀번호 확인
    try {
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Incorrect password.' });
      }
    } catch (error) {
      return done(error);
    }
  });
}));

passport.serializeUser((user, done) => {
  console.log(user)
  process.nextTick(() => {
    // done(null, { user_id: user._id })
    done(null, user.user_id)

  })
})

passport.deserializeUser(async (user, done) => {

  const query = 'SELECT * FROM user WHERE user_id = ?';
  db.query(query, [user], (err, rows) => {
    if (err) return done(err);
    if (rows.length === 0) return done(null, false);
    const user = rows[0];
    delete user.password;
    done(null, user);
  });
})


```

## 7. API
### 7-1로그인 및 회원가입

|API명|코드 명세|비고|
| :-: | :-: | :-: |
|router.get('/register')|회원가입 페이지 렌더링||
|router.post('/register')|회원가입 수행|Bcrypt로 해시 암호화|
|router.get('/login')|로그인 페이지 렌더링||
|router.post('/login')|로그인 수행||


### 7-2 관리자 페이지

|API명|코드 명세|비고|
| :-: | :-: | :-: |
|app.get('/admin')|관리자 페이지 렌더링||

#### 7-2-1 재고 관리

|API명|코드 명세|비고|
| :-: | :-: | :-: |
|router.get('/admin/product’)|재고관리 페이지 렌더링|Tables.ejs include해서 재사용가능|
|router.post('/add-data')|상품 데이터를 데이터베이스에 추가하고, 이미지를 AWS S3에 업로드||
|router.get('/update-data/:id')|선택 상품 ID 가져오기||
|router.put('/update-data/:id'|특정 ID의 상품 데이터를 수정.||
|router.delete('/delete-data/:id')|특정 ID의 상품 데이터를 삭제||
|router.get('/product-image/:id')|특정 ID의 상품 이미지 URL을 조회||

#### 7-2-2 주문 관리

|API명|코드 명세|비고|
| :-: | :-: | :-: |
|router.get('/orders')|주문 데이터를 조회하고 관리자 주문 목록 페이지를 렌더링||
|router.get('/orders/:id')|특정 주문 ID의 주문 상세 정보를 조회하고, 관리자 주문 상세 페이지를 렌더링||

#### 7-2-3 토트 관리

|API명|코드 명세|비고|
| :-: | :-: | :-: |
|router.get('/box')|토트 데이터를 조회하고, 토트 관리 페이지를 렌더링||
|router.post('/add-box')|토트 ID를 받아와 데이터베이스에 토트 추가||
|router.delete('/delete-box/:id)|특정 토트 ID의 토트 데이터를 삭제||
|router.put('/avail-box/:id')|특정 토트ID의 토트를 사용 가능 상태로 변경||
|router.put('/unavail-box/:id)|특정 토트ID의 토트를 사용 불가능 상태로 변경||
|router.put('/cancel-deadline/:id')|특정 토트ID의 토트의 마감여부를 0으로 취소.||
|router.get('/box/:id')|특정 id의 박스 내용물 조회||
|router.delete('/deleteBoxContent/:id')|토트 내용물 삭제 (삭제 시, picking\_flag = 0, picking\_worker\_id = NULL, deadline\_status = 0, packing\_type = NULL로 업데이트)||

#### 7-2-4 작업자 관리

|API명|코드 명세|비고|
| :-: | :-: | :-: |
|router.get('/worker\_control')|작업자 목록 조회||
|router.put("/updateWorkAccess/:id")|작업자 권한 업데이트||
|router.put("/updateWorkLine/:id")|작업자 구역 설정 업데이트||
|router.delete('/deleteWorker/:id')|작업자 삭제 API:||

#### 7-2-5 송장번호 조회

|API명|코드 명세|비고|
| :-: | :-: | :-: |
|router.get('/trackingNumber')|송장 목록 조회||
|router.get('/trackingNumber/:id')|특정 송장 상세 조회||

#### 7-2-6 통계차트 조회

|API명|코드 명세|비고|
| :-: | :-: | :-: |
|router.get('/category-data')|카테고리 데이터 db 요청||


### 7-3 작업자 페이지
#### 7-3-1 진열 작업

|API명|코드 명세|비고|
| :-: | :-: | :-: |
|router.get('/display1')|진열 시작 페이지 렌더링||
|router.get('/productCheck/:id')|진열할 수 있는 재고인지 확인||
|router.get('/display2')|상품 정보 db에서 받아와서 페이지 렌더링||
|router.get('/productShelfCheck/:id')|일치하는 상품 진열대 확인||
|router.get('/display3')|진열할 상품, 진열할 선반 확인 후 렌더링||
|router.post('/finish-display')|<p>진열 완료 수행 db 업데이트</p><p>1: (입력된 수량 <= 재고) 확인</p><p>2: 재고 수량 감소 업데이트</p><p>3: 진열된 재고 수량 증가</p><p>4: 진열위치 업데이트</p>||

#### 7-3-2 집품 작업

|API명|코드 명세|비고|
| :-: | :-: | :-: |
|router.get('/picking1')|집품 시작 페이지 렌더링||
|router.get('/boxcheck/:id')|사용 가능한 토트 확인||
|router.get('/picking2')|집품을 위한 상품정보를 담아서 페이지 렌더링||
|router.post('/boxinsert')|<p>토트에 상품을 담는 트랜잭션 처리 로직</p><p>1: 토트 내용물 넣기</p><p>2: 집품 여부 1로 업데이트, user id 받아와서 picking\_worker\_id에 업데이트</p><p>3: 상품 진열 수량 - 집품 수량</p><p>4: 박스 유형을 유저 packing\_access에 맞게 업데이트</p>|집품할 때 유저에게 설정된 집품방식에 따라서 업데이트함으로써  단일/다중 포장 구분 가능|
|router.post('/boxfinish')|<p>토트 마감처리 로직</p><p>1\. box\_content 테이블에서 해당 box\_id에 대한 데이터가 있는지 확인</p><p>2\. box\_content에 데이터가 하나 이상 존재하면 box 테이블 업데이트</p>||
|function performBoxFinish(boxId, res)|picking2에서 주문 데이터가 없을 때 토트마감처리를 위한 함수||

#### 7-3-3 리빈 작업

|API명|코드 명세|비고|
| :-: | :-: | :-: |
|router.get('/rebin1')|다중 포장 전처리를 위한 리빈 작업 시작 페이지 렌더링||
|router.get('/workbench-check/:id')|작업 가능한 리빈작업대 확인||
|router.get('/rebin2')|토트 입력하는 리빈 작업 페이지 렌더링||
|router.get('/boxcheck-rebin/:id')|집품이 완료되었는지, 다중 포장 토트인지 확인||
|router.get('/rebin3')|리빈 작업 위한 db와 페이지 렌더링||
|router.post('/finish-rebin')|<p>리빈 작업 완료 로직</p><p>모든 주문 상세의 리빈 플래그가 1로 설정되었는지 확인.</p><p>모든 주문 상세가 리빈 작업대에서 마감되었을 경우, 해당 리빈 선반의 마감 상태를 업데이트</p>|rebin\_rack SET finish\_flag = 1|

#### 7-3-4 포장 작업

|API명|코드 명세|비고|
| :-: | :-: | :-: |
|router.get('/packing1')|포장 시작 페이지 렌더링||
|router.get('/singlePacking1')|단일 포장 페이지 렌더링||
|router.get('/boxContentCheck/:id')|토트 내용물 확인||
|router.get('/singlePacking2')|포장 상품 db조회 렌더링||
|router.post('/trackingNumber')|송장 번호 랜덤 생성, 중복 체크||
|router.get('/singlePacking3')|포장 상품 db조회 렌더링||
|router.post('/finish-packing')|포장 완료 로직||
|router.post('/generatePDF')|Pdf로 운송장을 생성하여 인쇄||
|router.get('/multiPacking1')|다중 포장 페이지 렌더링||
|router.get('/packing-workbench-check/:id')|포장작업대 확인||
|router.get('/multiPacking2')|포장 상품 db 조회 렌더링||
|router.get('/multiPacking3')|포장 상품 db 조회 렌더링||
|router.post('/trackingNumber-multi')|송장 번호 랜덤 생성, 중복 체크 – 다중||
|router.get('/multiPacking4')|포장 상품 db 조회 렌더링||
|router.post('/generatePDF-multi')|Pdf로 운송장을 생성하여 인쇄 - 다중||
|router.post('/finish-packing-multi')|다중 포장 완료 로직||

#### 7-3-5 토트 조회

|API명|코드 명세|비고|
| :-: | :-: | :-: |
|router.get('/viewbox')|작업자 페이지에서 토트 조회 페이지 렌더링||
|router.get('/viewboxcheck/:id')|토트 확인||
|router.get('/viewbox2')|관리자페이지의 토트내용물조회 불러오기(공통 사용)||

