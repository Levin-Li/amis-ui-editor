import axios from "axios";
import {toast} from 'amis';

const searchParams = new URL(window.location.href).searchParams;

if (!axios.defaults.baseURL) {
    axios.defaults.baseURL = searchParams.get("baseURL") || (location.protocol + "//" + location.host);
}

const defaults_headers: any = {}
//认证
if (searchParams.get("Authorization")) {
    defaults_headers["Authorization"] = searchParams.get("Authorization")
}

function getLoadUrl() {
    return searchParams.get("load") || "amis_schema";
}

function getSaveUrl() {
    return searchParams.get("save") || getLoadUrl();
}

export function loadSchema(onSchema: (schema: any) => void
    , onError: (info: string) => void = (info => toast.error(info, "错误"))) {

    axios.get(getLoadUrl(), {headers: defaults_headers}).then(response => {

        console.log(response);

        if (response.status === 200) {
            if (!response.data
                || !response.data.data
                || response.data.code !== 0) {
                onError("页面加载失败")
            } else {
                //加载页面
                let schame = response.data.data.content;
                if ((typeof schame) === "string") {
                    schame = JSON.parse(schame)
                }
                onSchema(schame)
                //toast.success("页面加载成功", "成功")
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
    , onSuccess: (data: any) => void = data => toast.success("保存成功")
    , onError: (info: string) => void = (info => toast.error(info, "错误"))) {

    console.log(schema);

    axios.put(getSaveUrl(), {content: schema}, {headers: defaults_headers}).then(response => {

        console.log(response);

        if (response.status === 200) {
            if (!response.data
                || !response.data.code
                || response.data.code !== 0) {
                onError("页面保存失败," + response.data)
            } else {
                //保存页面
                //store.updateSchema(response.data.data.content)
                onSuccess(response)
            }
        } else if (response.status === 401) {
            onError("认证失败")
        } else {
            onError("页面保存失败")
        }

    }).catch(reason => {
        console.log(reason);
        onError("页面保存失败")
    })
}
