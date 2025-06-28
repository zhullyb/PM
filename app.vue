<template>
  <div class="container">
    <div class="form-card">
      <h1 class="form-title">PM</h1>
      <p class="form-description">如果您需要及时联系我，请填写以下内容并发送。消息将会以强提醒方式向我推送。</p>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="name" class="form-label">您的称呼 (可选):</label>
          <input
            type="text"
            id="name"
            v-model="formData.name"
            class="form-input"
            placeholder="请输入您的称呼或昵称 (例如：张三)"
          />
        </div>

        <div class="form-group">
          <label for="contact" class="form-label">您的联系方式 (邮箱/论坛/IM软件):</label>
          <input
            type="text"
            id="contact"
            v-model="formData.contact"
            required
            class="form-input"
            placeholder="例如：your@email.com 或 知乎私信@张三"
          />
        </div>

        <div class="form-group">
          <label for="message" class="form-label">留言内容:</label>
          <textarea
            id="message"
            v-model="formData.message"
            rows="5"
            required
            class="form-textarea"
            placeholder="请简要描述您需要联系我的原因或内容..."
          ></textarea>
        </div>

        <div class="turnstile-container">
          <div id="cf-turnstile" :data-sitekey="siteKey"></div>
        </div>

        <div class="form-actions">
          <button
            type="submit"
            :disabled="isSubmitting"
            class="submit-button"
            :class="{ 'button-disabled': isSubmitting }"
          >
            {{ isSubmitting ? '发送中...' : '发送留言' }}
          </button>
        </div>

        <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRuntimeConfig } from '#app'

const runtimeConfig = useRuntimeConfig()
const siteKey = runtimeConfig.public.cloudflareTurnstileSiteKey

const formData = ref({
  name: '',
  contact: '',
  message: '',
})

const isSubmitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

let turnstileWidgetId = null;

// 在组件挂载后加载 Cloudflare Turnstile 脚本
onMounted(() => {
  const script = document.createElement('script')
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback'
  script.async = true
  script.defer = true
  document.head.appendChild(script)

  window.onloadTurnstileCallback = function() {
    turnstileWidgetId = window.turnstile.render('#cf-turnstile', {
      sitekey: siteKey,
      callback: function(token) {
      },
      'error-callback': function() {
        errorMessage.value = '机器人验证加载失败或出现错误，请刷新页面重试。';
      },
      'expired-callback': function() {
        errorMessage.value = '机器人验证已过期，请重新验证。';
      }
    });
  };
})

const handleSubmit = async () => {
  successMessage.value = ''
  errorMessage.value = ''
  isSubmitting.value = true

  const turnstileResponse = window.turnstile.getResponse(turnstileWidgetId);

  if (!turnstileResponse) {
    errorMessage.value = '请先完成机器人验证。';
    isSubmitting.value = false;
    return;
  }

  try {
    const response = await $fetch('/api/send-message', {
      method: 'POST',
      body: {
        ...formData.value,
        turnstileResponse: turnstileResponse,
      },
    })

    if (response.success) {
      successMessage.value = '留言发送成功！我收到消息后会尽快回复您。'
      formData.value = { name: '', contact: '', message: '' }
      window.turnstile.reset(turnstileWidgetId);
    } else {
      errorMessage.value = response.message || '发送失败，请稍后再试。'
    }
  } catch (error) {
    console.error('发送留言失败:', error)
    errorMessage.value = error.status === 400 ? error.data.message : '发送失败，网络错误或服务器问题。'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style>
body {
  margin: 0;
}

.container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
}

.form-card {
  background-color: white;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 28rem;
}

@media (max-width: 768px) {
  .container {
    background-color: white;
    align-items: flex-start;
    padding: 1rem;
  }
  
  .form-card {
    background-color: white;
    padding: 1rem;
    border-radius: 0;
    box-shadow: none;
    max-width: none;
  }
}

.form-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  text-align: center;
}

.form-description {
  margin-bottom: 1.5rem;
  text-align: center;
  color: #4b5563;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.form-input, .form-textarea {
  box-sizing: border-box;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  appearance: none;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  color: #374151;
  line-height: 1.25;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
}

.form-textarea {
  resize: none;
}

.turnstile-container {
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.submit-button {
  background-color: #3b82f6;
  color: white;
  font-weight: 700;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  border: none;
  width: 100%;
  cursor: pointer;
}

.submit-button:hover {
  background-color: #2563eb;
}

.submit-button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
}

.button-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.success-message {
  margin-top: 1rem;
  color: #059669;
  text-align: center;
}

.error-message {
  margin-top: 1rem;
  color: #dc2626;
  text-align: center;
}
</style>