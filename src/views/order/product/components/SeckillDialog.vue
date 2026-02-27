<template>
  <el-dialog
    v-model="dialogVisible"
    title="设置秒杀"
    width="600px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      label-position="left"
    >
      <div class="product-info">
        <h4>{{ productData?.productName }}</h4>
        <div class="original-info">
          <span class="original-price">原价: ¥{{ formatPrice(productData?.price || 0) }}</span>
          <span class="original-stock">总库存: {{ productData?.stock || 0 }}</span>
        </div>
      </div>

      <el-form-item label="秒杀价格" prop="seckillPrice">
        <el-input-number
          v-model="formData.seckillPrice"
          :min="0"
          :max="productData?.price || 99999999.99"
          :precision="2"
          :step="0.01"
          controls-position="right"
          style="width: 100%"
          placeholder="请输入秒杀价格"
        >
          <template #prefix>¥</template>
        </el-input-number>
        <div class="field-tip">必须低于商品原价，支持两位小数</div>
      </el-form-item>

      <el-form-item label="秒杀库存" prop="seckillStock">
        <el-input-number
          v-model="formData.seckillStock"
          :min="0"
          :max="productData?.stock || 0"
          :precision="0"
          :step="1"
          controls-position="right"
          style="width: 100%"
          placeholder="请输入秒杀库存"
        />
        <div class="field-tip">不能超过商品总库存，必须是整数</div>
      </el-form-item>

      <el-form-item label="秒杀开始时间" prop="seckillStartTime">
        <el-date-picker
          v-model="formData.seckillStartTime"
          type="datetime"
          placeholder="选择开始时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
        />
        <div class="field-tip">秒杀活动的开始时间</div>
      </el-form-item>

      <el-form-item label="秒杀结束时间" prop="seckillEndTime">
        <el-date-picker
          v-model="formData.seckillEndTime"
          type="datetime"
          placeholder="选择结束时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
        />
        <div class="field-tip">秒杀活动的结束时间，必须晚于开始时间</div>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="danger" @click="handleClearSeckill" :loading="clearLoading" v-if="hasSeckill">
          清除秒杀
        </el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          {{ hasSeckill ? '更新秒杀' : '设置秒杀' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { productApi } from '@/api'

interface Props {
  visible: boolean
  productData?: any
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  productData: null
})

const emit = defineEmits<Emits>()

// 表单引用
const formRef = ref<FormInstance>()

// 表单数据
const formData = reactive({
  seckillPrice: 0,
  seckillStock: 0,
  seckillStartTime: '',
  seckillEndTime: ''
})

// 加载状态
const submitLoading = ref(false)
const clearLoading = ref(false)

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 检查是否已有秒杀设置
const hasSeckill = computed(() => {
  return props.productData?.seckillPrice && props.productData.seckillPrice > 0
})

// 格式化价格
const formatPrice = (price: number) => {
  return price ? price.toFixed(2) : '0.00'
}

// 表单验证规则
const formRules: FormRules = {
  seckillPrice: [
    { required: true, message: '请输入秒杀价格', trigger: 'blur' },
    {
      type: 'number',
      validator: (rule, value, callback) => {
        if (value <= 0) {
          callback(new Error('秒杀价格必须大于0'))
        } else if (value >= (props.productData?.price || 0)) {
          callback(new Error('秒杀价格必须低于原价'))
        } else if (value > 99999999.99) {
          callback(new Error('秒杀价格不能超过99999999.99'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  seckillStock: [
    { required: true, message: '请输入秒杀库存', trigger: 'blur' },
    {
      type: 'number',
      validator: (rule, value, callback) => {
        if (value < 0) {
          callback(new Error('秒杀库存不能为负数'))
        } else if (value > (props.productData?.stock || 0)) {
          callback(new Error('秒杀库存不能超过商品总库存'))
        } else if (!Number.isInteger(value)) {
          callback(new Error('秒杀库存必须是整数'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  seckillStartTime: [
    { required: true, message: '请选择秒杀开始时间', trigger: 'change' }
  ],
  seckillEndTime: [
    { required: true, message: '请选择秒杀结束时间', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (value && formData.seckillStartTime) {
          const startTime = new Date(formData.seckillStartTime).getTime()
          const endTime = new Date(value).getTime()
          if (endTime <= startTime) {
            callback(new Error('结束时间必须晚于开始时间'))
          } else {
            callback()
          }
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

// 初始化表单数据
const initFormData = () => {
  if (props.productData) {
    formData.seckillPrice = props.productData.seckillPrice || 0
    formData.seckillStock = props.productData.seckillStock || 0
    formData.seckillStartTime = props.productData.seckillStartTime || ''
    formData.seckillEndTime = props.productData.seckillEndTime || ''
  } else {
    resetForm()
  }
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.clearValidate()
  }
  Object.assign(formData, {
    seckillPrice: 0,
    seckillStock: 0,
    seckillStartTime: '',
    seckillEndTime: ''
  })
}

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    submitLoading.value = true

    const submitData = {
      id: props.productData?.id,
      seckillPrice: formData.seckillPrice,
      seckillStock: formData.seckillStock,
      seckillStartTime: formData.seckillStartTime,
      seckillEndTime: formData.seckillEndTime
    }

    await productApi.setSeckill(submitData)
    ElMessage.success(hasSeckill.value ? '秒杀信息已更新' : '秒杀设置成功')

    emit('success')
    dialogVisible.value = false
    resetForm()

  } catch (error: any) {
    if (error.fields) {
      ElMessage.error('请正确填写秒杀信息')
    } else {
      ElMessage.error(error.msg || error.message || '设置失败，请重试')
    }
  } finally {
    submitLoading.value = false
  }
}

// 清除秒杀
const handleClearSeckill = async () => {
  try {
    await ElMessageBox.confirm(
      '确定清除该商品的秒杀设置吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    clearLoading.value = true
    await productApi.clearSeckill(props.productData?.id)
    ElMessage.success('秒杀设置已清除')

    emit('success')
    dialogVisible.value = false
    resetForm()

  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  } finally {
    clearLoading.value = false
  }
}

// 监听对话框显示
watch(() => props.visible, (newVal) => {
  if (newVal) {
    initFormData()
  }
})
</script>

<style scoped>
.product-info {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
}

.product-info h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 16px;
}

.original-info {
  display: flex;
  gap: 20px;
}

.original-price {
  color: #ff6b35;
  font-weight: 500;
}

.original-stock {
  color: #409eff;
  font-weight: 500;
}

.el-form-item {
  margin-bottom: 20px;
}

.field-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  line-height: 1.4;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
