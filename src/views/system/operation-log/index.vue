<template>
  <div class="user-manage">
    <div class="page-header">
      <h2>操作日志</h2>
    </div>

    <!-- 搜索区域 -->
    <div class="search-container">
      <el-form :model="searchForm" inline>
        <el-form-item label="用户名">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入模块标题"
            clearable
          />
        </el-form-item>

        <el-form-item label="操作类别">
          <el-select v-model="searchForm.params.operatorType" placeholder="操作类别" clearable
                     style="width: 120px">
            <el-option label="全部" :value="''"/>
            <el-option label="新增" :value="1"/>
            <el-option label="修改" :value="2"/>
            <el-option label="删除" :value="3"/>
            <el-option label="其它" :value="0"/>
          </el-select>
        </el-form-item>

        <el-form-item label="操作状态">
          <el-select v-model="searchForm.params.status" placeholder="操作状态" clearable
                     style="width: 120px">
            <el-option label="全部" :value="''"/>
            <el-option label="正常" :value="0"/>
            <el-option label="异常" :value="1"/>
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      <!-- 时间form -->
      <el-form :model="timeForm" inline>
        <el-form-item label="清除指定日期前:">
          <el-date-picker
            v-model="timeForm.beforeTime"
            type="date"
            placeholder="选择日期"
            :disabled-date="disabledDate"
            :shortcuts="shortcuts"
            :size="size"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="cleanBefore">清除</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格区域 -->
    <div class="table-container">
      <el-table
        :data="operationLogList"
        border
        stripe
        v-loading="loading"
        @selection-change="handleSelectionChange"
        style="width: 100%"
      >
<!--        <el-table-column type="selection" width="55"/>-->

        <el-table-column prop="title" label="操作模块" width=""/>
        <el-table-column prop="businessType" label="业务类型" width=""/>
        <!--        <el-table-column prop="method" label="方法名称" width=""/>-->
        <el-table-column prop="requestMethod" label="请求方式" width=""/>
        <el-table-column label="操作类别" width="100">
          <template #default="{ row }">
            <el-tag :type="getOperatorTypeTag(row.operatorType)" size="small">
              {{ formatOperatorType(row.operatorType) }}
            </el-tag>
          </template>
        </el-table-column>
        <!--        <el-table-column prop="operatorId" label="操作人员ID" width=""/>-->
        <el-table-column prop="operatorName" label="操作人员" width=""/>
        <!--        <el-table-column prop="deptName" label="部门名称" width=""/>-->
        <el-table-column prop="operUrl" label="请求URL" width=""/>
        <el-table-column prop="operIp" label="操作主机IP" width=""/>
        <!--        <el-table-column prop="operLocation" label="操作地点" width=""/>-->
        <!--        <el-table-column prop="operParam" label="请求参数" width=""/>-->
        <!--        <el-table-column prop="jsonResult" label="返回参数" width=""/>-->
        <el-table-column prop="status" label="操作状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'danger' : 'success'">
              {{ row.status === 1 ? '异常' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <!--        <el-table-column prop="errorMsg" label="错误消息" width=""/>-->
        <el-table-column prop="createTime" label="操作时间">
          <template #default="{ row }">
            {{ formatDate(row.operTime) }}
          </template>
        </el-table-column>


        <el-table-column prop="createTime" label="创建时间">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">

            <el-button
              type="primary"
              size="small"
              @click="handleDetail(row)"
              v-if="userStore.hasPermission('system:log:query')"
            >
              详情
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row)"
              v-if="userStore.hasPermission('system:log:delete')"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="pagination.pageNum"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
    <OperationLogDetail
      v-model:visible="detailDialogVisible"
      :operationLogId="selectedOperationLogId"
      :operation-log-data="operationLogData || undefined"
    />
  </div>

</template>

<script setup lang="ts">
import type {OperationLog} from "@/types";
import {onMounted, reactive, ref} from "vue";
import {useUserStore} from "@/stores/user.ts";
import {ElMessage, ElMessageBox} from "element-plus";
import {operationLogApi} from "@/api";
// 在你Index.vue 或父组件中
import OperationLogDetail from './components/OperationLogDetail.vue' // 确保路径正确

//===========创建基础对象 表单默认值===============
//使用userStore验证权限
const userStore = useUserStore()
// 加载状态
const loading = ref(false)
//操作日志列表
const operationLogList = ref<OperationLog[]>([])
//搜索表单
const searchForm = reactive({
  keyword: '',
  params: {
    operatorType: undefined,
    status: undefined
  }
})
//时间表单
const timeForm = reactive({
  beforeTime: ''
})
// 表格选择
const selectedRows = ref<OperationLog[]>([])
//详情页面的显示:默认不显示
const detailDialogVisible = ref(false)
const selectedOperationLogId = ref('')
// const operationLogId = ref('')
const operationLogData = ref<OperationLog | null>(null)

const shortcuts = [
  {
    text: '今天',
    value: new Date(),
  },
  {
    text: '昨天',
    value: () => {
      const date = new Date()
      date.setTime(date.getTime() - 3600 * 1000 * 24)
      return date
    },
  },
  {
    text: '一周前',
    value: () => {
      const date = new Date()
      date.setTime(date.getTime() - 3600 * 1000 * 24 * 7)
      return date
    },
  },
]

const disabledDate = (time: Date) => {
  return time.getTime() > Date.now()
}
const size = ref<'default'>('default')
//===========================函数---开始==============================

const handleDetail = (row: OperationLog) => {
  selectedOperationLogId.value = row.id
  operationLogData.value = row
  detailDialogVisible.value = true
}
/**
 * 表格选择改变
 */
const handleSelectionChange = (rows: OperationLog[]) => {
  selectedRows.value = rows
}
/**
 * 获取操作日志列表
 */
const fetchList = async () => {
  try {
    loading.value = true

    // 构建请求参数
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      ...searchForm
    }

    // 清除空值
    const cleanParams: Record<string, any> = { ...params }
    Object.keys(cleanParams).forEach(key => {
      if (cleanParams[key] === '' || cleanParams[key] === undefined || cleanParams[key] === null) {
        delete cleanParams[key]
      }
    })

    const res = await operationLogApi.getPage(params)
    // console.log('用户列表响应:', res)
    //将返回的数据传给页面列表
    operationLogList.value = res.data.data || []
    pagination.total = res.data.total || 0
  } catch (error) {
    // console.error('获取操作日志列表失败:', error)
    ElMessage.error('获取列表失败')
  } finally {
    loading.value = false
  }
}
/**
 * 删除用户
 */
