import axios from "axios";
import {alert} from 'amis';

import {IMainStore} from '../store';

import jwtDecode from "jwt-decode";

// @ts-ignore
__uri('example/Example.json');

//文档地址：https://kjur.github.io/jsrsasign/api/symbols/KJUR.jws.JWS.html#.verifyJWT
// import 'jsrsasign/lib/jsrsasign-jwths-min.js';

// require('jsrsasign/lib/jsrsasign-all-min.js');

console.log("url:" + location.href)

const searchParams = new URL(location.href).searchParams;

// console.log(process.env)

const isLocalhost = location.hostname === '127.0.0.1';

const tokenKey = "token_" + location.href;
const secretKey = tokenKey + "_secret";

let token = searchParams.get("t");
let secret = searchParams.get("p");

if (token) {
    localStorage.removeItem(tokenKey)
}
if (secret) {
    localStorage.removeItem(secretKey)
}

if (isLocalhost && !token) {

    let testToken = {
        loadUrl: location.pathname + "/example/Example.json",
        saveUrl: location.pathname + "/example/Save",
        baseUrl: location.protocol + "//" + location.hostname + ":" + (location.port || '80')
    }

    let testSecret = "-secret:" + new Date().getTime();

    //方法描述：KJUR.jws.JWS.sign(alg, spHead, spPayload, key, pass)

    // sign HS256 signature with password "aaa" implicitly handled as string
//     sJWS = KJUR.jws.JWS.sign(null, {alg: "HS256", cty: "JWT"}, {age: 21}, "aaa");
// // sign HS256 signature with password "6161" implicitly handled as hex
//     sJWS = KJUR.jws.JWS.sign(null, {alg: "HS256", cty: "JWT"}, {age: 21}, "6161");
// // sign HS256 signature with base64 password
//     sJWS = KJUR.jws.JWS.sign(null, {alg: "HS256"}, {age: 21}, {b64: "Mi/8..a="});
// // sign RS256 signature with PKCS#8 PEM RSA private key
//     sJWS = KJUR.jws.JWS.sign(null, {alg: "RS256"}, {age: 21}, "-----BEGIN PRIVATE KEY...");
// // sign RS256 signature with PKCS#8 PEM ECC private key with passcode
//     sJWS = KJUR.jws.JWS.sign(null, {alg: "ES256"}, {age: 21},
//         "-----BEGIN PRIVATE KEY...", "keypass");
// // header and payload can be passed by both string and object
//     sJWS = KJUR.jws.JWS.sign(null, '{alg:"HS256",cty:"JWT"}', '{age:21}', "aaa");

    testToken = KJUR.jws.JWS.sign(null, {alg: "HS256", cty: "JWT"}, testToken, "llw@oak" + testSecret);

    localStorage.setItem(tokenKey, testToken);

    localStorage.setItem(secretKey, testSecret);
}

// jwt 解密密码
//获取字符串对象
//jwt body{
// baseUrl:
// loadUrl:
// saveUrl:
// headers:
// }

//通过token或是参数

token = token || localStorage.getItem(tokenKey)
//立刻删除
localStorage.removeItem(tokenKey)

//参数优先
secret = "llw@oak" + (secret || localStorage.getItem(secretKey))

//立刻删除
localStorage.removeItem(secretKey)

//参数优先
const alg = searchParams.get("a") || 'HS256';

if (isLocalhost) {
    console.log("token:" + token)
    console.log("secret:" + secret)
    console.log("alg:" + alg)
}

//jwt token验证失败
if (!KJUR.jws.JWS.verifyJWT(token, secret, {alg: [alg, 'RS256', 'ES256', 'PS256']})) {
    throw new Error("token verify fail")
}

//token 解码，不验证
// const tokenData: any = {loadUrl: "/public/Role.json"};// jwt_decode(token, {header: false})
const tokenData: any = jwtDecode(token, {header: false}) || {}

if (!tokenData.baseUrl) {
    tokenData.baseUrl = location.protocol + "//" + location.host;
}

if (isLocalhost) {
    console.log(tokenData)
}

//http://127.0.0.1:18081/public/127.0.0.1:18081//public/Role.json
function completeUrl(url: string) {
    return (url.trim().startsWith("http://") || url.trim().startsWith("https://"))
        ? url : (tokenData.baseUrl + "/" + url);
}

function getHeaders() {
    return tokenData.headers || {}
}

function getLoadUrl() {
    return completeUrl(tokenData.loadUrl);
}

function getSaveUrl() {
    return completeUrl(tokenData.saveUrl || tokenData.loadUrl);
}

/**
 * 加载页面
 * @param onSchema
 * @param store
 * @param onError
 */
export function loadSchema(onSchema: (schema: any) => void
    , store?: IMainStore
    , onError: (info: string) => void = (info => alert(info, "错误"))) {

    axios.get(getLoadUrl(), {headers: getHeaders()}).then(response => {

        console.log(response);

        if (response.status === 200) {
            if (!response.data
                || !response.data.data
                || response.data.code !== 0) {
                onError("页面加载失败")
            } else {
                //加载页面
                const data = response.data.data;
                let schame = data.content;

                if ((typeof schame) === "string") {
                    schame = JSON.parse(schame)
                }

                const title = data.title || data.name || data.remark;

                if (store && title) {
                    store.setTitle(title)
                }
                if (document && title) {
                    document.title = title
                }

                onSchema(schame)
            }
        } else if (response.status === 401) {
            onError("认证失败")
        } else {
            onError("页面加载失败")
        }

    }).catch(reason => {
        console.log(reason);
        onError("页面加载失败")
    })
}

/**
 * 保存页面
 * @param schema
 * @param store
 * @param onSuccess
 * @param onError
 */
export function saveSchema(schema: any
    , store?: IMainStore
    , onSuccess: (data: any) => void = data => alert("保存成功")
    , onError: (info: string) => void = (info => alert(info, "发生错误"))) {

    console.log(schema);

    axios.put(getSaveUrl(), {content: JSON.stringify(schema)}, {headers: getHeaders()})
        .then(response => {

            console.log(response);

            if (response.status === 200) {
                if (!response.data
                    || !response.data.code
                    || response.data.code !== 0) {
                    onError("页面保存失败," + (response.data.msg || response.data))
                } else {
                    //保存页面
                    //store.updateSchema(response.data.data.content)
                    onSuccess(response)
                }
            } else if (response.status === 401) {
                onError("认证失败！")
            } else {
                onError("页面保存失败！")
            }

        }).catch(reason => {
        console.log(reason);
        onError("页面保存失败！")
    })
}
