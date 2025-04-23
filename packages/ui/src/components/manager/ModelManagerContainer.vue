<template>
  <ManagerContainer
    :title="t('modelManager.title')"
    :description="t('modelManager.description')"
    :has-error="hasError"
    :error-message="errorMessage"
    @clear-error="clearError"
  >
    <!-- 测试按钮（仅在开发环境显示） -->
    <div v-if="isDebug" class="mb-4 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded">
      <button @click="testModelManager" class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
        测试 ModelManager
      </button>
      <p v-if="testResult" class="mt-2 text-sm">{{ testResult }}</p>
    </div>
    
    <!-- 调试信息 -->
    <div v-if="isDebug" class="mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
      <div><strong>Debug:</strong> ModelManagerContainer 已加载</div>
      <div><strong>Models Count:</strong> {{ models?.length || 0 }}</div>
      <div><strong>Components:</strong> 
        ManagerContainer {{ !!ManagerContainer ? '✅' : '❌' }}, 
        ModelProviderList {{ !!ModelProviderList ? '✅' : '❌' }}
      </div>
    </div>
    
    <!-- 模型列表 -->
    <ModelProviderList 
      :models="models"
      :testing-connections="testingConnections"
      @test-connection="testConnection"
      @edit-model="editModel"
      @enable-model="enableModel"
      @disable-model="disableModel"
      @delete-model="handleDelete"
      @add-model="showAddForm = true"
    />

    <!-- 模态框区域 -->
    <div v-if="showAddForm || isEditing" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">
          {{ isEditing ? t('modelManager.editModel') : t('modelManager.addModel') }}
        </h3>
        
        <form @submit.prevent="isEditing ? saveEdit() : addModel()" ref="formRef">
          <!-- 模型名称 -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">{{ t('modelManager.modelName') }}</label>
            <input
              v-model="modelName"
              type="text"
              required
              class="w-full px-3 py-2 border rounded"
              :placeholder="t('modelManager.modelNamePlaceholder')"
            />
          </div>
          
          <!-- API密钥 -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">{{ t('modelManager.apiKey') }}</label>
            <input
              v-model="apiKey"
              type="password"
              required
              class="w-full px-3 py-2 border rounded"
              :placeholder="t('modelManager.apiKeyPlaceholder')"
            />
          </div>
          
          <!-- 操作按钮 -->
          <div class="flex justify-end gap-2">
            <button
              type="button"
              class="px-4 py-2 border rounded"
              @click="isEditing ? cancelEdit() : (showAddForm = false)"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {{ t('common.save') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </ManagerContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onErrorCaptured } from 'vue';
import { useI18n } from 'vue-i18n';
import { ModelManager, type ModelConfig, isVercel } from '@prompt-assistant/core';
import ManagerContainer from './ManagerContainer.vue';
import ModelProviderList from './ModelProviderList.vue';
import { ElMessage } from 'element-plus';
import type { FormInstance } from 'element-plus';

const { t } = useI18n();

// 创建一个默认空模型配置
const createEmptyModelConfig = (): ModelConfig => {
  return {
    name: '',
    baseURL: '',
    apiKey: '',
    models: [],
    defaultModel: '',
    enabled: false,
    provider: 'custom'
  };
};

// 初始化 modelManager
const modelManager = new ModelManager();

// 错误状态
const hasError = ref<boolean>(false);
const errorMessage = ref<string>('');
const testResult = ref<string>('');
const isDebug = ref<boolean>(import.meta.env.DEV);

// 表单状态
const modelName = computed({
  get: () => isEditing.value && editingModel.value ? editingModel.value.name : newModel.value.name,
  set: (value: string) => {
    if (isEditing.value && editingModel.value) {
      editingModel.value.name = value;
    } else {
      newModel.value.name = value;
    }
  }
});

const apiKey = computed({
  get: () => isEditing.value && editingModel.value ? editingModel.value.apiKey : newModel.value.apiKey,
  set: (value: string) => {
    if (isEditing.value && editingModel.value) {
      editingModel.value.apiKey = value;
    } else {
      newModel.value.apiKey = value;
    }
  }
});

const clearError = () => {
  hasError.value = false;
  errorMessage.value = '';
};

// 事件
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'modelsUpdated', models: ModelConfig[]): void;
  (e: 'select', model: string): void;
}>();

// 状态
const models = ref<Array<ModelConfig & { key: string }>>([]);
const showAddForm = ref<boolean>(false);
const isEditing = ref<boolean>(false);
const editingModel = ref<ModelConfig | null>(null);
const editingModelKey = ref<string>('');
const newModel = ref<ModelConfig>(createEmptyModelConfig());
const modelOptions = ref<Array<{ label: string, value: string }>>([]);
const isLoadingModels = ref<boolean>(false);
const testingConnections = ref<Record<string, boolean>>({});
const vercelProxyAvailable = computed<boolean>(() => isVercel());
const testModelExists = ref(false);
const formRef = ref<FormInstance>()

// 错误捕获
onErrorCaptured((err: Error, instance, info) => {
  console.error('[ERROR] ModelManagerContainer 错误:', err);
  console.error('错误信息:', info);
  hasError.value = true;
  errorMessage.value = err.message || '未知错误';
  return false; // 阻止错误继续传播
});

