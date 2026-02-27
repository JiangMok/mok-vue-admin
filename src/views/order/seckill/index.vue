<template>
  <div class="seckill-manage">
    <div class="page-header">
      <h2>秒杀管理</h2>
    </div>

    <el-row :gutter="20">
      <!-- 秒杀下单卡片 -->
      <el-col :span="8">
        <el-card class="function-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>秒杀下单</span>
              <el-tag type="danger" size="small">测试接口</el-tag>
            </div>
          </template>
          <el-form :model="orderForm" label-width="80px">
            <el-form-item label="商品ID">
              <el-input v-model="orderForm.productId" placeholder="请输入商品ID" clearable />
            </el-form-item>
            <el-form-item label="购买数量">
              <el-input-number v-model="orderForm.quantity" :min="1" :max="999" style="width: 100%" />
            </el-form-item>
            <el-form-item label="验证码">
              <el-input v-model="orderForm.verifyCode" placeholder="选填" clearable />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSeckillOrder" :loading="orderLoading" block>
                立即下单
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 获取验证码卡片 -->
      <el-col :span="8">
        <el-card class="function-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>获取秒杀验证码</span>
              <el-tag type="warning" size="small">测试接口</el-tag>
            </div>
          </template>
          <el-form :model="codeForm" label-width="80px">
            <el-form-item label="商品ID">
              <el-input v-model="codeForm.productId" placeholder="请输入商品ID" clearable />
            </el-form-item>
            <el-form-item>
              <el-button type="warning" @click="handleGetVerifyCode" :loading="codeLoading" block>
                获取验证码
              </el-button>
            </el-form-item>
          </el-form>
          <div v-if="verifyCode" class="code-result">
            <span class="label">验证码：</span>
            <span class="value">{{ verifyCode }}</span>
            <el-button type="primary" link @click="copyCode">复制</el-button>
          </div>
        </el-card>
      </el-col>

      <!-- 初始化库存卡片 -->
      <el-col :span="8">
        <el-card class="function-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>初始化秒杀库存</span>
              <el-tag type="success" size="small">管理员</el-tag>
            </div>
          </template>
          <div style="text-align: center; padding: 20px 0">
            <el-button type="danger" @click="handleInitStock" :loading="initLoading">
              立即初始化
            </el-button>
          </div>
          <p class="tip">将数据库中的秒杀商品库存同步到Redis，用于秒杀活动</p>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { seckillApi } from '@/api' // 假设已有秒杀API模块


// 秒杀下单表单
const orderForm = reactive({
  productId: '',
  quantity: 1,
  verifyCode: ''
})
const orderLoading = ref(false)

// 获取验证码表单
const codeForm = reactive({
  productId: ''
})
const codeLoading = ref(false)
const verifyCode = ref('')

// 初始化库存
const initLoading = ref(false)

// 秒杀下单
const handleSeckillOrder = async () => {
  if (!orderForm.productId) {
    ElMessage.warning('请输入商品ID')
    return
  }
  const productId = orderForm.productId
  const quantity = orderForm.quantity
  const verifyCode = orderForm.verifyCode || undefined
  try {
    orderLoading.value = true
    const res = await seckillApi.seckillOrder(productId, quantity, verifyCode
    )
    if (res.code === 200) {
      ElMessage.success(`下单成功，订单号：${res.data}`)
    } else {
      ElMessage.error(res.msg || '下单失败')
    }
  } catch (error) {
    ElMessage.error('接口调用失败')
  } finally {
    orderLoading.value = false
  }
}

// 获取验证码
const handleGetVerifyCode = async () => {
  if (!codeForm.productId) {
    ElMessage.warning('请输入商品ID')
    return
  }
  try {
    codeLoading.value = true
    const res = await seckillApi.getSeckillVerifyCode(codeForm.productId)
    if (res.code === 200) {
      console.log(res)
      verifyCode.value = res.data
      ElMessage.success('获取验证码成功')
    } else {
      ElMessage.error(res.msg || '获取失败')
    }
    // 加载商品ID至秒杀下单窗口
    orderForm.productId = codeForm.productId
    // 加载验证码到秒杀下单窗口
    orderForm.verifyCode = res.data

  } catch (error) {
    ElMessage.error('接口调用失败')
  } finally {
    codeLoading.value = false
  }
}

// 复制验证码
const copyCode = () => {
  navigator.clipboard.writeText(verifyCode.value).then(() => {
    ElMessage.success('复制成功')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

// 初始化库存
const handleInitStock = async () => {
  try {
    initLoading.value = true
    const res = await seckillApi.initSeckillStock()
    if (res.code === 200) {
      ElMessage.success('初始化成功')
    } else {
      ElMessage.error(res.msg || '初始化失败')
    }
  } catch (error) {
    ElMessage.error('接口调用失败')
  } finally {
    initLoading.value = false
  }
}
</script>

<style scoped>
.seckill-manage {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #333;
}

.function-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.code-result {
  margin-top: 20px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.code-result .label {
  color: #666;
  font-size: 14px;
}

.code-result .value {
  font-family: monospace;
  font-weight: bold;
  color: #ff6b35;
  font-size: 16px;
}

.tip {
  color: #999;
  font-size: 12px;
  text-align: center;
  margin-top: 10px;
}
</style>
