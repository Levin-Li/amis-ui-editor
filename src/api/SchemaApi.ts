import axios from "axios";
import {alert, uuid, uuidv4} from 'amis';
import {__uri} from 'amis-editor';
import {IMainStore} from '../store';

import CryptoJS from 'crypto-js'

const exampleJson = require('../example/Example.json');

const exj = __uri('../example/Example.json');


const replaceAll = (txt: string, keyword: string, replacement: string): string => {
    while (txt.indexOf(keyword) > -1) {
        txt = txt.replace(keyword, replacement)
    }
    return txt
}

/**
 * 数据解密
 * @param sign sha1 签名串，16进制字符串
 * @param dataTxt base64编码的密文 ，密文前32个字符串，不是数据，是密码
 */
const decrypt = (sign: string, dataTxt: any, domain: string) => {

    //"112bb3ed9aceb7e14d94a49372875b2b134e8497"
    if (!sign || sign.trim().length < 32 || !dataTxt || (typeof dataTxt !== 'string') || dataTxt.trim().length < 32) {
        //如果没有签名串
        //签名串长度小于32
        //如果不是字符串，则直接返回
        return dataTxt
    }

    if (!domain) {
        domain = location.hostname;
    }

    const now = new Date();

    //获取当前UTC日期，如果大于8号，则从8号开始，否则从当前日期开始
    const startIndex = now.getUTCDate() >= 20 ? (now.getUTCDate() - 8) : now.getUTCDate()

    //中间密码 UTC日期
    const middlePwd = CryptoJS.SHA1(domain + now.toISOString().substring(0, 10)).toString(CryptoJS.enc.Hex).substring(startIndex, startIndex + 8)

    //密码总共32位字符，分别从数据，签名和中间密码中各取8个字符
    const pwd = dataTxt.substring(0, 32).substring(startIndex, startIndex + 8) + middlePwd + sign.substring(startIndex, startIndex + 8)

    //解密，并且转换utf-8  // base64密文， AES解密算法, 必须为base64格式才能解密，如果为16进制，需要先转为base64

    const originalText = (CryptoJS.AES.decrypt( /* 前面32个字符不是数据 */  dataTxt.substring(32), /* 解密密码 */ CryptoJS.enc.Utf8.parse(pwd), /* 解密配置 */ {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.ZeroPadding
    })).toString(CryptoJS.enc.Utf8)

    //解密后做SHA1哈希校验
    if (!originalText || sign !== CryptoJS.SHA1(originalText).toString(CryptoJS.enc.Hex)) {
        return Promise.reject('数据校验异常')
    }

    //解密后的数据
    return originalText
}

/**
 * 数据加密
 * @param sign sha1 签名串，16进制字符串
 * @param dataTxt base64编码的密文 ，密文前32个字符串，不是数据，是密码
 */
const encrypt = (dataTxt: string, domain: string) => {

    if (!dataTxt || dataTxt.trim().length < 1) {
        //如果不是字符串，则直接返回
        return {domain, sign: "", data: dataTxt}
    }

    if (!domain) {
        domain = location.hostname;
    }

    //utf8数组
    const utf8data = CryptoJS.enc.Utf8.parse(dataTxt)

    //生成签名
    const sign = CryptoJS.SHA1(utf8data).toString(CryptoJS.enc.Hex)

    const now = new Date();

    //获取当前UTC日期，如果大于8号，则从8号开始，否则从当前日期开始
    const startIndex = now.getUTCDate() >= 20 ? (now.getUTCDate() - 8) : now.getUTCDate()

    //中间密码 UTC日期
    const middlePwd = CryptoJS.SHA1(domain + now.toISOString().substring(0, 10)).toString(CryptoJS.enc.Hex).substring(startIndex, startIndex + 8)

    //'1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
    const prefix = replaceAll(uuidv4(), "-", ""); //随机32这个字符串

    //密码总共32位字符，分别从数据，签名和中间密码中各取8个字符
    const pwd = prefix.substring(startIndex, startIndex + 8) + middlePwd + sign.substring(startIndex, startIndex + 8)

    //加密，并生成base64字符串
    const ciphertext = CryptoJS.AES.encrypt(utf8data, /* 密码 */ CryptoJS.enc.Utf8.parse(pwd), /* 解密配置 */ {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.ZeroPadding
    }).toString()

    //加密后的数据
    return {domain, sign, data: prefix + ciphertext}
}

