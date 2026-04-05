import os, subprocess, uuid, json, textwrap
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

OUTPUT_DIR = '/app/output'
os.makedirs(OUTPUT_DIR, exist_ok=True)

DEEPSEEK_KEY = os.environ.get('DEEPSEEK_API_KEY', 'sk-940f712454584ce1b906db510223ef61')

def generate_manim_code(explanation, topic):
    import urllib.request
    prompt = f"""你是一个 Manim (Community Edition) 专家。请根据以下数学讲解生成一段完整的 Manim Python 代码，用动画展示这个数学概念。

讲解内容："{explanation}"
知识点：{topic}

要求：
1. 使用 manim 社区版 (from manim import *)
2. 类名必须是 MathScene，继承 Scene
3. 在 construct 方法里写动画
4. 必须包含：
   - 标题文字（中文，用 Text 不要用 MathTex 写中文）
   - 坐标轴 (Axes)
   - 函数曲线 (plot)
   - 移动的点 (Dot) 沿曲线移动
   - 在点处画切线并实时更新
   - 显示导数/斜率数值
5. 动画时长控制在 8-10 秒
6. 颜色用 RED, YELLOW, BLUE, WHITE
7. 代码要能直接运行，不要有语法错误

只输出 Python 代码，不要任何解释。不要用 markdown 代码块。"""

    data = json.dumps({
        "model": "deepseek-chat",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
        "max_tokens": 2000,
    }).encode()

    req = urllib.request.Request(
        'https://api.deepseek.com/v1/chat/completions',
        data=data,
        headers={
            'Authorization': f'Bearer {DEEPSEEK_KEY}',
            'Content-Type': 'application/json',
        },
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        result = json.loads(resp.read())

    code = result['choices'][0]['message']['content'].strip()
    code = code.replace('```python', '').replace('```', '').strip()
    return code


FALLBACK_CODE = textwrap.dedent("""\
from manim import *

class MathScene(Scene):
    def construct(self):
        title = Text("导数：瞬时变化率", font_size=36, color=YELLOW)
        title.to_edge(UP)
        self.play(Write(title))

        axes = Axes(
            x_range=[-3, 3, 1],
            y_range=[-2, 10, 2],
            x_length=8,
            y_length=5,
            axis_config={"include_numbers": True, "font_size": 20},
        ).shift(DOWN * 0.3)
        labels = axes.get_axis_labels(x_label="x", y_label="f(x)")
        self.play(Create(axes), Write(labels))

        curve = axes.plot(lambda x: x**2, color=RED, x_range=[-2.8, 2.8])
        curve_label = MathTex("f(x) = x^2", color=RED, font_size=28).next_to(axes, RIGHT, buff=0.3).shift(UP)
        self.play(Create(curve), Write(curve_label))

        dot = Dot(color=YELLOW).move_to(axes.c2p(-2.5, (-2.5)**2))
        tangent = always_redraw(lambda: axes.get_secant_slope_group(
            x=axes.p2c(dot.get_center())[0],
            graph=curve,
            dx=0.01,
            secant_line_length=3,
            secant_line_color=BLUE,
        ))

        slope_text = always_redraw(lambda: MathTex(
            f"f'(x) = {2 * axes.p2c(dot.get_center())[0]:.1f}",
            color=BLUE, font_size=28
        ).next_to(dot, UR, buff=0.3))

        self.play(FadeIn(dot), Create(tangent), Write(slope_text))
        self.play(
            dot.animate.move_to(axes.c2p(2.5, (2.5)**2)),
            run_time=6,
            rate_func=linear,
        )
        self.wait(1)
""")


@app.route('/generate', methods=['POST'])
def generate():
    body = request.json or {}
    explanation = body.get('explanation', '导数就是变化的速度')
    topic = body.get('topic', '导数')

    job_id = str(uuid.uuid4())[:8]
    scene_dir = os.path.join(OUTPUT_DIR, job_id)
    os.makedirs(scene_dir, exist_ok=True)
    scene_file = os.path.join(scene_dir, 'scene.py')

    try:
        code = generate_manim_code(explanation, topic)
    except Exception:
        code = FALLBACK_CODE

    if 'class MathScene' not in code:
        code = FALLBACK_CODE

    with open(scene_file, 'w') as f:
        f.write(code)

    try:
        result = subprocess.run(
            ['manim', 'render', '-ql', '--format', 'mp4', scene_file, 'MathScene'],
            capture_output=True, text=True, timeout=120,
            cwd=scene_dir,
        )

        video_dir = os.path.join(scene_dir, 'media', 'videos', 'scene', '480p15')
        if not os.path.isdir(video_dir):
            for root, dirs, files in os.walk(scene_dir):
                for f in files:
                    if f.endswith('.mp4'):
                        return send_file(os.path.join(root, f), mimetype='video/mp4')
            return jsonify({'error': 'render failed', 'stderr': result.stderr[-500:]}), 500

        for f in os.listdir(video_dir):
            if f.endswith('.mp4'):
                return send_file(os.path.join(video_dir, f), mimetype='video/mp4')

        return jsonify({'error': 'no mp4 found', 'stderr': result.stderr[-500:]}), 500

    except subprocess.TimeoutExpired:
        return jsonify({'error': 'render timeout'}), 504
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'manim': True})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050, debug=False)
