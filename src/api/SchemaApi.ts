import axios from "axios";
import {alert} from 'amis';
import {__uri} from 'amis-editor';
import {IMainStore} from '../store';

import jwtDecode from "jwt-decode";

import CryptoJS from 'crypto-js'

//文档地址：https://kjur.github.io/jsrsasign/api/symbols/KJUR.jws.JWS.html#.verifyJWT
import {KJUR, KEYUTIL, RSAKey} from 'jsrsasign';

const exampleJson = require('../example/Example.json');

const exj = __uri('../example/Example.json');

/**
 *
 * 加载和保存的API
 *
 * 加载地址使用GET方法
 * 保存使用PUT 方法
 *
 */

/**
 * 数据解密
 * @param resp
 */
const respDecrypt = (resp:any) => {

    if (!resp.sign) {
        return resp.data
    }

    const dataTxt = resp.data
    const signStr = resp.sign

    const now = new Date()

    const n = now.getDay() + now.getDate() + now.getMonth() + 1

    const pwd = dataTxt.substring(4, 12) + '4vX8$o' + ((n < 10 ? '0' : '') + n + '') + signStr.substring(8, 16)

    // base64密文， AES解密算法, 必须为base64格式才能解密，如果为16进制，需要先转为base64
    const ciphertext = dataTxt.substring(32)

    // 关键步骤，转换Key
    const key = CryptoJS.enc.Utf8.parse(pwd)

    //utf-8 转换
    const originalText = CryptoJS.enc.Utf8.stringify(CryptoJS.AES.decrypt(ciphertext, key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }))

    if (signStr !== CryptoJS.SHA1(originalText).toString()) {
        return Promise.reject('数据校验异常')
    }

    //解密后的数据
    resp.data = JSON.parse(originalText)

    return resp.data
}

const getItem = (key: string) => {
    let item = sessionStorage.getItem(key)
    //立刻删除
    sessionStorage.removeItem(key)
    return item
}

const searchParams = new URL(location.href).searchParams;

// console.log(process.env)

const isLocalhost = location.hostname === '127.0.0.1' || location.hostname === 'localhost';

const tokenKey = "token_" + location.href;
const secretKey = tokenKey + "_secret";

//页面支持3个参数
// 参数：a 加密算法
// 参数：t token
// 参数：p 密码

//jwt token 数据
let token = searchParams.get("t") || getItem(tokenKey);

//jwt token 解密密码
let secret = "llw@oak" + (searchParams.get("p") || getItem(secretKey));

//参数优先
const alg = searchParams.get("a") || 'HS256';
//////////////////////////////////////////////////////////////////////////////////

//如果是本机，模拟测试
if (isLocalhost && !token) {

    let index = location.pathname.lastIndexOf("/");

    const currentPath = index === -1 ? "" : location.pathname.substring(0, index);

    console.debug("url path:" + location.pathname + ",currentPath:" + currentPath)

    let testTokenData = {
        loadUrl: currentPath + "/example/Example.json",
        saveUrl: currentPath + "/example/Save",
        baseUrl: location.protocol + "//" + location.hostname + ":" + (location.port || '80')
    }

    secret = "llw@oak" + "-secret:" + new Date().getTime();

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

    token = KJUR.jws.JWS.sign('HS256', '{alg: "HS256", cty: "JWT"}', testTokenData, secret);
}

// jwt 解密密码
// 获取字符串对象
// jwt body{
// baseUrl:
// loadUrl:
// saveUrl:
// headers:
// }

if (isLocalhost) {
    console.debug("token:", token)
    console.debug("secret:", secret)
    console.debug("alg:", alg)
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
        ? url : (tokenData.baseUrl + ("/" + url).replace("//", "/"));
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
    , onErrorFun: (info: string) => void = (info => alert(info, "错误"))) {

    const updateSchema = (data: any) => {

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

    const loadUrl = getLoadUrl();

    const onError = (info: string) => {

        if (loadUrl.endsWith('/Example.json')) {

            onErrorFun(info + " , 将加载默认示例页面！")

            console.info('加载示例', exampleJson)

            updateSchema(exampleJson.data)

        } else {
            onErrorFun(info)
        }
    }

    axios.get(loadUrl, {headers: getHeaders()}).then(response => {

        console.log(response);

        if (response.status === 200) {
            if (!response.data
                || !response.data.data
                || response.data.code !== 0) {

                onError("页面加载失败-1")

            } else {
                //加载页面
                updateSchema(respDecrypt(response.data));
            }
        } else if (response.status === 401) {
            onError("认证失败")
        } else {
            onError("页面加载失败-2")
        }

    }).catch(reason => {
        console.error('页面加载失败-3', reason);
        onError("页面加载失败-3")
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
