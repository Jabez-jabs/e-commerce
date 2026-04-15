# search_engine.py
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class SearchEngine:
    def __init__(self, products):
        self.products = products
        # Build corpus: name + brand + category + description
        self.corpus = [
            f"{p['name']} {p['brand']} {p['category']} {p['description']}"
            for p in products
        ]
        self.vectorizer = TfidfVectorizer(stop_words='english')
        self.tfidf_matrix = self.vectorizer.fit_transform(self.corpus)
        self.product_id_to_index = {p['id']: idx for idx, p in enumerate(products)}
        self.index_to_product_id = {idx: p['id'] for idx, p in enumerate(products)}

    def search(self, query, top_n=10):
        query_vec = self.vectorizer.transform([query])
        similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
        top_indices = np.argsort(similarities)[::-1][:top_n]
        results = []
        for idx in top_indices:
            if similarities[idx] > 0:
                product_id = self.index_to_product_id[idx]
                results.append({
                    "product_id": product_id,
                    "score": float(similarities[idx])
                })
        return results

    def get_similar_products(self, product_id, top_n=4):
        if product_id not in self.product_id_to_index:
            return []
        idx = self.product_id_to_index[product_id]
        sim_scores = cosine_similarity(self.tfidf_matrix[idx], self.tfidf_matrix).flatten()
        sim_scores[idx] = -1
        top_indices = np.argsort(sim_scores)[::-1][:top_n]
        similar = []
        for i in top_indices:
            if sim_scores[i] > 0:
                similar.append(self.index_to_product_id[i])
        return similar