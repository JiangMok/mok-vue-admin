// 导入axios核心库及其相关类型定义
// axios: HTTP客户端库，用于发送HTTP请求
// AxiosInstance: axios实例的类型定义
// AxiosRequestConfig: 请求配置的类型定义
// AxiosResponse: 响应对象的类型定义
// InternalAxiosRequestConfig: 内部请求配置的类型定义
import type {AxiosInstance, AxiosResponse, InternalAxiosRequestConfig} from 'axios';
import axios from 'axios'; //http客户端库.用于发送http请求
import {ElMessage} from 'element-plus' //引入Elements-plus的消息组件,用于显示提示
import router from '@/router' //导入VUE router实例,用于页面导航
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
//创建axios实例
const service: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,//10秒超时
  headers: {
    //指定请求体为json格式
    'Content-Type': 'application/json'
  }
})

//是否正在刷新token的标识
let isRefreshing = false
//重试队列
let requests: Array<(token: string) => void> = []

/**
 * 请求拦截器
 * 作用:在请求发送前对配置进行修改
 * 添加token
 */
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    //获取token
    const token = localStorage.getItem('token')
    //如果有token,添加到请求头
    if (token) {
      //注意:目前后端要求的格式是'Bearer token'
      config.headers.Authorization = `Bearer ${token}`;
    }
    //如果是登录和获取验证码则不需要token
    if (config.url?.includes('/auth/login') ||
      config.url?.includes('/captcha/generate')) {
      delete config.headers.Authorization
    }
    return config;
  },
  (error) => {
    console.log('请求拦截错误', error)
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器\
 * 作用:处理服务器响应,统一处理错误,token过期等
 * 为什么:统一错误处理逻辑,避免在每个请求中重复编写
 */
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // console.log('响应成功', response.config.url)
    //检查响应结构是否符合我们的ApiResponse
    //获取响应数据:后端返回的业务结果
    const data = response.data
    //如果有业务错误码(不是200),统一处理
    if (data.code !== undefined && data.code !== 200) {
      // console.error("响应拦截器:" + data.msg || '请求失败')
      ElMessage.error(data.msg)
      //将错误信息返回给调用方
      return Promise.reject(data)
    }
    //返回响应数据(业务部分),而不是完整的响应对象
    return response.data
  },
  async (error) => {
    // console.log('响应错误', error.response?.status, error.config?.url)
    //获取原始请求配置
    const originalRequest = error.config
    //如果是401错误 ==> token过期
    //为什么:token过期是常见场景,需要自动刷新而不是直接跳转到登录
    if (error.response?.status === 401 && !originalRequest._retry) {
      // 标记这个请求已经重试过，防止无限循环
      originalRequest._retry = true
      // 如果没有token或refreshToken，直接跳转到登录页
      const token = localStorage.getItem('token')
      const refreshToken = localStorage.getItem('refreshToken')
      if (!token || !refreshToken) {
        localStorage.clear()
        router.replace('/login')
        return Promise.reject(error)
      }
      // 如果已经在刷新token，将请求加入队列等待
      //为什么:避免同时发起多个token刷新的请求
      if (isRefreshing) {
        //返回一个promise,当token刷新成功后执行
        return new Promise((resolve) => {
          //将请求回调加入队列
          requests.push((newToken: string) => {
            //使用新token更新请求头
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            //重新发送原始请求
            resolve(service(originalRequest))
          })
        })
      }
      //设置刷新标志位true
      isRefreshing = true
      try {
        console.log('开始刷新token');
        // 这里调用刷新token的接口（你的后端需要提供）
        // 假设刷新接口是 /auth/refresh，用refreshToken获取新token
        const refreshResponse = await axios.post(
          baseURL+`/api/auth/refresh?refreshToken=${ refreshToken }`,
        )
        // 如果有刷新接口，可以这样处理：
        const newToken = refreshResponse.data.data.token
        const newRefreshToken = refreshResponse.data.data.refreshToken
        // // 保存新token
        localStorage.setItem('token', newToken)
        localStorage.setItem('refreshToken', newRefreshToken)
        //更新请求头
        service.defaults.headers.Authorization = `Bearer ${newToken}`
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        // // 执行队列中的请求
        requests.forEach(callback => callback(newToken))
        requests = []
        //重试原始请求
        return service(originalRequest)
      } catch (refreshError) {
        console.log('刷新token失败', refreshError)
        //刷新失败,清空本地缓存并跳转到登录页
        localStorage.clear()
        router.replace('/login')
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    // 其他错误处理
    if (error.response?.status === 403) {
      ElMessage.error('没有权限访问')
    } else if (error.response?.status === 404) {
      ElMessage.error('请求的资源不存在')
    } else if (error.response?.status === 500) {
      ElMessage.error('服务器内部错误')
    } else if (error.message.includes('timeout')) {
      ElMessage.error('请求超时，请检查网络')
    } else if (error.message.includes('Network Error')) {
      ElMessage.error('网络错误，请检查网络连接')
    } else {
      ElMessage.error(error.response?.data?.msg || '请求失败')
    }
    return Promise.reject(error)
  }
)

export default service