const handleDelete = async (row: OperationLog) => {
  try {
    await ElMessageBox.confirm(
      `确定删除吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await operationLogApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 格式化操作类型文本
const formatOperatorType = (type: number) => {
  const typeMap: Record<number, string> = {
    0: '其他',
    1: '后台用户',
    2: '手机端用户'
  }
  return typeMap[type] || '未知'
}
// 获取操作类型的标签样式
const getOperatorTypeTag = (type: number) => {
  const typeMap: Record<number, string> = {
    0: 'info',
    1: 'primary',
    2: 'success'
  }
  return typeMap[type] || 'info'
}
//===========================函数---结束==============================
//===========================分页---开始==============================
//分页参数
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})
/**
 * 分页大小改变
 */
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.pageNum = 1
  fetchList()
}

/**
 * 页码改变
 */
const handlePageChange = (page: number) => {
  pagination.pageNum = page
  fetchList()
}
//=================页面加载时的操作(生命周期钩子)============================================
onMounted(() => {
  // console.log('操作日志页面加载')
  fetchList()
})
//===========================分页---结束==============================
/**
 * 搜索:保留搜索条件,重置到第1页
 */
const handleSearch = () => {
  pagination.pageNum = 1
  fetchList()
}
/**
 * 清除某一日期前的数据
 */
const cleanBefore = async () => {
  try {
    await ElMessageBox.confirm(
      `确定删除吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const time = formatDate(timeForm.beforeTime);
    if(time === ''){
      ElMessage.error("请选择时间")
      return
    }
    // console.log("时间:",time)
     const res = await operationLogApi.cleanBefore(time)
    if(res.code === 200){
      ElMessage.success('删除成功')
      pagination.pageNum = 1
      fetchList()
    }
    else{
      ElMessage.error(res.msg)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }

}
/**
 * 重置搜索:清空搜索条件,重置到第1页
 */
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.params.status = undefined
  searchForm.params.operatorType = undefined
  pagination.pageNum = 1
  fetchList()
}
/**
 * 格式化日期
 */
const formatDate = (dateString: string) => {
  if (!dateString) return ''

  try {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch (error) {
    // console.log("日期格式化失败:", error)
    return dateString
  }
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #333;
}

.search-container {
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 4px;
}

.table-container {
  margin-bottom: 20px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
}
</style>