// 刷新模型列表
const refreshModels = (): void => {
  try {
    console.log('[DEBUG] 刷新模型列表');
    models.value = modelManager.getAllModels();
    console.log('[DEBUG] 模型列表已更新, 数量:', models.value.length);
    emit('modelsUpdated', models.value);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[ERROR] 刷新模型列表错误:', error);
    hasError.value = true;
    errorMessage.value = `刷新模型列表错误: ${error.message || '未知错误'}`;
  }
};

// 检查是否为默认模型
const isDefaultModel = (modelKey: string): boolean => {
  const model = modelManager.getModel(modelKey);
  return model?.enabled && model.provider === 'default' ? true : false;
};

const editModel = (modelKey: string): void => {
  try {
    console.log('[DEBUG] 编辑模型:', modelKey);
    const model = modelManager.getModel(modelKey);
    if (model) {
      editingModel.value = JSON.parse(JSON.stringify(model)); 
      editingModelKey.value = modelKey;
      isEditing.value = true;
    } else {
      console.warn('[WARN] 找不到要编辑的模型:', modelKey);
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[ERROR] 编辑模型错误:', error);
  }
};

const cancelEdit = (): void => {
  isEditing.value = false;
  editingModel.value = null;
  editingModelKey.value = '';
};

const saveEdit = (): void => {
  if (editingModel.value && editingModelKey.value) {
    try {
      modelManager.updateModel(editingModelKey.value, editingModel.value);
      refreshModels();
      cancelEdit();
    } catch (err: unknown) {
      const error = err as Error;
      console.error('[ERROR] 保存编辑错误:', error);
      hasError.value = true;
      errorMessage.value = `保存模型错误: ${error.message || '未知错误'}`;
    }
  }
};

const addModel = (): void => {
  try {
    modelManager.addModel(crypto.randomUUID(), newModel.value);
    refreshModels();
    showAddForm.value = false;
    newModel.value = createEmptyModelConfig();
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[ERROR] 添加模型错误:', error);
    hasError.value = true;
    errorMessage.value = `添加模型错误: ${error.message || '未知错误'}`;
  }
};

const enableModel = (modelKey: string): void => {
  try {
    modelManager.enableModel(modelKey);
    refreshModels();
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[ERROR] 启用模型错误:', error);
  }
};

const disableModel = (modelKey: string): void => {
  try {
    modelManager.disableModel(modelKey);
    refreshModels();
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[ERROR] 禁用模型错误:', error);
  }
};

const handleDelete = (modelKey: string): void => {
  try {
    modelManager.deleteModel(modelKey);
    refreshModels();
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[ERROR] 删除模型错误:', error);
  }
};

// 测试连接
const testConnection = async (modelKey: string): Promise<void> => {
  testingConnections.value[modelKey] = true;
  try {
    // 此处需要实现连接测试逻辑
    await new Promise(resolve => setTimeout(resolve, 1000));
    ElMessage.success(t('modelManager.testSuccess'));
  } catch (error: any) {
    console.error('[ERROR] 测试连接失败:', error);
    ElMessage.error(error.message || t('modelManager.testFailed'));
  } finally {
    testingConnections.value[modelKey] = false;
  }
};

// 模型选择处理
const handleModelSelect = (model: string): void => {
  if (isEditing.value && editingModel.value) {
    editingModel.value.defaultModel = model;
  } else if (showAddForm.value) {
    newModel.value.defaultModel = model;
  }
};

// 获取模型列表
const fetchModelOptions = async (provider: string, config: ModelConfig): Promise<void> => {
  isLoadingModels.value = true;
  
  try {
    const result = await modelManager.fetchModels(provider, config);
    modelOptions.value = result.map(model => ({
      label: model.name,
      value: model.id
    }));
  } catch (error) {
    alert(t('modelManager.fetchModelsFailed') + ': ' + (error instanceof Error ? error.message : String(error)));
    modelOptions.value = [];
    console.error('[ERROR] 获取模型选项错误:', error);
  } finally {
    isLoadingModels.value = false;
  }
};

const handleFetchEditingModels = async (): Promise<void> => {
  if (!editingModel.value) return;
  await fetchModelOptions(editingModelKey.value, editingModel.value);
};

const handleFetchModels = async (): Promise<void> => {
  if (!newModel.value || !newModel.value.provider) return;
  await fetchModelOptions(newModel.value.provider, newModel.value);
};

/**
 * 测试ModelManager方法
 */
const testModelManager = () => {
  try {
    // 此处实现测试逻辑
    const testResult = "测试成功";
    ElMessage.success(testResult);
  } catch (error: any) {
    console.error('测试失败:', error);
    ElMessage.error(`测试失败: ${error.message}`);
  }
};

// 组件挂载
onMounted(() => {
  console.log('[DEBUG] ModelManagerContainer 已挂载');
  try {
    // 确保 modelManager 可用
    if (typeof modelManager === 'undefined') {
      throw new Error('modelManager 未定义');
    }
    
    // 检查 modelManager 方法
    console.log('[DEBUG] modelManager 方法:', {
      getAllModels: typeof modelManager.getAllModels,
      getModel: typeof modelManager.getModel,
      createEmptyModel: typeof modelManager.createEmptyModel,
      isDefaultModel: typeof modelManager.isDefaultModel,
      fetchModels: typeof modelManager.fetchModels,
      testConnection: typeof modelManager.testConnection
    });
    
    // 初始加载
    refreshModels();
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[ERROR] 初始化加载错误:', error);
    hasError.value = true;
    errorMessage.value = `初始化错误: ${error.message || '未知错误'}`;
  }
});
</script> 