const decryptResp = (resp: any) => {
    //解密，转JSON 对象
    return resp.data = JSON.parse(decrypt(resp.sign || resp.signStr, resp.data, resp.domain))
}

const getItem = (key: string) => {
    let item = sessionStorage.getItem(key)
    //立刻删除
    sessionStorage.removeItem(key)
    return item
}
const searchParams = new URL(location.href).searchParams;

const isLocalhost = location.hostname === '127.0.0.1' || location.hostname === 'localhost';

const path = searchParams.get("path");

// @ts-ignore
let config = searchParams.get("config") || window.__config;

// @ts-ignore
let sign = searchParams.get("sign") || window.__sign;

//////////////////////////////////////////////////////////////////////////////////

const testData = "This is 测试数据"

if (isLocalhost) {
    console.debug("测试数据：", testData)
}

const encryptData = encrypt(testData, null);

if (isLocalhost) {
    console.debug("encryptData:", encryptData)
}

// @ts-ignore
if (testData !== decrypt(encryptData.sign, encryptData.data)) {
    throw new Error('加解密测试异常')
}

//////////////////////////////////////////////////////////////

//如果是本机，模拟测试
if (isLocalhost && !config) {

    let index = location.pathname.lastIndexOf("/");

    const currentPath = index === -1 ? "" : location.pathname.substring(0, index);

    console.debug("url path:" + location.pathname + ",currentPath:" + currentPath)

    config = {
        headers: {},
        loadUrl: currentPath + "/example/Example.json",
        saveUrl: currentPath + "/example/Save",
    }

    const encryptData = encrypt(JSON.stringify(config), null);

    // @ts-ignore
    config = encryptData.data;

    // @ts-ignore
    sign = encryptData.sign;
}

//如果有签名和加密
if (config && sign) {
    config = decrypt(sign, config, null)
}

if (config && (typeof config === "string")) {
    // @ts-ignore
    config = JSON.parse(config)
}

if (!config.baseUrl) {
    config.baseUrl = location.protocol + "//" + location.host;
}

if (path && path.trim().length > 0) {
    config.path = path;
}

if (isLocalhost) {
    console.debug("amis editor config:", config)
}

//http://127.0.0.1:18081/public/127.0.0.1:18081//public/Role.json
function completeUrl(url: string) {
    return (url.trim().startsWith("http://") || url.trim().startsWith("https://"))
        ? url : (config.baseUrl + ("/" + url).replace("//", "/"));
}

function getHeaders() {
    return config.headers || {}
}

function getLoadUrl() {
    return completeUrl(config.loadUrl);
}

function getSaveUrl() {
    return completeUrl(config.saveUrl);
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

            if (isLocalhost) {
                console.info('加载示例', exampleJson)
            }


            updateSchema(exampleJson.data)

        } else {
            onErrorFun(info)
        }
    }

    axios.get(loadUrl, {headers: getHeaders()}).then(response => {

        if (isLocalhost) {
            console.log(response);
        }

        if (response.status === 200) {
            if (!response.data
                || !response.data.successful
                || response.data.code !== 0) {

                onError("页面加载失败-1, " + response.data.msg || '')

            } else {
                //加载页面
                updateSchema(decryptResp(response.data));
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

    if (isLocalhost) {
        console.log(schema);
    }

    axios.put(getSaveUrl(), encrypt(JSON.stringify(schema), null), {headers: getHeaders()})
        .then(response => {

            if (isLocalhost) {
                console.log(response);
            }

            if (response.status === 200) {
                if (!response.data
                    || !response.data.successful
                    || response.data.code !== 0) {
                    onError("页面保存失败-1," + (response.data.msg || response.data))
                } else {
                    //保存页面
                    //store.updateSchema(response.data.data.content)
                    //更新下次保存的URL，
                    if (response.data.data
                        && typeof response.data.data === "object") {
                        //更新
                        config = {...config, ...response.data.data};

                        if (isLocalhost) {
                            console.debug("new config:", config)
                        }
                    }

                    onSuccess(response)
                }
            } else if (response.status === 401) {
                onError("认证失败！")
            } else {
                onError("页面保存失败-2")
            }

        }).catch(reason => {

        if (isLocalhost) {
            console.debug(reason);
        }

        onError("页面保存失败-3")
    })
}
