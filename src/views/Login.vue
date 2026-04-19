<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>MOK-基础框架</h2>
        <p>欢迎登录，请填写登录信息</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item prop="captcha">
          <div class="captcha-container">
            <el-input
              v-model="loginForm.captcha"
              placeholder="请输入验证码"
              :prefix-icon="Picture"
              size="large"
              style="flex: 1"
            />
            <div class="captcha-img" @click="refreshCaptcha">
              <img :src="captchaImage" v-if="captchaImage" alt="验证码"/>
              <div v-else class="captcha-loading">加载中...</div>
            </div>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleLogin"
            style="width: 100%"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>

<!--      <div class="login-footer">-->
<!--        <el-checkbox v-model="rememberMe">记住我</el-checkbox>-->
<!--        <el-link type="primary" underline="hover">忘记密码？</el-link>-->
<!--      </div>-->
    </div>

    <div class="copyright">
      © 2025 后台管理系统
    </div>
  </div>
</template>

<script setup lang="ts">
import {onMounted, reactive, ref} from 'vue'
import {useRouter} from 'vue-router'
import {Lock, Picture, User} from '@element-plus/icons-vue'
import {useUserStore} from '@/stores/user'
import {ElMessage, type FormInstance, type FormRules} from "element-plus";
import {authApi, captchaApi} from "@/api";
//=================基础对象创建   &   表单字段赋值=================================
//登陆表单数据(需要给默认值),并且声明为响应式数据
const loginForm = reactive({
  username: '',
  password: '',
  captcha: '',
  captchaKey: ''
})
//表单引用
const loginFormRef = ref<FormInstance>()
//获取路由实例
const router = useRouter()
//获取一同胡store
const userStore = useUserStore()
// 验证码图片
const captchaImage = ref('')
// 加载状态
const loading = ref(false)
// 记住我
const rememberMe = ref(false)
//=================表单校验===================================================
const loginRules: FormRules = {
  username: [
    //required:必填,trigger:触犯验证的时机:blur:失去焦点时验证
    {required: true, message: '请输入用户名', trigger: 'blur'},
    {min: 3, message: '用户名至少3个字符', trigger: 'blur'}
  ],
  password: [
    {required: true, message: '请输入密码', trigger: 'blur'},
    {min: 6, message: '密码至少6个字符', trigger: 'blur'}
  ],
  captcha: [
    {required: true, message: '请输入验证码', trigger: 'blur'},
    // {pattern: /^\d+$/, message: '验证码必须为数字', trigger: 'blur'}
  ]
}

//=================该页面要用到的各种函数============================================
/**
 * 获取验证码
 */
const refreshCaptcha = async () => {
  try {
    const res = await captchaApi.getCaptcha();
    if(res.code != 200 ){
      ElMessage.error('验证码获取失败:'+res.msg)
      return
    }
    // console.log('验证码接口返回:', res);
    captchaImage.value = res.data.image
    loginForm.captchaKey = res.data.key
  } catch (e) {
    // console.error('验证码获取失败', e)
    // ElMessage.error('验证码获取失败')
  }
}
/**
 * 登录
 */
const handleLogin = async () => {
  //验证表单是否存在
  if (!loginFormRef.value) {
    return
  }
  try {
    //执行表单验证,如果失败会抛出异常
    await loginFormRef.value.validate()
  } catch (e) {
    console.log('表单验证失败', e)
    return
  }
  //设置等待效果
  loading.value = true
  try {
    // console.log("开始登录,参数:", loginForm)
    //调用登录api
    const res = await authApi.login(loginForm)
    //控制台输出登录响应
    // console.log('登录响应:', res)
    //检查是否登录成功
    if (res.code === 200 && res.success && !res.error) {
      //登陆成功,调用store的afterLogin方法
      //作用 : 保存token,用户信息
      await userStore.afterLogin(res.data)
      // 显示成功消息
      ElMessage.success('登录成功')
      // 刷新验证码，防止暴力破解
      // 跳转到首页（路由守卫会处理动态路由）
      // ========== 修改开始 ==========
      // 保持原来的代码，但添加重试
      const retryLogin = async (retryCount = 0) => {
        try {
          await router.push('/dashboard')
        } catch (error) {
          console.log(`第${retryCount + 1}次跳转失败`)
          if (retryCount < 3) {
            // 等待一段时间后重试
            setTimeout(() => retryLogin(retryCount + 1), 500)
          } else {
            // 最终尝试跳转到仪表盘
            router.push('/dashboard')
          }
        }
      }

      // 开始跳转
      retryLogin()
    } else {
      // 登录失败，显示错误信息
      ElMessage.error(res.msg || '登录失败')

      // 刷新验证码，防止暴力破解
      refreshCaptcha()
    }
  } catch (e: any) {
    // // 捕获登录过程中的所有错误
    // console.error('登录错误:', e)
    // // 显示错误信息
    // let errorMsg = '登录失败'
    // if (e.message?.includes('Network Error')) {
    //   errorMsg = '网络错误，请检查后端服务'
    // } else if (e.msg) {
    //   errorMsg = e.msg
    // }
    // ElMessage.error("catch:"+errorMsg)
    // 刷新验证码
    refreshCaptcha()
    // 清空验证码输入框
    loginForm.captcha = ''
  } finally {
    // 无论成功或失败，都关闭加载状态
    loading.value = false
  }
}
//=================页面加载时的操作(生命周期钩子)============================================
onMounted(() => {
  refreshCaptcha();
  //如果有记住的用户名,自动填充
  const savedUsername = localStorage.getItem('remember_username')
  if (savedUsername) {
    loginForm.username = savedUsername
    rememberMe.value = true
  }
})
</script>

