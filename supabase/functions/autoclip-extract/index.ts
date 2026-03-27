// AutoClip 视频信息提取 - Supabase Edge Function
// 用于提取 YouTube/B站 视频的基本信息

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { video_url } = await req.json()

    if (!video_url) {
      return new Response(
        JSON.stringify({ error: '缺少 video_url 参数' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 提取视频ID和平台信息
    let platform = ''
    let videoId = ''

    // YouTube
    const youtubeMatch = video_url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
    if (youtubeMatch) {
      platform = 'youtube'
      videoId = youtubeMatch[1]
    }

    // B站
    const bilibiliMatch = video_url.match(/bilibili\.com\/video\/(BV[\w]+)/)
    if (bilibiliMatch) {
      platform = 'bilibili'
      videoId = bilibiliMatch[1]
    }

    // 抖音
    const douyinMatch = video_url.match(/douyin\.com\/video\/(\d+)/)
    if (douyinMatch) {
      platform = 'douyin'
      videoId = douyinMatch[1]
    }

    if (!platform) {
      return new Response(
        JSON.stringify({ error: '不支持的视频平台。支持: YouTube, B站, 抖音' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 根据平台构建嵌入URL
    let embedUrl = ''
    if (platform === 'youtube') {
      embedUrl = `https://www.youtube.com/embed/${videoId}`
    } else if (platform === 'bilibili') {
      embedUrl = `https://player.bilibili.com/player.html?bvid=${videoId}`
    } else if (platform === 'douyin') {
      embedUrl = `https://www.douyin.com/aweme/v1/web/aweme/detail/?aweme_id=${videoId}`
    }

    // 返回视频信息
    return new Response(
      JSON.stringify({
        success: true,
        platform,
        video_id: videoId,
        video_url,
        embed_url: embedUrl,
        message: `已识别 ${platform} 视频`,
        // AI切片功能需要完整后端服务
        ai_clip_available: false,
        ai_clip_message: 'AI智能切片功能需要部署完整AutoClip后端服务'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
