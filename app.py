# app.py
from flask import Flask, render_template, request, jsonify
from data_products import products
from search_engine import SearchEngine

app = Flask(__name__)

product_views = {p['id']: 0 for p in products}
search_engine = SearchEngine(products)

def get_dynamic_price(product, views):
    factor = min(views / 100, 0.5)
    new_price = product['base_price'] * (1 + factor)
    return round(new_price, 2)

def get_discounted_price(base_price, discount_percent):
    return round(base_price * (1 - discount_percent / 100), 2)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/product/<int:pid>')
def product_page(pid):
    return render_template('product.html', product_id=pid)

@app.route('/api/products')
def get_all_products():
    result = []
    for p in products:
        views = product_views.get(p['id'], 0)
        dynamic_price = get_dynamic_price(p, views)
        # Add discount %: random for demo, but here we simulate based on views
        # You can set a fixed discount in product data, but for variety:
        discount = min(5 + views // 20, 30)  # up to 30% off
        discounted_price = get_discounted_price(dynamic_price, discount)
        result.append({
            'id': p['id'],
            'name': p['name'],
            'brand': p['brand'],
            'category': p['category'],
            'description': p['description'],
            'base_price': p['base_price'],
            'dynamic_price': dynamic_price,
            'discount_percent': discount,
            'final_price': discounted_price,
            'rating': p['rating'],
            'reviews_count': p['reviews_count'],
            'stock': p['stock'],
            'delivery_days': p['delivery_days'],
            'image_url': p['image_url'],
            'views': views
        })
    return jsonify(result)

@app.route('/api/search')
def semantic_search():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])
    search_results = search_engine.search(query, top_n=10)
    enriched = []
    for res in search_results:
        pid = res['product_id']
        product = next(p for p in products if p['id'] == pid)
        views = product_views.get(pid, 0)
        dynamic_price = get_dynamic_price(product, views)
        discount = min(5 + views // 20, 30)
        discounted_price = get_discounted_price(dynamic_price, discount)
        enriched.append({
            'id': pid,
            'name': product['name'],
            'brand': product['brand'],
            'category': product['category'],
            'description': product['description'],
            'base_price': product['base_price'],
            'dynamic_price': dynamic_price,
            'discount_percent': discount,
            'final_price': discounted_price,
            'rating': product['rating'],
            'reviews_count': product['reviews_count'],
            'stock': product['stock'],
            'delivery_days': product['delivery_days'],
            'image_url': product['image_url'],
            'views': views,
            'similarity_score': res['score']
        })
    return jsonify(enriched)

@app.route('/api/product/<int:pid>')
def product_detail(pid):
    if pid in product_views:
        product_views[pid] += 1
    else:
        product_views[pid] = 1

    product = next((p for p in products if p['id'] == pid), None)
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    views = product_views[pid]
    dynamic_price = get_dynamic_price(product, views)
    discount = min(5 + views // 20, 30)
    discounted_price = get_discounted_price(dynamic_price, discount)

    similar_ids = search_engine.get_similar_products(pid, top_n=4)
    recommendations = []
    for sim_id in similar_ids:
        sim_prod = next(p for p in products if p['id'] == sim_id)
        sim_views = product_views.get(sim_id, 0)
        sim_dynamic = get_dynamic_price(sim_prod, sim_views)
        sim_discount = min(5 + sim_views // 20, 30)
        sim_final = get_discounted_price(sim_dynamic, sim_discount)
        recommendations.append({
            'id': sim_prod['id'],
            'name': sim_prod['name'],
            'brand': sim_prod['brand'],
            'base_price': sim_prod['base_price'],
            'dynamic_price': sim_dynamic,
            'final_price': sim_final,
            'discount_percent': sim_discount,
            'rating': sim_prod['rating'],
            'image_url': sim_prod['image_url']
        })

    return jsonify({
        'id': product['id'],
        'name': product['name'],
        'brand': product['brand'],
        'category': product['category'],
        'description': product['description'],
        'base_price': product['base_price'],
        'dynamic_price': dynamic_price,
        'discount_percent': discount,
        'final_price': discounted_price,
        'rating': product['rating'],
        'reviews_count': product['reviews_count'],
        'stock': product['stock'],
        'delivery_days': product['delivery_days'],
        'image_url': product['image_url'],
        'views': views,
        'recommendations': recommendations
    })

if __name__ == '__main__':
    app.run(debug=True)