<style scoped>
/* ===== 登录容器 - 明亮渐变 + 快速浮动光斑 ===== */
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(145deg, #d4e0ff, #c2d4ff, #e0d0ff, #ffe0f0);
  background-size: 400% 400%;
  animation: gradientFlow 18s ease infinite;
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

/* 渐变流动动画 */
@keyframes gradientFlow {
  0% { background-position: 0% 0%; }
  25% { background-position: 50% 50%; }
  50% { background-position: 100% 100%; }
  75% { background-position: 50% 50%; }
  100% { background-position: 0% 0%; }
}

/* 清晰的光斑层（速度加快） */
.login-container::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% 30%, rgba(200, 220, 255, 0.9) 0%, transparent 35%),
  radial-gradient(circle at 80% 70%, rgba(220, 200, 255, 0.8) 0%, transparent 40%),
  radial-gradient(circle at 40% 80%, rgba(255, 210, 230, 0.7) 0%, transparent 45%),
  radial-gradient(circle at 70% 20%, rgba(190, 230, 255, 0.8) 0%, transparent 40%),
  radial-gradient(circle at 90% 40%, rgba(240, 200, 255, 0.7) 0%, transparent 45%);
  pointer-events: none;
  z-index: 0;
  animation: bigGlowMove 8s infinite alternate ease-in-out; /* 从20s改为8s，速度更快 */
  mix-blend-mode: screen;
}

@keyframes bigGlowMove {
  0% { transform: translate(0, 0) scale(1); opacity: 0.8; }
  25% { transform: translate(-8%, 5%) scale(1.2); opacity: 1; }
  50% { transform: translate(6%, -8%) scale(1.1); opacity: 0.9; }
  75% { transform: translate(-5%, -5%) scale(1.3); opacity: 1; }
  100% { transform: translate(8%, 6%) scale(1.15); opacity: 0.8; }
}

/* 额外小光斑，增加层次（速度加快） */
.login-container::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 50%, rgba(255, 255, 200, 0.4) 0%, transparent 25%),
  radial-gradient(circle at 70% 30%, rgba(200, 240, 255, 0.4) 0%, transparent 30%),
  radial-gradient(circle at 10% 90%, rgba(255, 200, 240, 0.4) 0%, transparent 30%);
  pointer-events: none;
  z-index: 0;
  animation: smallGlowMove 6s infinite alternate; /* 从15s改为6s，速度更快 */
  mix-blend-mode: overlay;
}

@keyframes smallGlowMove {
  0% { transform: translate(0, 0) scale(1); opacity: 0.4; }
  100% { transform: translate(3%, -3%) scale(1.1); opacity: 0.7; }
}

/* ===== 登录卡片 - 干净玻璃效果 ===== */
.login-box {
  width: 400px;
  padding: 48px 40px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px) saturate(150%);
  border-radius: 36px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255,255,255,0.8) inset;
  position: relative;
  z-index: 2;
  transition: transform 0.4s ease, box-shadow 0.4s ease;
  border: 1px solid rgba(255,255,255,0.6);
  animation: cardFloat 6s infinite alternate ease-in-out;
}

/* 卡片浮动动画 */
@keyframes cardFloat {
  0% { transform: translateY(0); }
  100% { transform: translateY(-6px); }
}

/* 柔和边框光晕 */
.login-box::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 38px;
  padding: 2px;
  background: linear-gradient(120deg, #a0c0ff, #c0a0ff, #ffb3b3, #a0e0d0, #a0c0ff);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.3;
  animation: borderGlow 8s linear infinite;
  pointer-events: none;
  z-index: -1;
}

