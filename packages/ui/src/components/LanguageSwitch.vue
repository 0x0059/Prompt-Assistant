<!-- 语言切换组件 -->
<template>
  <button
    @click="toggleLanguage"
    class="theme-icon-button ml-auto"
    :aria-label="currentLocale === 'zh-CN' ? $t('language.switchToEnglish') : $t('language.switchToChinese')"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      <path d="M2 12h20"/>
    </svg>
    <span class="sr-only">{{ $t('language.switchLanguage') }}</span>
    <span class="text-sm max-md:hidden ml-2">{{ currentLocaleName }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Composer } from 'vue-i18n';

// 导入i18n实例，指定类型
const i18n = useI18n({
  useScope: 'global',
  inheritLocale: true
}) as Composer;

// 当前语言
const currentLocale = computed(() => i18n.locale.value);

// 当前语言显示名称
const currentLocaleName = computed(() => 
  currentLocale.value === 'zh-CN' ? 
    i18n.t('language.chinese') : 
    i18n.t('language.english')
);

/**
 * 切换语言并保存用户偏好
 */
const toggleLanguage = () => {
  const newLocale = currentLocale.value === 'zh-CN' ? 'en-US' : 'zh-CN';
  i18n.locale.value = newLocale;
  localStorage.setItem('preferred-language', newLocale);
};
</script> 