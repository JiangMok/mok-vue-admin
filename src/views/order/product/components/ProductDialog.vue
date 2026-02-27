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
      <el-form-item label="商品名称" prop="productName">
        <el-input
          v-model="formData.productName"
          placeholder="请输入商品名称"
          clearable
          :maxlength="100"
          show-word-limit
        />
        <div class="field-tip">最长100个字符</div>
      </el-form-item>

      <el-form-item label="商品描述" prop="productDesc">
        <el-input
          v-model="formData.productDesc"
          placeholder="请输入商品描述"
          clearable
          :maxlength="500"
          show-word-limit
          type="textarea"
          :rows="3"
        />
        <div class="field-tip">最长500个字符</div>
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="商品价格" prop="price">
            <el-input-number
              v-model="formData.price"
              :min="0"
              :max="99999999.99"
              :precision="2"
              :step="0.01"
              controls-position="right"
              style="width: 100%"
              placeholder="请输入商品价格"
            >
              <template #prefix>¥</template>
            </el-input-number>
            <div class="field-tip">单位：元，支持两位小数</div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="商品库存" prop="stock">
            <el-input-number
              v-model="formData.stock"
              :min="0"
              :max="999999"
              :precision="0"
              :step="1"
              controls-position="right"
              style="width: 100%"
              placeholder="请输入库存数量"
            />
            <div class="field-tip">单位：件，必须是整数</div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="商品状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="1">上架</el-radio>
          <el-radio :value="0">下架</el-radio>
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
import type { ProductFormData } from '@/types'
import { productApi } from '@/api'

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

// 表单引用
const formRef = ref<FormInstance>()

// 表单数据
const formData = reactive<ProductFormData>({
  id: '',
  productName: '',
  productDesc: '',
  price: 0,
  stock: 0,
  status: 1
})

// 提交加载状态
const submitLoading = ref(false)

// 计算属性
const dialogTitle = computed(() => {
  return props.isEdit ? '编辑商品' : '新增商品'
})

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 表单验证规则
const formRules: FormRules = {
  productName: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  productDesc: [
    { max: 500, message: '长度不能超过500个字符', trigger: 'blur' }
  ],
  price: [
    { required: true, message: '请输入商品价格', trigger: 'blur' },
    {
      type: 'number',
      validator: (rule, value, callback) => {
        if (value < 0) {
          callback(new Error('价格不能为负数'))
        } else if (value > 99999999.99) {
          callback(new Error('价格不能超过99999999.99'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  stock: [
    { required: true, message: '请输入商品库存', trigger: 'blur' },
    {
      type: 'number',
      validator: (rule, value, callback) => {
        if (value < 0) {
          callback(new Error('库存不能为负数'))
        } else if (value > 999999) {
          callback(new Error('库存不能超过999999'))
        } else if (!Number.isInteger(value)) {
          callback(new Error('库存必须是整数'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  status: [
    { required: true, message: '请选择商品状态', trigger: 'change' }
  ]
}

// 初始化表单数据
const initFormData = () => {
  if (props.isEdit && props.editData) {
    Object.assign(formData, {
      id: props.editData.id,
      productName: props.editData.productName || '',
      productDesc: props.editData.productDesc || '',
      price: props.editData.price || 0,
      stock: props.editData.stock || 0,
      status: props.editData.status !== undefined ? props.editData.status : 1
    })
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
    id: '',
    productName: '',
    productDesc: '',
    price: 0,
    stock: 0,
    status: 1
  })
}

// 关闭对话框
const handleClose = () => {
  if (formData.productName || formData.productDesc || formData.price > 0 || formData.stock > 0) {
    ElMessageBox.confirm('确认关闭？已填写的内容将不会被保存', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      dialogVisible.value = false
      resetForm()
    }).catch(() => {
      // 取消关闭
    })
  } else {
    dialogVisible.value = false
    resetForm()
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    // 验证表单
    await formRef.value.validate()

    submitLoading.value = true

    // 准备提交数据
    const submitData: any = {
      productName: formData.productName,
      productDesc: formData.productDesc,
      price: formData.price,
      stock: formData.stock,
      status: formData.status
    }

    // 编辑时需要添加id
    if (props.isEdit && formData.id) {
      submitData.id = formData.id
    }

    // console.log('提交数据:', JSON.stringify(submitData, null, 2))

    // 调用API
    if (props.isEdit && formData.id) {
      await productApi.update(submitData)
      ElMessage.success('商品更新成功')
    } else {
      await productApi.add(submitData)
      ElMessage.success('商品添加成功')
    }

    // 触发成功事件
    emit('success')

    // 关闭对话框
    dialogVisible.value = false
    resetForm()

  } catch (error: any) {
    // console.error('表单提交错误:', error)
    if (error.fields) {
      ElMessage.error('请正确填写表单信息')
    } else {
      ElMessage.error(error.msg || error.message || '提交失败，请重试')
    }
  } finally {
    submitLoading.value = false
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