@keyframes borderGlow {
  0% { filter: hue-rotate(0deg); opacity: 0.3; }
  50% { opacity: 0.5; }
  100% { filter: hue-rotate(360deg); opacity: 0.3; }
}

/* ===== 头部文字 ===== */
.login-header {
  text-align: center;
  margin-bottom: 40px;
  position: relative;
}

.login-header h2 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.login-header p {
  margin: 0;
  color: #5a6a7a;
  font-size: 15px;
  font-weight: 400;
  position: relative;
  display: inline-block;
}

.login-header p::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #7b9cff, #b08cff, #ff9c9c);
  border-radius: 3px;
  box-shadow: 0 2px 6px rgba(123, 156, 255, 0.3);
}

/* ===== 表单项 ===== */
.el-form-item {
  margin-bottom: 28px;
  position: relative;
}

/* 输入框 - 浅色风格 */
:deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04), 0 0 0 1px #e0e5ec inset;
  border-radius: 24px;
  padding: 4px 20px;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 4px 16px rgba(123, 156, 255, 0.2), 0 0 0 2px #7b9cff inset;
  background: #ffffff;
  transform: scale(1.01);
}

:deep(.el-input__inner) {
  height: 48px;
  font-size: 16px;
  color: #1e2b3a;
}

:deep(.el-input__inner::placeholder) {
  color: #9aa9b9;
  font-weight: 300;
}

:deep(.el-input__prefix-inner) {
  color: #7b9cff;
  font-size: 20px;
  margin-right: 8px;
  filter: drop-shadow(0 2px 4px rgba(123,156,255,0.2));
}

/* 聚焦下划线 */
:deep(.el-input__wrapper)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: #7b9cff;
  transition: all 0.3s ease;
  transform: translateX(-50%);
  border-radius: 2px;
}

:deep(.el-input__wrapper.is-focus)::after {
  width: 80%;
}

/* ===== 验证码区域 ===== */
.captcha-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.captcha-img {
  width: 120px;
  height: 48px;
  border-radius: 24px;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04), 0 0 0 1px #e0e5ec inset;
  transition: all 0.2s ease;
  background: #f8fafd;
  position: relative;
}

.captcha-img:hover {
  box-shadow: 0 4px 16px rgba(123, 156, 255, 0.2), 0 0 0 2px #b08cff inset;
  transform: scale(1.02);
}

.captcha-img img {
  width: 100%;
  height: 100%;
  //object-fit: contain;
  object-position: center;  /* 默认就是 center，可省略 */
  display: block;
}

.captcha-loading {
  color: #7f8c8d;
  font-size: 12px;
  text-align: center;
  line-height: 48px;
}

/* ===== 登录按钮 ===== */
:deep(.el-button--primary) {
  background: linear-gradient(135deg, #7b9cff, #b08cff, #ff9c9c);
  background-size: 200% 200%;
  border: none;
  border-radius: 36px;
  height: 52px;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 1px;
  box-shadow: 0 10px 20px rgba(123, 156, 255, 0.25);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  color: white;
}

:deep(.el-button--primary:hover) {
  background-position: 100% 50%;
  transform: translateY(-3px);
  box-shadow: 0 18px 30px rgba(123, 156, 255, 0.35);
}

:deep(.el-button--primary:active) {
  transform: translateY(0);
  box-shadow: 0 5px 15px rgba(123, 156, 255, 0.3);
}

/* 点击波纹效果 */
:deep(.el-button--primary)::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transform: translate(-50%, -50%);
  transition: width 0.4s ease-out, height 0.4s ease-out, opacity 0.4s;
  opacity: 0;
  pointer-events: none;
}

:deep(.el-button--primary:active)::after {
  width: 300px;
  height: 300px;
  opacity: 0.2;
  transition: 0s;
}

/* 加载状态 */
:deep(.el-button--primary.is-loading) {
  opacity: 0.9;
  filter: brightness(1.05);
}

/* ===== 底部隐藏区域 ===== */
.login-footer {
  display: none;
}

/* ===== 版权信息 ===== */
.copyright {
  margin-top: 28px;
  color: #5f6b7a;
  font-size: 13px;
  font-weight: 400;
  letter-spacing: 0.5px;
  position: relative;
  z-index: 2;
  padding: 4px 12px;
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 6px rgba(0,0,0,0.02);
}

/* ===== 响应式优化 ===== */
@media (max-width: 480px) {
  .login-box {
    width: 90%;
    padding: 40px 24px;
  }

  .captcha-img {
    width: 100px;
  }
}
</style>
