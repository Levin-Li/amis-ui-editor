import axios from "axios";
import {alert} from 'amis';

import {IMainStore} from '../store';

const searchParams = new URL(window.location.href).searchParams;

if (!axios.defaults.baseURL) {
    axios.defaults.baseURL = searchParams.get("baseURL") || (location.protocol + "//" + location.host);
}

let defaults_headers: any = {}

//认证
// if (searchParams.get("headers")) {
try {
    defaults_headers = JSON.parse(searchParams.get("headers") || "{}");
} catch (e) {
    alert("参数 headers 解析失败")
}

// }

function getLoadUrl() {
    return searchParams.get("load") || "amis_schema";
}

function getSaveUrl() {
    return searchParams.get("save") || getLoadUrl();
}

export function loadSchema(onSchema: (schema: any) => void
    , store?: IMainStore
    , onError: (info: string) => void = (info => alert(info, "错误"))) {

    axios.get(getLoadUrl(), {headers: defaults_headers}).then(response => {

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

export function saveSchema(schema: any
    , store?: IMainStore
    , onSuccess: (data: any) => void = data => alert("保存成功")
    , onError: (info: string) => void = (info => alert(info,"发生错误"))) {

    console.log(schema);

    axios.put(getSaveUrl(), {content: JSON.stringify(schema)}, {headers: defaults_headers}).then(response => {

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
