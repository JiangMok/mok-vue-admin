<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="600px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      label-position="left"
    >
      <el-form-item label="优惠券名称" prop="couponName">
        <el-input
          v-model="formData.couponName"
          placeholder="请输入优惠券名称"
          :maxlength="50"
          show-word-limit
          clearable
        />
      </el-form-item>

      <el-form-item label="优惠券类型" prop="couponType">
        <el-select
          v-model="formData.couponType"
          placeholder="请选择类型"
          style="width: 100%"
          @change="handleTypeChange"
        >
          <el-option label="满减券" :value="1" />
          <el-option label="折扣券" :value="2" />
          <el-option label="立减券" :value="3" />
        </el-select>
      </el-form-item>

      <!-- 满减券特有字段 -->
      <template v-if="formData.couponType === 1">
        <el-form-item label="使用门槛" prop="thresholdAmount">
          <el-input-number
            v-model="formData.thresholdAmount"
            :min="0.01"
            :precision="2"
            :step="10"
            placeholder="满多少金额可用"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="优惠金额" prop="discountAmount">
          <el-input-number
            v-model="formData.discountAmount"
            :min="0.01"
            :precision="2"
            :step="5"
            placeholder="减免金额"
            style="width: 100%"
          />
        </el-form-item>
      </template>

      <!-- 折扣券特有字段 -->
      <template v-if="formData.couponType === 2">
        <el-form-item label="折扣率" prop="discountRate">
          <el-input-number
            v-model="formData.discountRate"
            :min="1"
            :max="99"
            :step="1"
            placeholder="1~99之间的整数"
            style="width: 100%"
          >
            <template #suffix>折</template>
          </el-input-number>
        </el-form-item>
      </template>

      <!-- 立减券特有字段 -->
      <template v-if="formData.couponType === 3">
        <el-form-item label="优惠金额" prop="discountAmount">
          <el-input-number
            v-model="formData.discountAmount"
            :min="0.01"
            :precision="2"
            :step="5"
            placeholder="立减金额"
            style="width: 100%"
          />
        </el-form-item>
        <!-- 立减券无门槛，thresholdAmount 强制设为 null -->
      </template>

      <el-form-item label="总发放量" prop="totalQuantity">
        <el-input-number
          v-model="formData.totalQuantity"
          :min="1"
          :step="100"
          placeholder="发放总数"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="每人限领" prop="perLimit">
        <el-input-number
          v-model="formData.perLimit"
          :min="1"
          :max="100"
          :step="1"
          placeholder="每人最多领取数量"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="有效期" prop="dateRange">
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
          @change="handleDateRangeChange"
        />
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="1">启用</el-radio>
          <el-radio :value="0">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import type { CouponFormData } from '@/types/index.ts'
import { couponApi } from '@/api'

interface Props {
  visible: boolean
  isEdit?: boolean
  editData?: any
}
interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  isEdit: false,
  editData: null
})
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const submitLoading = ref(false)

// 表单数据
const formData = reactive<CouponFormData>({
  couponName: '',
  couponType: 1, // 默认满减券
  thresholdAmount: null,
  discountAmount: null,
  discountRate: null,
  totalQuantity: 100,
  perLimit: 1,
  startTime: '',
  endTime: '',
  status: 1
})

// 日期范围绑定
const dateRange = ref<string[]>([])

// 对话框标题
const dialogTitle = computed(() => (props.isEdit ? '编辑优惠券' : '新增优惠券'))

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

