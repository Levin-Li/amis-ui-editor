import axios from "axios";
import {alert} from 'amis';

import {IMainStore} from '../store';
//文档地址：https://kjur.github.io/jsrsasign/api/symbols/KJUR.jws.JWS.html#.verifyJWT
// import 'jsrsasign/lib/jsrsasign-jwths-min.js';
// require('jsrsasign/lib/jsrsasign-all-min.js');

const searchParams = new URL(window.location.href).searchParams;

// console.log(process.env)


// jwt 解密密码
//获取字符串对象
//jwt body{
// baseUrl:
// loadUrl:
// saveUrl:
// headers:
// }
//通过token或是参数
const token = window.localStorage.getItem("token_" + window.location.href) || searchParams.get("t")

const secret = "llw@oak" + (window.localStorage.getItem("token_secret_" + window.location.href) || searchParams.get("p"))

const alg = searchParams.get("a") || 'HS256';

//jwt token验证失败
// if (!KJUR.jws.JWS.verifyJWT(token, secret, {alg: [alg]})) {
//     throw new Error("token verify fail")
// }

//token 解码，不验证
const tokenData: any = {loadUrl: "/public/Role.json"};// jwt_decode(token, {header: false})

function completeUrl(url: string) {
    return (url.trim().startsWith("http://") || url.trim().startsWith("https://"))
        ? url : ((tokenData?.baseUrl || (location.protocol + "//" + location.host)) + url);
}

function getHeaders() {
    return tokenData?.headers || {}
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
