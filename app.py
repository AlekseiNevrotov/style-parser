from flask import Flask, request, jsonify
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)

@app.route('/api/parse', methods=['POST'])
def parse_css():
    data = request.get_json()
    if not data or 'url' not in data:
        return jsonify({'error': 'Параметр url обязателен'}), 400

    url = data['url']

    try:
        response = requests.get(url)
        response.raise_for_status()
    except requests.RequestException as e:
        return jsonify({'error': f'Не удалось загрузить страницу: {str(e)}'}), 400

    soup = BeautifulSoup(response.text, 'html.parser')

    # Собираем inline стили (все <style>)
    inline_styles = [style_tag.string for style_tag in soup.find_all('style') if style_tag.string]

    # Собираем внешние стили (href из <link rel="stylesheet">)
    external_stylesheets = [link['href'] for link in soup.find_all('link', rel='stylesheet') if link.get('href')]

    return jsonify({
        'inlineStyles': inline_styles,
        'externalStylesheets': external_stylesheets
    })


@app.route('/')
def home():
    return "Flask CSS Parser API работает"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)