// 表单验证规则
const formRules: FormRules = {
  couponName: [
    { required: true, message: '请输入优惠券名称', trigger: 'blur' },
    { max: 50, message: '长度不能超过50字符', trigger: 'blur' }
  ],
  couponType: [{ required: true, message: '请选择优惠券类型', trigger: 'change' }],
  thresholdAmount: [
    {
      required: (rule, value, callback) => formData.couponType === 1,
      message: '请输入使用门槛',
      trigger: 'blur'
    },
    { type: 'number', min: 0.01, message: '门槛金额必须大于0', trigger: 'blur' }
  ],
  discountAmount: [
    {
      required: (rule, value, callback) => formData.couponType === 1 || formData.couponType === 3,
      message: '请输入优惠金额',
      trigger: 'blur'
    },
    { type: 'number', min: 0.01, message: '优惠金额必须大于0', trigger: 'blur' }
  ],
  discountRate: [
    {
      required: (rule, value, callback) => formData.couponType === 2,
      message: '请输入折扣率',
      trigger: 'blur'
    },
    { type: 'number', min: 1, max: 99, message: '折扣率必须在1~99之间', trigger: 'blur' }
  ],
  totalQuantity: [
    { required: true, message: '请输入总发放量', trigger: 'blur' },
    { type: 'number', min: 1, message: '发放量至少为1', trigger: 'blur' }
  ],
  perLimit: [
    { required: true, message: '请输入每人限领数量', trigger: 'blur' },
    { type: 'number', min: 1, max: 100, message: '限领数量在1~100之间', trigger: 'blur' }
  ],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  dateRange: [
    {
      required: true,
      validator: (rule, value, callback) => {
        if (!dateRange.value || dateRange.value.length !== 2) {
          callback(new Error('请选择有效期'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

// 类型改变时清空不相关字段并重置验证
const handleTypeChange = () => {
  if (formData.couponType === 1) {
    formData.discountRate = null
  } else if (formData.couponType === 2) {
    formData.thresholdAmount = null
    formData.discountAmount = null
  } else if (formData.couponType === 3) {
    formData.thresholdAmount = null
    formData.discountRate = null
  }
  // 清除对应字段的验证状态
  formRef.value?.clearValidate(['thresholdAmount', 'discountAmount', 'discountRate'])
}

// 日期范围变化处理
const handleDateRangeChange = (val: string[]) => {
  if (val && val.length === 2) {
    formData.startTime = val[0]
    formData.endTime = val[1]
  } else {
    formData.startTime = ''
    formData.endTime = ''
  }
}

// 初始化表单（编辑时填充数据）
const initFormData = () => {
  if (props.isEdit && props.editData) {
    const data = props.editData
    formData.id = data.id
    formData.couponName = data.couponName
    formData.couponType = data.couponType
    formData.thresholdAmount = data.thresholdAmount
    formData.discountAmount = data.discountAmount
    formData.discountRate = data.discountRate
    formData.totalQuantity = data.totalQuantity
    formData.perLimit = data.perLimit
    formData.startTime = data.startTime
    formData.endTime = data.endTime
    formData.status = data.status
    // 设置日期范围
    if (data.startTime && data.endTime) {
      dateRange.value = [data.startTime, data.endTime]
    }
  } else {
    // 新增模式重置
    resetForm()
  }
}

// 重置表单
const resetForm = () => {
  formRef.value?.clearValidate()
  Object.assign(formData, {
    couponName: '',
    couponType: 1,
    thresholdAmount: null,
    discountAmount: null,
    discountRate: null,
    totalQuantity: 100,
    perLimit: 1,
    startTime: '',
    endTime: '',
    status: 1
  })
  dateRange.value = []
}

// 关闭对话框
const handleClose = () => {
  if (!props.isEdit && (formData.couponName || formData.couponType)) {
    ElMessageBox.confirm('确认关闭？已填写的内容将不会保存', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(() => {
        dialogVisible.value = false
        resetForm()
      })
      .catch(() => {})
  } else {
    dialogVisible.value = false
    resetForm()
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    submitLoading.value = true

    const submitData = { ...formData }
    // 根据类型清理无关字段
    if (submitData.couponType === 2) {
      delete submitData.thresholdAmount
      delete submitData.discountAmount
    } else if (submitData.couponType === 3) {
      delete submitData.thresholdAmount
      delete submitData.discountRate
    }

    let res
    if (props.isEdit && props.editData) {
      res = await couponApi.update(submitData)
    } else {
      res = await couponApi.add(submitData)
    }

    emit('success')
    dialogVisible.value = false
    resetForm()
    // ElMessage.success(props.isEdit ? '更新成功' : '新增成功')
    // console.log(res.data)
    ElMessage.success(res.data)
  } catch (error: any) {
    // console.error('提交失败', error)
    ElMessage.error(error.msg || error.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

// 监听对话框显示
watch(() => props.visible, (val) => {
  if (val) {
    initFormData()
  }
})
</script>

<style scoped>
.el-form-item {
  margin-bottom: 20px;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
