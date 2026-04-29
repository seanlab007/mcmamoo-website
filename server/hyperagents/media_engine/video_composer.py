# File: server/hyperagents/media_engine/video_composer.py
import os
try:
    from moviepy.editor import ImageClip, AudioFileClip, CompositeVideoClip, TextClip, concatenate_videoclips
    from moviepy.video.tools.subtitles import SubtitlesClip
    HAS_MOVIEPY = True
except ImportError:
    HAS_MOVIEPY = False

def create_short_video(image_paths, audio_path, srt_path, output_path, bgm_path=None):
    """
    将图片序列、配音音频和字幕文件合成短视频。
    
    参数:
        image_paths: 图片路径列表 (建议每张图对应一个分镜)
        audio_path: 旁白配音路径
        srt_path: 字幕文件路径 (SRT 格式)
        output_path: 输出视频路径
        bgm_path: 可选背景音乐路径
    """
    if not HAS_MOVIEPY:
        return {"error": "MoviePy not installed. Please run 'pip install moviepy'"}

    # 1. 加载旁白音频并获取总时长
    voice_audio = AudioFileClip(audio_path)
    duration = voice_audio.duration

    # 2. 处理图片序列 (平滑过渡)
    # 计算每张图片的显示时长 (总时长 / 图片数量)
    img_duration = duration / len(image_paths)
    clips = [ImageClip(img).set_duration(img_duration).crossfadein(0.5) for img in image_paths]
    video_content = concatenate_videoclips(clips, method="compose")

    # 3. 添加字幕 (黑金风格)
    # 注意：TextClip 需要系统安装 ImageMagick
    try:
        generator = lambda txt: TextClip(
            txt, font='Arial-Bold', fontsize=40, color='#d4af37', 
            stroke_color='black', stroke_width=1, method='caption', size=(video_content.w*0.8, None)
        )
        subtitles = SubtitlesClip(srt_path, generator)
    except Exception as e:
        print(f"Warning: TextClip failed (likely ImageMagick missing): {e}")
        subtitles = None
    
    # 4. 合成音频 (旁白 + 背景音乐)
    final_audio = voice_audio
    if bgm_path and os.path.exists(bgm_path):
        try:
            bgm = AudioFileClip(bgm_path).volumex(0.1).set_duration(duration) # 背景音乐调低音量
            from moviepy.audio.AudioClip import CompositeAudioClip
            final_audio = CompositeAudioClip([voice_audio, bgm])
        except Exception as e:
            print(f"Warning: BGM mixing failed: {e}")

    # 5. 最终合成并导出
    clips_to_composite = [video_content]
    if subtitles:
        clips_to_composite.append(subtitles.set_position(('center', 'bottom')))
        
    final_video = CompositeVideoClip(clips_to_composite).set_audio(final_audio)

    final_video.write_videofile(output_path, fps=24, codec='libx264', audio_codec='aac')
    return output_path
