import { defineEventHandler, readBody } from 'h3'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { name, contact, message, turnstileResponse } = body

  if (!contact || !message || !turnstileResponse) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: '缺少必要的字段（联系方式、留言内容或机器人验证）。',
    })
  }

  const secretKey = config.cloudflareTurnstileSecretKey
  const turnstileVerificationUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

  try {
    const verificationResponse = await $fetch(turnstileVerificationUrl, {
      method: 'POST',
      body: {
        secret: secretKey,
        response: turnstileResponse,
      },
    }) as any

    if (!verificationResponse.success) {
      console.error('Turnstile 验证失败:', verificationResponse['error-codes'])
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: '机器人验证失败，请重试。',
      })
    }
  } catch (error) {
    console.error('调用 Turnstile 验证 API 失败:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: '服务器无法完成机器人验证，请稍后再试。',
    })
  }

  const feishuWebhookUrl = config.feishuWebhookUrl
  const msgContent = {
    msg_type: 'text',
    content: {
      text: `【PM】\n姓名: ${name || '匿名'}\n联系方式: ${contact}\n留言内容:\n${message}`,
    },
  }

  try {
    const feishuResponse = await $fetch(feishuWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(msgContent),
    }) as any

    if (feishuResponse.code !== 0) {
      console.error('发送飞书消息失败:', feishuResponse)
      throw createError({
        statusCode: 500,
        statusMessage: 'Internal Server Error',
        message: '发送飞书消息失败，请联系管理员。',
      })
    }

    return { success: true, message: '消息已成功发送到飞书。' }
  } catch (error) {
    console.error('调用飞书 Webhook 失败:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: '服务器发送飞书消息时发生错误，请稍后再试。',
    })
  }
})